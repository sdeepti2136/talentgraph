import { Link } from "react-router-dom";
import { api } from "../api";
import { useApiData } from "../useApiData";
import { Loading, ErrorState, EmptyState } from "../components/States";

export function JobsPage() {
  const { data: jobs, loading, error, reload } = useApiData(() => api.listJobs(), []);

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Open roles · graph-matched</div>
        <h1 className="page-title">Job postings</h1>
        <p className="page-subtitle">
          Pick a role to see candidates ranked by an actual traversal of the skills graph —
          not a keyword match against a résumé blob.
        </p>
      </div>

      {loading && <Loading rows={5} />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {!loading && !error && jobs?.length === 0 && (
        <EmptyState title="No roles posted yet" body="Run the seed script to load sample data." />
      )}

      {!loading && !error && jobs?.length > 0 && (
        <div className="card-list">
          {jobs.map((job) => (
            <Link to={`/jobs/${job.id}`} className="card job-card" key={job.id}>
              <div className="job-card-top">
                <div>
                  <div className="job-title">{job.title}</div>
                  <div className="job-meta">
                    {job.company} · {job.industry} · {job.location}
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {job.postedDate}
                </span>
              </div>
              <div className="chip-row">
                {job.skills.slice(0, 6).map((s) => (
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
