import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./NewSkillsCard.css";

const MAX_SKILL_CHARS = 60;

function cleanName(name) {
  return name.trim().replace(/\s+/g, " ");
}

// Confirmation step for saving skills to the profile. Nothing is saved until the
// user presses the save button; onSave(names) does the request and may throw.
function AddToProfileModal({ candidates, onSave, onClose }) {
  const [items, setItems] = useState(() =>
    candidates.map((name) => ({ name, checked: true })),
  );
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const titleId = useId();
  const extraId = useId();

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const selected = items.filter((item) => item.checked);

  function toggle(name) {
    setItems((current) =>
      current.map((item) =>
        item.name === name ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  function handleAddExtra(event) {
    event.preventDefault();
    const cleaned = cleanName(extra);
    if (!cleaned) return;

    setItems((current) => {
      const existing = current.find(
        (item) => item.name.toLowerCase() === cleaned.toLowerCase(),
      );
      // Already in the list: just make sure it is ticked instead of adding it twice.
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, checked: true } : item,
        );
      }
      return [...current, { name: cleaned, checked: true }];
    });
    setExtra("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave(selected.map((item) => item.name));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget && !saving) onClose();
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <h2 id={titleId}>Add skills to your profile</h2>
        <p className="modal-hint">
          Choose the skills you want to save. Nothing is saved until you
          confirm.
        </p>

        <ul className="modal-skill-list">
          {items.map((item) => (
            <li key={item.name}>
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={saving}
                  onChange={() => toggle(item.name)}
                />
                {item.name}
              </label>
            </li>
          ))}
        </ul>

        <form className="modal-extra-form" onSubmit={handleAddExtra}>
          <label htmlFor={extraId}>Add a skill I have</label>
          <div className="modal-extra-row">
            <input
              id={extraId}
              className="modal-input"
              type="text"
              value={extra}
              maxLength={MAX_SKILL_CHARS}
              placeholder="e.g. Figma"
              autoComplete="off"
              disabled={saving}
              onChange={(event) => setExtra(event.target.value)}
            />
            <button type="submit" disabled={saving || !extra.trim()}>
              Add
            </button>
          </div>
        </form>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="modal-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selected.length === 0}
          >
            {saving
              ? "Saving…"
              : `Save ${selected.length} ${selected.length === 1 ? "skill" : "skills"}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AddToProfileModal;