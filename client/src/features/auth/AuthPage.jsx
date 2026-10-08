import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useSession } from "./SessionProvider";
import { AuthLayout } from "./AuthLayout";
export default function AuthPage({ registration = false }) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const form = useRef(null);
  useEffect(() => {
    const first = Object.keys(fields)[0];
    if (!busy && first) form.current?.elements[first]?.focus();
  }, [fields, busy]);
  const { login } = useSession();
  const navigate = useNavigate(),
    location = useLocation();
  async function submit(event) {
    event.preventDefault();
    setError("");
    setFields({});
    if (registration && values.password !== values.confirm) {
      setFields({ confirm: "Passwords must match." });
      form.current.elements.confirm.focus();
      return;
    }
    setBusy(true);
    try {
      if (registration) {
        await api("/auth/register", {
          method: "POST",
          body: {
            name: values.name,
            email: values.email,
            password: values.password,
          },
        });
        navigate("/login", { replace: true, state: { registered: true } });
      } else {
        await login({ email: values.email, password: values.password });
        navigate("/", { replace: true });
      }
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function field(name, label, type, autoComplete) {
    const isPassword = type === "password";
    return (
      <div className="auth-field" key={name}>
        <label htmlFor={name}>{label}</label>
        <div className="auth-input-wrap">
          <Input
            id={name}
            name={name}
            type={isPassword && visible ? "text" : type}
            autoComplete={autoComplete}
            required
            value={values[name]}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                [name]: event.target.value,
              }))
            }
            aria-invalid={Boolean(fields[name])}
            aria-describedby={
              [
                fields[name] && `${name}-error`,
                name === "password" && "password-hint",
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            disabled={busy}
          />
          {name === "password" && (
            <Button
              type="button"
              variant="ghost"
              className="password-toggle"
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          )}
        </div>
        {fields[name] && (
          <p className="field-error" id={`${name}-error`}>
            {fields[name]}
          </p>
        )}
        {name === "password" && (
          <p className="auth-hint" id="password-hint">
            Use 12–128 characters. Spaces are preserved.
          </p>
        )}
      </div>
    );
  }
  return (
    <AuthLayout registration={registration}>
      <h1>{registration ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-intro">
        {registration
          ? "Join as a learner to request resources."
          : "Sign in to your learning workspace."}
      </p>
      {location.state?.registered && (
        <p role="status" className="notice">
          Account created. Sign in to continue.
        </p>
      )}
      <form ref={form} onSubmit={submit} aria-busy={busy}>
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        {registration && field("name", "Full name", "text", "name")}
        {field("email", "Email", "email", "username")}
        {field(
          "password",
          "Password",
          "password",
          registration ? "new-password" : "current-password",
        )}
        {registration &&
          field("confirm", "Confirm password", "password", "new-password")}
        <Button type="submit" className="auth-submit" disabled={busy}>
          {busy ? "Please wait…" : registration ? "Create account" : "Sign in"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </AuthLayout>
  );
}
