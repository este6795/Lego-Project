import { useState } from "react";
import { Link } from "react-router";
import "./AnalysisHistory.css";

function StatusBadge({ entry }) {
  if (entry.status === "processing") {
    return <span className="analysis-status analysis-status--processing">Analyzing…</span>;
  }
  if (entry.status === "failed") {
    return <span className="analysis-status analysis-status--failed">Failed</span>;
  }
  return <span className="analysis-score">{entry.matchScore}%</span>;
}

function AnalysisHistory({ analyses = [], onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(entry) {
    const confirmed = window.confirm(
      `Delete the analysis for "${entry.resumeFileName}"? This can't be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(entry.id);
    setDeleteError("");
    try {
      await onDelete(entry.id);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="analysis-history">
      <section className="analysis-history-header">
        <h1>Analysis History</h1>
        <p>Every resume analysis you've run, all in one place.</p>
      </section>

      {deleteError && <p className="error">{deleteError}</p>}

      {analyses.length === 0 ? (
        <p className="empty-note">
          You haven't analyzed a resume yet.{" "}
          <Link to="/upload">Upload one</Link> to run your first analysis.
        </p>
      ) : (
        <div className="analysis-list">
          {analyses.map((entry) => (
            <div className="analysis-card-wrap" key={entry.id}>
              <Link to={`/results/${entry.id}`} className="analysis-card">
                <div className="analysis-card-header">
                  <h2 title={entry.resumeFileName}>{entry.resumeFileName}</h2>
                  <StatusBadge entry={entry} />
                </div>
                <p className="analysis-subtext">
                  {entry.hasJobPosting ? "Job match" : "General review"} ·{" "}
                  {entry.analyzedDate}
                </p>
                {entry.status === "done" && entry.skillsTotal > 0 && (
                  <p className="analysis-skills">
                    {entry.hasJobPosting
                      ? `Matched ${entry.skillsMatched} of ${entry.skillsTotal} skills`
                      : `${entry.skillsMatched} strong skills, ${entry.skillsTotal - entry.skillsMatched} to build`}
                  </p>
                )}
                <span className="analysis-card-link">View full results →</span>
              </Link>

              {onDelete && (
                <button
                  type="button"
                  className="analysis-delete"
                  onClick={() => handleDelete(entry)}
                  disabled={deletingId === entry.id}
                  aria-label={`Delete analysis for ${entry.resumeFileName}`}
                >
                  {deletingId === entry.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnalysisHistory;
