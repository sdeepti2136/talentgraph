import { NavLink } from "react-router-dom";
import { useApiData } from "../useApiData";
import { api } from "../api";

export function NavBar() {
  const { data, error } = useApiData(() => api.health(), []);
  const connected = data?.db?.connected;

  let statusClass = "db-status";
  let statusText = "checking…";
  if (error) {
    statusClass += " error";
    statusText = "api unreachable";
  } else if (data) {
    statusClass += connected ? " connected" : " error";
    statusText = connected ? "cognodb connected" : "cognodb unreachable";
  }

  return (
    <div className="nav">
      <div className="nav-brand">
        <span className="node-dot" aria-hidden="true" />
        TalentGraph
      </div>
      <div className="nav-links">
        <NavLink to="/" end>Jobs</NavLink>
        <NavLink to="/candidates">Candidates</NavLink>
      </div>
      <div className={statusClass}>
        <span className="dot" />
        <span className="mono">{statusText}</span>
      </div>
    </div>
  );
}
