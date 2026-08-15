import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useApiData } from "../useApiData";
import { Loading, ErrorState, EmptyState } from "../components/States";
import { MatchPath } from "../components/MatchPath";

export function JobDetailPage() {
  const { id } = useParams();
  const job = useApiData(() => api.getJob(id), [id]);
  const matches = useApiData(() => api.getJobMatches(id), [id]);

  return (
    <div>
      <Link to="/" className="back-link">&larr; All jobs</Link>

      {job.loading && <Loading rows={1} />}
      {job.error && <ErrorState message={job.error.message} onRetry={job.reload} />}

      {job.data && (
        <div className="page-header">
          <div className="page-eyebrow">{job.data.company} · {job.data.industry}</div>
          <h1 className="page-title">{job.data.title}</h1>
          <p className="page-subtitle">{job.data.description}</p>
          <div className="chip-row" style={{ marginTop: 16 }}>
            {job.data.skills.map((s) => (
              <span className={`chip ${s.importance === "must-have" ? "must" : ""}`} key={s.name}>
                {s.name} {s.importance === "must-have" ? "· must-have" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="section-label">Matched candidates</div>

      {matches.loading && <Loading rows={4} />}
      {matches.error && <ErrorState message={matches.error.message} onRetry={matches.reload} />}
      {matches.data && matches.data.direct.length === 0 && (
        <EmptyState
          title="No candidates traverse to this role yet"
          body="No one in the graph currently holds any of the required skills."
        />
      )}

      {matches.data && matches.data.direct.length > 0 && (
        <div className="card-list">
          {matches.data.direct.map((c) => (
            <Link to={`/candidates/${c.id}`} className="card match-card" key={c.id}>
              <div>
                <div className="job-title">{c.name}</div>
                <div className="job-meta">
                  {c.location} · {c.yearsExperience} yrs experience
                  {c.pastCompanies.length > 0 && ` · previously at ${c.pastCompanies.slice(0, 2).join(", ")}`}
                </div>
                <MatchPath matchedSkills={c.matchedSkills} totalRequired={c.totalRequired} />
              </div>
              <div className="score-badge">
                <span className="num mono">{c.matchedCount}/{c.totalRequired}</span>
                <span className="label">skills matched</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {matches.data && matches.data.adjacent.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 32 }}>
            Adjacent matches — related skills, not a direct hit
          </div>
          <p className="page-subtitle" style={{ marginBottom: 16 }}>
            These candidates don't hold a required skill outright, but hold something
            related to it (e.g. MySQL instead of PostgreSQL) — worth a look if the direct
            pool is thin.
          </p>
          <div className="card-list">
            {matches.data.adjacent.map((c) => (
              <Link to={`/candidates/${c.id}`} className="card" key={`${c.id}-${c.missingSkill}`}>
                <div className="job-title">{c.name}</div>
                <div className="job-meta">
                  Missing <span className="mono">{c.missingSkill}</span> — has{" "}
                  <span className="mono" style={{ color: "var(--cyan)" }}>{c.hasInstead}</span> instead
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
