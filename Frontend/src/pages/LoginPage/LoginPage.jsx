import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AuthForm from "../../components/common/AuthForm/AuthForm";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <AuthForm
      title="Log in to your account"
      subtitle="Access your account to manage your profile."
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "you@example.com",
          autoComplete: "email",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
          placeholder: "At least 8 characters",
          autoComplete: "new-password",
        },
      ]}
      submitLabel="Log in"
      onSubmit={async ({ email, password }) => {
        try {
          await login(email, password);
          navigate("/history", { replace: true });
        } catch (error) {
          //TODO:  QA. Test this stuff
          console.error("Login failed:", error);
        }
      }}
    >
      <div className="auth-links-section">
        <p className="auth-links">
          Forgot your password? <Link to="/reset-password">Reset it</Link>
        </p>
        <p className="auth-links">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </AuthForm>
  );
}

export default LoginPage;
