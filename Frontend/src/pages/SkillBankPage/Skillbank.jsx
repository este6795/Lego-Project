import { useState } from "react";
import "./Skillbankpage.css";

const MAX_SKILL_CHARS = 60;

function SkillBank({ skills = [], onAdd, onDelete }) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (!cleaned) return;

    // Same rule as the backend: ignore case when checking for duplicates.
    if (skills.some((skill) => skill.name.toLowerCase() === cleaned.toLowerCase())) {
      setError(`${cleaned} is already in your skills.`);
      return;
    }

    setAdding(true);
    setError("");
    try {
      await onAdd(cleaned);
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(skill) {
    setDeletingId(skill.id);
    setError("");
    try {
      await onDelete(skill.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="skill-bank">
      <section className="skill-bank-header">
        <h1>Skill Bank</h1>
        <p>
          Skills you've saved to your profile. They stay here even if you
          delete a resume.
        </p>
      </section>

      <section className="skill-bank-card">
        <form className="skill-bank-form" onSubmit={handleSubmit}>
          <label htmlFor="skill-name" className="skill-bank-label">
            Add a skill
          </label>
          <div className="skill-bank-form-row">
            <input
              id="skill-name"
              className="skill-bank-input"
              type="text"
              value={name}
              maxLength={MAX_SKILL_CHARS}
              placeholder="e.g. Python, SQL, Figma"
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit" disabled={adding || !name.trim()}>
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        </form>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {skills.length === 0 ? (
          <p className="empty-note">
            You haven't saved any skills yet. Add the ones you have above.
          </p>
        ) : (
          <>
            <p className="skill-bank-count">
              {skills.length} {skills.length === 1 ? "skill" : "skills"}
            </p>
            <ul className="skill-list">
              {skills.map((skill) => (
                <li className="skill-chip" key={skill.id}>
                  <span>{skill.name}</span>
                  <button
                    type="button"
                    className="skill-chip-remove"
                    onClick={() => handleDelete(skill)}
                    disabled={deletingId === skill.id}
                    aria-label={`Remove ${skill.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default SkillBank;