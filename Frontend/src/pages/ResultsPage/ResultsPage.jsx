import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getAnalysis, getResumeFileUrl } from "../../services/resumeService";
import ResumeViewer from "./ResumeViewer";
import "./ResultsPage.css";
import NewSkillsCard from "./NewSkillsCard";

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 2 * 60 * 1000;

const ERROR_MESSAGES = {
  not_configured: "Analysis is temporarily unavailable.",
  busy: "The analyzer is busy right now. Please try again in a minute.",
  unavailable: "Unable to reach the analyzer. Please try again later.",
  refused: "Unable to analyze this resume.",
  cut_off: "Unable to finish the analysis. Please try again.",
  invalid_response:
    "Unable to analyze due to an unexpected response. Please try again.",
  unknown: "Something went wrong while analyzing your resume.",
};

function scoreBand(score) {
  if (score >= 85) return { label: "Strong match", tone: "good" };
  if (score >= 70) return { label: "Competitive, some gaps", tone: "ok" };
  if (score >= 50) return { label: "Significant gaps", tone: "weak" };
  return { label: "Poor fit", tone: "poor" };
}

function skillName(item) {
  return typeof item === "string" ? item : item.skill;
}

function ListCard({ title, items, ordered = false }) {
  if (!items || items.length === 0) return null;
  const ListTag = ordered ? "ol" : "ul";
  return (
    <section className="results-card">
      <h2>{title}</h2>
      <ListTag className="results-list">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ListTag>
    </section>
  );
}

function ResultsPage() {
  const { id } = useParams();

  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer;
    const startedAt = Date.now();

    async function check() {
      try {
        const data = await getAnalysis(id);
        if (cancelled) return;
        setAnalysis(data);
        if (data.status === "processing") {
          if (Date.now() - startedAt > MAX_WAIT_MS) {
            setTimedOut(true); // stop polling
          } else {
            timer = setTimeout(check, POLL_INTERVAL_MS);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!analysis) return <p>Loading…</p>;

  if (analysis.status === "processing") {
    return timedOut ? (
      <p className="error">
        This is taking longer than expected. Try refreshing in a minute.
      </p>
    ) : (
      <p>Analyzing your resume…</p>
    );
  }

  const { resume, result } = analysis;

  if (analysis.status === "failed") {
    return (
      <section className="results-page">
        <h1>Analysis failed</h1>
        <p className="error">
          {ERROR_MESSAGES[analysis.error] ?? ERROR_MESSAGES.unknown}
        </p>
        <Link to="/upload">Try another resume</Link>
      </section>
    );
  }

  const band = scoreBand(result.match_score);

  return (
    <section className="results-page">
      <div className="results-grid">
        <div className="results-column results-column--left">
          <section className="results-card">
            <p className="score-label">
              {analysis.job_posting ? "Match score" : "Resume score"}
            </p>
            <p className="score-value">
              {result.match_score}
              <span className="score-out-of">/100</span>
            </p>
            <span className={`score-badge score-badge--${band.tone}`}>
              {band.label}
            </span>
            <p className="results-summary">{result.summary}</p>
          </section>

          {result.matched_skills?.length > 0 && (
            <section className="results-card">
              <h2>Matched skills</h2>
              <div className="chip-list">
                {result.matched_skills.map((item, index) => (
                  <span key={index} className="chip chip--matched">
                    {skillName(item)}
                  </span>
                ))}
              </div>
            </section>
          )}

          <NewSkillsCard matchedSkills={(result.matched_skills ?? []).map(skillName)} />

          {result.missing_skills?.length > 0 && (
            <section className="results-card">
              <h2>Missing skills</h2>
              <div className="chip-list">
                {result.missing_skills.map((skill, index) => (
                  <span key={index} className="chip chip--missing">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="results-column results-column--resume">
          <div className="resume-toolbar">
            <span>Your resume</span>
          </div>
          <ResumeViewer fileUrl={getResumeFileUrl(resume.id)} />
        </div>

        <div className="results-column results-column--right">
          <ListCard title="Suggestions" items={result.suggestions} ordered />
          <ListCard title="Why this score" items={result.rationale} />

          {analysis.job_posting && (
            <details className="results-card job-posting">
              <summary>Job posting you compared against</summary>
              <p>{analysis.job_posting}</p>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
// I hate frontend so much - Gavin

export default ResultsPage;
