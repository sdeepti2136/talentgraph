/**
 * Loads realistic seed data into CognoDB: companies, skills, candidates,
 * job postings, and the relationships between them. Safe to re-run —
 * it clears existing app data first (MATCH (n) DETACH DELETE n) so you
 * always start from a known state.
 *
 * Usage: npm run seed   (from server/, with .env configured)
 */
import "dotenv/config";
import { driver, verifyConnectivity, closeDriver } from "../db/driver.js";

const companies = [
  { name: "Nimbus Cloud Systems", industry: "Cloud Infrastructure" },
  { name: "Verdant Analytics", industry: "Data & AI" },
  { name: "Kestrel Fintech", industry: "Financial Technology" },
  { name: "Orchard Health", industry: "Healthtech" },
  { name: "Lattice Logistics", industry: "Supply Chain" },
  { name: "Bramble Retail Co.", industry: "E-commerce" },
  { name: "Solace Robotics", industry: "Robotics" },
  { name: "Foundry Studios", industry: "Gaming" },
  { name: "Halcyon Security", industry: "Cybersecurity" },
  { name: "Meridian EdTech", industry: "Education Technology" },
];

const skills = [
  "React", "Node.js", "Python", "Django", "Java", "Spring Boot",
  "PostgreSQL", "MySQL", "MongoDB", "GraphQL", "REST API Design",
  "TensorFlow", "PyTorch", "Machine Learning", "Docker", "Kubernetes",
  "AWS", "GCP", "Cypher / Graph DBs", "TypeScript", "Go", "System Design",
];

// Skill adjacency — used for the "adjacent match" query (RELATED_TO).
// Bidirectional-in-spirit; we create one directed edge per pair and match
// with an undirected pattern in Cypher.
const relatedSkills = [
  ["PostgreSQL", "MySQL"],
  ["MySQL", "MongoDB"],
  ["TensorFlow", "PyTorch"],
  ["Machine Learning", "TensorFlow"],
  ["Machine Learning", "PyTorch"],
  ["Docker", "Kubernetes"],
  ["AWS", "GCP"],
  ["React", "TypeScript"],
  ["Node.js", "TypeScript"],
  ["Java", "Spring Boot"],
  ["Python", "Django"],
  ["REST API Design", "GraphQL"],
  ["System Design", "Kubernetes"],
];

const firstNames = [
  "Aanya", "Rohan", "Priya", "Karthik", "Meera", "Vikram", "Sneha", "Arjun",
  "Divya", "Nikhil", "Pooja", "Sanjay", "Ishita", "Rahul", "Ananya", "Varun",
  "Kavya", "Aditya", "Riya", "Manoj", "Tanvi", "Siddharth", "Neha", "Aryan",
];
const lastNames = [
  "Rao", "Sharma", "Reddy", "Iyer", "Nair", "Gupta", "Menon", "Verma",
  "Krishnan", "Chatterjee", "Pillai", "Desai",
];
const locations = [
  "Hyderabad", "Bengaluru", "Pune", "Chennai", "Remote", "Mumbai", "Delhi NCR",
];

