import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { entranceMotion } from "@/lib/motion";
import { AppHeader } from "@/components/layout/AppHeader";
export function AuthLayout({ registration, children }) {
  const reduced = useReducedMotion();
  return (
    <>
      <AppHeader publicPage registration={registration} />
      <main id="main-content" tabIndex={-1} className="auth-container">
        <motion.section className="auth-card" {...entranceMotion(reduced)}>
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
        </motion.section>
      </main>
    </>
  );
}
