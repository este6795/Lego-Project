import { useCallback, useEffect, useState } from "react";
import {
  addSkill as addSkillRequest,
  deleteSkill as deleteSkillRequest,
  getSkills,
  importSkills as importSkillsRequest,
} from "../services/profileService";

// The backend returns skills sorted by name, ignoring case. Keep the same order locally.
function sortSkills(list) {
  return [...list].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
}

function useSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSkills()
      .then((data) => {
        if (!cancelled) setSkills(sortSkills(data));
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addSkill = useCallback(async (name) => {
    const created = await addSkillRequest(name);
    setSkills((current) => sortSkills([...current, created]));
    return created;
  }, []);

  const removeSkill = useCallback(async (id) => {
    await deleteSkillRequest(id);
    setSkills((current) => current.filter((skill) => skill.id !== id));
  }, []);

// Saves several skills at once. Resolves to { added, skipped } from the backend.
  const importSkills = useCallback(async (names) => {
    const result = await importSkillsRequest(names);
    setSkills((current) => sortSkills([...current, ...result.added]));
    return result;
  }, []);
 
  return { skills, loading, error, addSkill, removeSkill, importSkills };
}

export default useSkills;