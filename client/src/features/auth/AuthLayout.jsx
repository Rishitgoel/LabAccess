import { Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
export function AuthLayout({ registration, children }) {
  return (
    <>
      <AppHeader publicPage registration={registration} />
      <main className="auth-container">
        <section className="auth-card">
          <div className="auth-art" aria-hidden="true">
            <h2>
              {registration ? (
                <>
                  Your learning
                  <br />
                  starts here.
                </>
              ) : (
                <>
                  A clearer path
                  <br />
                  to learning.
                </>
              )}
            </h2>
            <p>Request resources. Track decisions.</p>
            <img src="/assets/labaccess-hero.png" alt="" />
          </div>
          <div className="auth-form-panel">
            {children}
            <p className="auth-switch">
              {registration ? "Already have an account?" : "New to LabAccess?"}{" "}
              <Link to={registration ? "/login" : "/register"}>
                {registration ? "Sign in" : "Create account"}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
