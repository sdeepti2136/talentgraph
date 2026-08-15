/**
 * Renders the literal graph path a match came from:
 * Candidate --- skill --- skill --- Job
 * Gold dots are matched required skills, dim rose dots are still-open
 * requirements. This exists to make the "why a graph database" pitch
 * visible, not just written in the README — the UI shows the traversal
 * that produced the ranking instead of a bare score.
 */
export function MatchPath({ matchedSkills, totalRequired }) {
  const missingCount = Math.max(0, totalRequired - matchedSkills.length);
  const nodes = [
    ...matchedSkills.map((name) => ({ name, hit: true })),
    ...Array.from({ length: missingCount }).map(() => ({ name: null, hit: false })),
  ];

  return (
    <div className="match-path" title={`${matchedSkills.length} of ${totalRequired} required skills matched`}>
      <span className="match-path-node candidate" aria-hidden="true" />
      {nodes.map((n, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <span className={`match-path-line ${n.hit ? "hit" : ""}`} />
          <span
            className={`match-path-node ${n.hit ? "skill-hit" : "skill-miss"}`}
            title={n.hit ? n.name : "requirement not met"}
          />
        </span>
      ))}
      <span className="match-path-line hit" />
      <span className="match-path-node job" aria-hidden="true" />
    </div>
  );
}
