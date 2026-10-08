import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { SessionProvider, useSession } from "@/features/auth/SessionProvider";
import AuthPage from "@/features/auth/AuthPage";
import CatalogPage from "@/features/resources/CatalogPage";
import RequestListPage from "@/features/requests/RequestListPage";
import RequestDetailPage from "@/features/requests/RequestDetailPage";
import { RouteState } from "@/components/feedback/RouteState";
import { RouteFocus } from "@/components/layout/RouteFocus";
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
      <main
        id="main-content"
        tabIndex={-1}
        className="session-state"
        role="status"
      >
        Checking your session…
      </main>
    );
  if (error)
    return (
      <main id="main-content" tabIndex={-1} className="session-state">
        <h1>Could not connect</h1>
        <p role="alert">{error.message}</p>
        <Button onClick={refresh}>Try again</Button>
      </main>
    );
  if (publicPage) return user ? <Navigate to="/" replace /> : children;
  if (!user) return <Navigate to="/login" replace />;
  if (role && role !== user.role) return <RouteState denied />;
  return children;
}
function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <SessionProvider>
          <RouteFocus />
          <Routes>
            <Route
              path="/requests"
              element={
                <Guard role="learner">
                  <RequestListPage />
                </Guard>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <Guard>
                  <RequestDetailPage />
                </Guard>
              }
            />
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
                  <RequestListPage review />
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
            <Route path="*" element={<RouteState />} />
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
