const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch (networkErr) {
    const err = new Error("Can't reach the TalentGraph API. Is the server running?");
    err.cause = networkErr;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),
  listJobs: () => request("/jobs"),
  getJob: (id) => request(`/jobs/${id}`),
  getJobMatches: (id) => request(`/jobs/${id}/matches`),
  listCandidates: () => request("/candidates"),
  getCandidate: (id) => request(`/candidates/${id}`),
};
