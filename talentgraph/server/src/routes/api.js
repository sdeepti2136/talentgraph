import { Router } from "express";
import { runQuery, getConnectionStatus } from "../db/driver.js";
import * as Q from "../db/queries.js";

export const router = Router();

// Wrap async route handlers so DB errors fall through to the error middleware
// instead of crashing the process — this is where "DB unreachable" becomes a
// clean 503 instead of an unhandled rejection.
const withDb = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (err) {
    next(err);
  }
};

router.get("/health", (req, res) => {
  res.json({ ok: true, db: getConnectionStatus() });
});

router.get(
  "/skills",
  withDb(async (req, res) => {
    const records = await runQuery(Q.LIST_SKILLS);
    res.json(records.map((r) => r.get("name")));
  })
);

router.get(
  "/jobs",
  withDb(async (req, res) => {
    const records = await runQuery(Q.LIST_JOBS);
    res.json(
      records.map((r) => ({
        id: r.get("id"),
        title: r.get("title"),
        location: r.get("location"),
        postedDate: r.get("postedDate"),
        company: r.get("company"),
        industry: r.get("industry"),
        skills: r.get("skills"),
      }))
    );
  })
);

router.get(
  "/jobs/:id",
  withDb(async (req, res) => {
    const records = await runQuery(Q.GET_JOB, { jobId: req.params.id });
    if (records.length === 0) return res.status(404).json({ error: "Job not found" });
    const r = records[0];
    res.json({
      id: r.get("id"),
      title: r.get("title"),
      description: r.get("description"),
      location: r.get("location"),
      postedDate: r.get("postedDate"),
      company: r.get("company"),
      industry: r.get("industry"),
      skills: r.get("skills").filter((s) => s.name),
    });
  })
);

router.get(
  "/jobs/:id/matches",
  withDb(async (req, res) => {
    const [direct, adjacent] = await Promise.all([
      runQuery(Q.MATCH_CANDIDATES_FOR_JOB, { jobId: req.params.id }),
      runQuery(Q.ADJACENT_CANDIDATES_FOR_JOB, { jobId: req.params.id }),
    ]);
    res.json({
      direct: direct.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        location: r.get("location"),
        yearsExperience: r.get("yearsExperience"),
        matchedSkills: r.get("matchedSkills"),
        matchedCount: r.get("matchedCount").toNumber?.() ?? r.get("matchedCount"),
        totalRequired: r.get("totalRequired").toNumber?.() ?? r.get("totalRequired"),
        score: r.get("score").toNumber?.() ?? r.get("score"),
        pastCompanies: r.get("pastCompanies"),
      })),
      adjacent: adjacent.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        missingSkill: r.get("missingSkill"),
        hasInstead: r.get("hasInstead"),
      })),
    });
  })
);

router.get(
  "/candidates",
  withDb(async (req, res) => {
    const records = await runQuery(Q.LIST_CANDIDATES);
    res.json(
      records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        location: r.get("location"),
        yearsExperience: r.get("yearsExperience"),
        skills: r.get("skills"),
      }))
    );
  })
);

router.get(
  "/candidates/:id",
  withDb(async (req, res) => {
    const records = await runQuery(Q.GET_CANDIDATE, { candidateId: req.params.id });
    if (records.length === 0) return res.status(404).json({ error: "Candidate not found" });
    const r = records[0];
    const similar = await runQuery(Q.SIMILAR_CANDIDATES, { candidateId: req.params.id });
    res.json({
      id: r.get("id"),
      name: r.get("name"),
      email: r.get("email"),
      location: r.get("location"),
      yearsExperience: r.get("yearsExperience"),
      skills: r.get("skills").filter((s) => s.name),
      workHistory: r.get("workHistory").filter((w) => w.company),
      similarCandidates: similar.map((s) => ({
        id: s.get("id"),
        name: s.get("name"),
        sharedSkills: s.get("sharedSkills").toNumber?.() ?? s.get("sharedSkills"),
        overlap: s.get("overlap"),
      })),
    });
  })
);

// Centralized error handling: DB-unreachable errors become a 503 with a
// message the UI can show as a friendly empty/error state, everything
// else is a generic 500 without leaking internals.
router.use((err, req, res, next) => {
  if (err.code === "DB_UNAVAILABLE") {
    return res.status(503).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});
