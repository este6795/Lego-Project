import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import "./Profile.css";

function getInitial(user) {
  return (user.name || user.email || "?")[0].toUpperCase();
}

function ProfilePage() {
  const { user, loading, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [accountError, setAccountError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account and all of your resumes and analyses? This can't be undone.",
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    setAccountError("");
    try {
      await deleteAccount();
      navigate("/register", { replace: true });
    } catch (err) {
      setAccountError(err.message);
      setDeletingAccount(false);
    }
  }

  if (loading) return <p>Loading profile…</p>;
  if (!user) return <Navigate to="/history" replace />;

  return (
    <div className="profile">
      <section className="profile-card profile-account">
        <div className="profile-avatar">{getInitial(user)}</div>
        <div className="profile-account-details">
          <h1>{user.name || "Your account"}</h1>
          <p className="profile-email">{user.email}</p>
        </div>
      </section>

      <section className="profile-card profile-danger">
        <div>
          <h2>Delete account</h2>
          <p className="profile-muted">
            Permanently deletes your account, resumes, and analyses.
          </p>
          {accountError && <p className="profile-error">{accountError}</p>}
        </div>
        <button
          type="button"
          className="profile-danger-button"
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
        >
          {deletingAccount ? "Deleting…" : "Delete account"}
        </button>
      </section>
    </div>
  );
}

export default ProfilePage;
