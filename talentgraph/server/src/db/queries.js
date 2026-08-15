/**
 * All Cypher used by the app lives here, one query per named export.
 * Every query is parameterized — callers pass a `params` object and the
 * driver binds it, so nothing is ever string-concatenated into Cypher.
 */

export const LIST_SKILLS = `
  MATCH (s:Skill)
  RETURN s.name AS name
  ORDER BY s.name
`;

export const LIST_JOBS = `
  MATCH (j:JobPosting)-[:POSTED_BY]->(c:Company)
  OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
  RETURN j.id AS id, j.title AS title, j.location AS location,
         j.postedDate AS postedDate, c.name AS company, c.industry AS industry,
         collect(DISTINCT s.name) AS skills
  ORDER BY j.postedDate DESC
`;

export const GET_JOB = `
  MATCH (j:JobPosting {id: $jobId})-[:POSTED_BY]->(c:Company)
  OPTIONAL MATCH (j)-[r:REQUIRES_SKILL]->(s:Skill)
  RETURN j.id AS id, j.title AS title, j.description AS description,
         j.location AS location, j.postedDate AS postedDate,
         c.name AS company, c.industry AS industry,
         collect({name: s.name, importance: r.importance}) AS skills
`;

export const LIST_CANDIDATES = `
  MATCH (cand:Candidate)
  OPTIONAL MATCH (cand)-[:HAS_SKILL]->(s:Skill)
  RETURN cand.id AS id, cand.name AS name, cand.location AS location,
         cand.yearsExperience AS yearsExperience,
         collect(DISTINCT s.name) AS skills
  ORDER BY cand.name
`;

export const GET_CANDIDATE = `
  MATCH (cand:Candidate {id: $candidateId})
  OPTIONAL MATCH (cand)-[hs:HAS_SKILL]->(s:Skill)
  OPTIONAL MATCH (cand)-[w:WORKED_AT]->(comp:Company)
  RETURN cand.id AS id, cand.name AS name, cand.email AS email,
         cand.location AS location, cand.yearsExperience AS yearsExperience,
         collect(DISTINCT {name: s.name, proficiency: hs.proficiency, yearsUsed: hs.yearsUsed}) AS skills,
         collect(DISTINCT {company: comp.name, title: w.title, startDate: w.startDate, endDate: w.endDate}) AS workHistory
`;

/**
 * Core matching query — this is the one a relational schema would find
 * genuinely awkward. For a given job posting it does a 2-hop traversal
 * out to the required skills, then a 2-hop traversal back in through
 * candidates who hold those skills, scores by how much of the requirement
 * is covered (weighted by importance), and — as a second, independent
 * traversal — pulls in candidates who don't hold the skill directly but
 * hold something RELATED_TO it, surfaced as "adjacent" matches.
 * Doing this with foreign-key joins would mean a variable number of
 * self-joins on a candidate_skills bridge table, one per required skill,
 * with no clean way to also express the "related skill" fallback without
 * a recursive CTE per skill.
 */
export const MATCH_CANDIDATES_FOR_JOB = `
  MATCH (j:JobPosting {id: $jobId})-[req:REQUIRES_SKILL]->(reqSkill:Skill)
  WITH j, collect({skill: reqSkill, importance: req.importance}) AS requirements,
       count(reqSkill) AS totalRequired
  MATCH (cand:Candidate)-[hs:HAS_SKILL]->(reqSkill:Skill)<-[:REQUIRES_SKILL]-(j)
  WITH cand, requirements, totalRequired,
       collect({skill: reqSkill.name, proficiency: hs.proficiency}) AS matchedDirect,
       sum(CASE WHEN reqSkill.name IN [r IN requirements WHERE r.importance = 'must-have' | r.skill.name]
                THEN 2 ELSE 1 END) AS score
  OPTIONAL MATCH (cand)-[:WORKED_AT]->(comp:Company)
  WITH cand, requirements, totalRequired, matchedDirect, score,
       collect(DISTINCT comp.name) AS pastCompanies
  RETURN cand.id AS id, cand.name AS name, cand.location AS location,
         cand.yearsExperience AS yearsExperience,
         [m IN matchedDirect | m.skill] AS matchedSkills,
         size(matchedDirect) AS matchedCount, totalRequired AS totalRequired,
         score AS score, pastCompanies AS pastCompanies
  ORDER BY score DESC, matchedCount DESC
  LIMIT 25
`;

/**
 * Second traversal: candidates who are missing a required skill outright
 * but hold a RELATED_TO skill instead — e.g. a job wants "PostgreSQL" and
 * a candidate has "MySQL" (RELATED_TO PostgreSQL). This is a 3-hop path
 * (JobPosting -> Skill -> Skill -> Candidate) that would require a
 * self-referencing skill-adjacency table plus another bridge join in SQL.
 */
export const ADJACENT_CANDIDATES_FOR_JOB = `
  MATCH (j:JobPosting {id: $jobId})-[:REQUIRES_SKILL]->(reqSkill:Skill)
  MATCH (reqSkill)-[:RELATED_TO]-(nearSkill:Skill)<-[:HAS_SKILL]-(cand:Candidate)
  WHERE NOT (cand)-[:HAS_SKILL]->(reqSkill)
  RETURN DISTINCT cand.id AS id, cand.name AS name,
         reqSkill.name AS missingSkill, nearSkill.name AS hasInstead
  LIMIT 15
`;

/**
 * Candidate-to-candidate similarity via shared skills — used on the
 * candidate detail page to show "people with an overlapping skill set".
 * A 2-hop symmetric traversal (Candidate -> Skill <- Candidate) that's
 * a classic graph-native pattern.
 */
export const SIMILAR_CANDIDATES = `
  MATCH (cand:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(other:Candidate)
  WHERE other.id <> $candidateId
  WITH other, count(DISTINCT s) AS sharedSkills, collect(DISTINCT s.name) AS overlap
  RETURN other.id AS id, other.name AS name, sharedSkills, overlap
  ORDER BY sharedSkills DESC
  LIMIT 8
`;

export const HEALTH_COUNT = `
  MATCH (n)
  RETURN count(n) AS nodeCount
`;
