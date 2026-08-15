import { Link } from "react-router-dom";
import { api } from "../api";
import { useApiData } from "../useApiData";
import { Loading, ErrorState, EmptyState } from "../components/States";

export function CandidatesPage() {
  const { data: candidates, loading, error, reload } = useApiData(() => api.listCandidates(), []);

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Talent pool</div>
        <h1 className="page-title">Candidates</h1>
        <p className="page-subtitle">
          Browse the pool directly, or open a profile to see who else shares their skill set.
        </p>
      </div>

      {loading && <Loading rows={6} />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {!loading && !error && candidates?.length === 0 && (
        <EmptyState title="No candidates yet" body="Run the seed script to load sample data." />
      )}

      {!loading && !error && candidates?.length > 0 && (
        <div className="card-list">
          {candidates.map((c) => (
            <Link to={`/candidates/${c.id}`} className="card job-card" key={c.id}>
              <div className="job-card-top">
                <div>
                  <div className="job-title">{c.name}</div>
                  <div className="job-meta">{c.location} · {c.yearsExperience} yrs experience</div>
                </div>
              </div>
              <div className="chip-row">
                {c.skills.slice(0, 6).map((s) => (
                  <span className="chip" key={s}>{s}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
