import { useId, useState } from "react";
import "./AuthForm.css";

export default function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  onSubmit,
  children,
}) {
  const idPrefix = useId();

  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successContent, setSuccessContent] = useState(null);

  function handleChange(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    if (fieldErrors[name])
      setFieldErrors((previous) => ({ ...previous, [name]: "" }));
    if (formError) setFormError("");
  }

  function validate() {
    const errors = {};
    for (const field of fields) {
      const value = values[field.name];
      if (field.required && !value.trim()) {
        errors[field.name] = `${field.label} is required.`;
      } else if (field.validate) {
        const message = field.validate(value, values);
        if (message) errors[field.name] = message;
      }
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFormError("");
    try {
      const result = await onSubmit(values);
      if (result) setSuccessContent(result);
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        {(title || subtitle) && (
          <div className="auth-header">
            {title && <h1 className="auth-title">{title}</h1>}
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>
        )}

        {successContent ? (
          <div className="auth-success">{successContent}</div>
        ) : (
          <>
            {fields.map((field) => {
              const inputId = `${idPrefix}-${field.name}`;
              const errorId = `${inputId}-error`;
              const error = fieldErrors[field.name];

              return (
                <div className="auth-field" key={field.name}>
                  <label htmlFor={inputId}>{field.label}</label>
                  <input
                    id={inputId}
                    name={field.name}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`auth-input${error ? " auth-input--invalid" : ""}`}
                  />
                  {error && (
                    <span id={errorId} className="auth-field-error">
                      {error}
                    </span>
                  )}
                </div>
              );
            })}

            {formError && (
              <p className="auth-form-error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "Please wait…" : submitLabel}
            </button>
          </>
        )}

        {children}
      </form>
    </div>
  );
}
