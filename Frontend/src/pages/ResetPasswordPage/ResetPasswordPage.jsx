import { Link } from "react-router";
import * as authService from "../../services/authService";
import "./ResetPasswordPage.css";
import AuthForm from "../../components/common/AuthForm/AuthForm";

export default function ResetPassword() {
  const { resetPassword } = authService;
  return (
    <AuthForm
      title="Reset your password"
      subtitle="Enter your email to receive a password reset link."
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "you@example.com",
          autoComplete: "email",
        },
      ]}
      submitLabel="Send reset link"
      onSubmit={async ({ email }) => {
        const data = await resetPassword(email);
        return (
          <>
            <p>{data.message}</p>
            <p className="auth-success-hint">
              The link expires in 1 hour. Check your spam folder if you don't
              see it.
            </p>
          </>
        );
      }}
    >
      <div className="auth-links-section">
        <p className="auth-links">
          Login to your account <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-links">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </AuthForm>
  );
}
