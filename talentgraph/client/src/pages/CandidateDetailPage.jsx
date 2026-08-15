import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useApiData } from "../useApiData";
import { Loading, ErrorState } from "../components/States";

export function CandidateDetailPage() {
  const { id } = useParams();
  const { data: c, loading, error, reload } = useApiData(() => api.getCandidate(id), [id]);

  return (
    <div>
      <Link to="/candidates" className="back-link">&larr; All candidates</Link>

      {loading && <Loading rows={2} />}
      {error && <ErrorState message={error.message} onRetry={reload} />}

      {c && (
        <>
          <div className="page-header">
            <div className="page-eyebrow">{c.location} · {c.yearsExperience} yrs experience</div>
            <h1 className="page-title">{c.name}</h1>
            <p className="page-subtitle mono">{c.email}</p>
          </div>

          <div className="detail-grid">
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="section-label">Skills</div>
                <div className="chip-row">
                  {c.skills.map((s) => (
                    <span className="chip matched" key={s.name} title={`${s.proficiency}, ${s.yearsUsed} yrs`}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="section-label">Work history</div>
                {c.workHistory.map((w, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-title">{w.title}</div>
                    <div className="timeline-sub">
                      {w.company} · {w.startDate} &ndash; {w.endDate || "present"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="section-label">People with an overlapping skill set</div>
              <p className="page-subtitle" style={{ marginBottom: 16 }}>
                Found by traversing shared <span className="mono">HAS_SKILL</span> edges — no
                separate similarity index needed.
              </p>
              {c.similarCandidates.length === 0 && (
                <div className="state-block">
                  <div className="state-title">No overlap found</div>
                  <p>Nobody else in the graph currently shares a skill with this candidate.</p>
                </div>
              )}
              <div className="card-list">
                {c.similarCandidates.map((s) => (
                  <Link to={`/candidates/${s.id}`} className="card" key={s.id}>
                    <div className="job-card-top">
                      <div className="job-title">{s.name}</div>
                      <span className="mono" style={{ fontSize: 12, color: "var(--gold)" }}>
                        {s.sharedSkills} shared
                      </span>
                    </div>
                    <div className="chip-row">
                      {s.overlap.map((sk) => (
                        <span className="chip" key={sk}>{sk}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
