import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { JobsPage } from "./pages/JobsPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CandidateDetailPage } from "./pages/CandidateDetailPage";
import "./styles.css";

export default function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <Routes>
        <Route path="/" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/:id" element={<CandidateDetailPage />} />
      </Routes>
    </div>
  );
}
