import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import useSkills from "../../hooks/useskills";
import SkillBank from "./Skillbank";

function SkillBankContent() {
  const { skills, loading, error, addSkill, removeSkill } = useSkills();

  if (loading) return <p>Loading your skills…</p>;
  if (error)
    return <p className="error">Could not load your skills: {error.message}</p>;

  return <SkillBank skills={skills} onAdd={addSkill} onDelete={removeSkill} />;
}

function SkillBankPage() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return <SkillBankContent />;
}

export default SkillBankPage;
