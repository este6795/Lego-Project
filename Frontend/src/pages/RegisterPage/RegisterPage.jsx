import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AuthForm from "../../components/common/AuthForm/AuthForm";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  return (
    <AuthForm
      title="Create your account"
      subtitle="Get feedback on your resume in minutes."
      fields={[
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Your name",
          autoComplete: "name",
        },
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
      submitLabel="Create account"
      onSubmit={async ({ name, email, password }) => {
        await register(name, email, password);

        navigate("/profile", { replace: true }); // auth form will handle displaying success/error message if it throws
      }}
    >
      <p className="auth-links">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthForm>
  );
}

export default RegisterPage;
