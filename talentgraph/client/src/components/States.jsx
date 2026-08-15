export function Loading({ rows = 3 }) {
  return (
    <div className="card-list" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-block" role="alert">
      <div className="state-title">The graph didn't respond</div>
      <p>{message || "Something went wrong reaching CognoDB."}</p>
      {onRetry && (
        <button className="chip" style={{ marginTop: 14 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="state-block">
      <div className="state-title">{title}</div>
      <p>{body}</p>
    </div>
  );
}
