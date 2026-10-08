import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { SessionProvider, useSession } from "@/features/auth/SessionProvider";
import AuthPage from "@/features/auth/AuthPage";
import CatalogPage from "@/features/resources/CatalogPage";
const PreviewCatalog = React.lazy(() => import("./PreviewCatalog"));
import { Button } from "@/components/ui/button";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/dm-serif-display/400.css";
import "../styles/global.css";
function Guard({ publicPage, role, children }) {
  const { loading, user, error, refresh } = useSession();
  if (loading)
    return (
      <main className="session-state" role="status">
        Checking your session…
      </main>
    );
  if (error)
    return (
      <main className="session-state">
        <h1>Could not connect</h1>
        <p role="alert">{error.message}</p>
        <Button onClick={refresh}>Try again</Button>
      </main>
    );
  if (publicPage) return user ? <Navigate to="/" replace /> : children;
  if (!user) return <Navigate to="/login" replace />;
  if (role && role !== user.role)
    return (
      <main className="session-state">
        <h1>Access denied</h1>
        <p>This page is available to reviewers.</p>
        <a href="/">Return to resources</a>
      </main>
    );
  return children;
}
function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route
              path="/"
              element={
                <Guard>
                  <CatalogPage />
                </Guard>
              }
            />
            <Route
              path="/login"
              element={
                <Guard publicPage>
                  <AuthPage key="login" />
                </Guard>
              }
            />
            <Route
              path="/register"
              element={
                <Guard publicPage>
                  <AuthPage key="register" registration />
                </Guard>
              }
            />
            <Route
              path="/review"
              element={
                <Guard role="reviewer">
                  <main className="session-state">
                    <h1>Review queue</h1>
                    <p>
                      The request workflow will be connected in the next phases.
                    </p>
                    <a href="/">Return to resources</a>
                  </main>
                </Guard>
              }
            />
            <Route
              path="/preview"
              element={
                <React.Suspense
                  fallback={
                    <main className="session-state" role="status">
                      Loading preview…
                    </main>
                  }
                >
                  <PreviewCatalog />
                </React.Suspense>
              }
            />
            <Route
              path="*"
              element={
                <main className="session-state">
                  <h1>Page not found</h1>
                  <a href="/">Return to resources</a>
                </main>
              }
            />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
const root =
  import.meta.hot?.data.root ?? createRoot(document.getElementById("root"));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
