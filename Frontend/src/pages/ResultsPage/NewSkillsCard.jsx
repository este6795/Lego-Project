import { useState } from "react";
import useSkills from "../../hooks/useskills";
import AddToProfileModal from "./AddToProfileModal";
import "./NewSkillsCard.css";

// Trim, collapse spaces and drop repeats (ignoring case), keeping the first spelling.
function uniqueNames(names) {
  const seen = new Set();
  const result = [];
  for (const raw of names) {
    const name = String(raw ?? "").trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function savedMessage({ added, skipped }) {
  if (added.length === 0) {
    const allDuplicates =
      skipped.length > 0 && skipped.every((item) => item.reason === "duplicate");
    return allDuplicates
      ? "Those skills were already in your profile."
      : "No skills were saved.";
  }
  const saved = `Saved ${added.length} ${added.length === 1 ? "skill" : "skills"} to your profile.`;
  return skipped.length > 0 ? `${saved} ${skipped.length} skipped.` : saved;
}

// Matched skills from the analysis that aren't in the user's profile yet, with a
// button to save them. Shows nothing if the profile can't be loaded or there is
// nothing new, so it never gets in the way of the results.
function NewSkillsCard({ matchedSkills = [] }) {
  const { skills, loading, error, importSkills } = useSkills();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (loading || error) return null;

  const saved = new Set(skills.map((skill) => skill.name.toLowerCase()));
  const newSkills = uniqueNames(matchedSkills).filter(
    (name) => !saved.has(name.toLowerCase()),
  );

  if (newSkills.length === 0 && !message) return null;

  async function handleSave(names) {
    const result = await importSkills(names);
    setMessage(savedMessage(result));
    setOpen(false);
  }

  return (
    <section className="results-card new-skills-card">
      <div className="new-skills-header">
        <h2>New skills</h2>
        {newSkills.length > 0 && (
          <button
            type="button"
            className="new-skills-save"
            onClick={() => setOpen(true)}
          >
            Save to profile
          </button>
        )}
      </div>

      {newSkills.length > 0 && (
        <>
          <p className="new-skills-hint">
            Matched skills that aren't in your profile yet.
          </p>
          <div className="chip-list">
            {newSkills.map((name) => (
              <span key={name} className="chip chip--new">
                {name}
              </span>
            ))}
          </div>
        </>
      )}

      {message && (
        <p className="new-skills-message" role="status">
          {message}
        </p>
      )}

      {open && (
        <AddToProfileModal
          candidates={newSkills}
          onSave={handleSave}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

export default NewSkillsCard;