function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildCandidates(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[randInt(0, lastNames.length - 1)];
    const name = `${first} ${last}`;
    const yearsExperience = randInt(0, 9);
    const candSkills = pick(skills, randInt(3, 6)).map((s) => ({
      name: s,
      proficiency: pick(["beginner", "intermediate", "advanced"], 1)[0],
      yearsUsed: randInt(1, Math.max(1, yearsExperience)),
    }));
    const workHistory = pick(companies, randInt(1, 3)).map((c) => ({
      company: c.name,
      title: pick(
        ["Software Engineer", "Backend Developer", "Data Analyst", "Full-Stack Developer", "ML Engineer", "DevOps Engineer"],
        1
      )[0],
      startDate: `${2018 + randInt(0, 6)}-0${randInt(1, 9)}`,
      endDate: Math.random() > 0.3 ? `${2021 + randInt(0, 4)}-0${randInt(1, 9)}` : null,
    }));
    list.push({
      id: `cand-${i + 1}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      location: pick(locations, 1)[0],
      yearsExperience,
      skills: candSkills,
      workHistory,
    });
  }
  return list;
}

const jobTitles = [
  "Full-Stack Software Engineer",
  "Data Analyst",
  "Machine Learning Engineer",
  "Backend Developer (Node.js)",
  "Platform / DevOps Engineer",
  "Graph Systems Engineer",
  "Junior Software Developer",
  "AI Applications Engineer",
];

function buildJobs(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const company = pick(companies, 1)[0];
    const reqSkills = pick(skills, randInt(3, 5)).map((s, idx) => ({
      name: s,
      importance: idx === 0 ? "must-have" : pick(["must-have", "nice-to-have"], 1)[0],
    }));
    list.push({
      id: `job-${i + 1}`,
      title: jobTitles[i % jobTitles.length],
      description: `${company.name} is hiring a ${jobTitles[i % jobTitles.length]} to join their ${company.industry} team, working across the stack with real production data.`,
      location: pick(locations, 1)[0],
      postedDate: `2026-0${randInt(6, 8)}-${String(randInt(1, 28)).padStart(2, "0")}`,
      company: company.name,
      skills: reqSkills,
    });
  }
  return list;
}

async function seed() {
  const ok = await verifyConnectivity();
  if (!ok) {
    console.error("Aborting seed — could not connect to CognoDB. Check your .env file.");
    process.exit(1);
  }

  const session = driver.session();
  try {
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints...");
    await session.run("CREATE CONSTRAINT candidate_id IF NOT EXISTS FOR (c:Candidate) REQUIRE c.id IS UNIQUE");
    await session.run("CREATE CONSTRAINT company_name IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE");
    await session.run("CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE");
    await session.run("CREATE CONSTRAINT job_id IF NOT EXISTS FOR (j:JobPosting) REQUIRE j.id IS UNIQUE");

    console.log("Loading companies...");
    for (const c of companies) {
      await session.run(
        "MERGE (c:Company {name: $name}) SET c.industry = $industry",
        c
      );
    }

    console.log("Loading skills...");
    for (const s of skills) {
      await session.run("MERGE (s:Skill {name: $name})", { name: s });
    }

    console.log("Loading skill relationships...");
    for (const [a, b] of relatedSkills) {
      await session.run(
        `MATCH (a:Skill {name: $a}), (b:Skill {name: $b})
         MERGE (a)-[:RELATED_TO]->(b)`,
        { a, b }
      );
    }

    const candidates = buildCandidates(28);
    console.log(`Loading ${candidates.length} candidates...`);
    for (const cand of candidates) {
      await session.run(
        `MERGE (c:Candidate {id: $id})
         SET c.name = $name, c.email = $email, c.location = $location, c.yearsExperience = $yearsExperience`,
        cand
      );
      for (const s of cand.skills) {
        await session.run(
          `MATCH (c:Candidate {id: $id}), (s:Skill {name: $sname})
           MERGE (c)-[hs:HAS_SKILL]->(s)
           SET hs.proficiency = $proficiency, hs.yearsUsed = $yearsUsed`,
          { id: cand.id, sname: s.name, proficiency: s.proficiency, yearsUsed: s.yearsUsed }
        );
      }
      for (const w of cand.workHistory) {
        await session.run(
          `MATCH (c:Candidate {id: $id}), (comp:Company {name: $company})
           MERGE (c)-[w:WORKED_AT]->(comp)
           SET w.title = $title, w.startDate = $startDate, w.endDate = $endDate`,
          { id: cand.id, ...w }
        );
      }
    }

    const jobs = buildJobs(8);
    console.log(`Loading ${jobs.length} job postings...`);
    for (const job of jobs) {
      await session.run(
        `MERGE (j:JobPosting {id: $id})
         SET j.title = $title, j.description = $description, j.location = $location, j.postedDate = $postedDate`,
        job
      );
      await session.run(
        `MATCH (j:JobPosting {id: $id}), (c:Company {name: $company})
         MERGE (j)-[:POSTED_BY]->(c)`,
        { id: job.id, company: job.company }
      );
      for (const s of job.skills) {
        await session.run(
          `MATCH (j:JobPosting {id: $id}), (s:Skill {name: $sname})
           MERGE (j)-[r:REQUIRES_SKILL]->(s)
           SET r.importance = $importance`,
          { id: job.id, sname: s.name, importance: s.importance }
        );
      }
    }

    console.log("Seed complete.");
  } finally {
    await session.close();
    await closeDriver();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
