import { Link, useParams } from "react-router";
import { confirmPasswordReset } from "../../services/authService";
import AuthForm from "../../components/common/AuthForm/AuthForm";

export default function ResetPasswordConfirmPage() {
  const { uid, token } = useParams();

  return (
    <AuthForm
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      fields={[
        {
          name: "password",
          label: "New password",
          type: "password",
          required: true,
          placeholder: "At least 8 characters",
          autoComplete: "new-password",
        },
        {
          name: "confirmPassword",
          label: "Confirm new password",
          type: "password",
          required: true,
          placeholder: "Type it again",
          autoComplete: "new-password",
          validate: (value, all) =>
            value !== all.password ? "Passwords don't match." : "",
        },
      ]}
      submitLabel="Update password"
      onSubmit={async ({ password }) => {
        const data = await confirmPasswordReset(uid, token, password);
        return (
          <>
            <p>{data.message}</p>
            <p>
              <Link to="/login">Log in with your new password</Link>
            </p>
          </>
        );
      }}
    >
      <div className="auth-links-section">
        <p className="auth-links">
          Link expired? <Link to="/reset-password">Request a new one</Link>
        </p>
      </div>
    </AuthForm>
  );
}
