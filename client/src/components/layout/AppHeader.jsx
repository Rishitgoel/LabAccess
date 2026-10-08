import { ChevronDown, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function AppHeader({
  role,
  onViewRequests,
  onOptions,
  onReset,
  publicPage,
  registration,
  user,
  onLogout,
  logoutBusy,
}) {
  const profile = useRef(null);
  const { pathname } = useLocation();
  const profileName = user?.name ?? `Demo ${role}`;
  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <header className="app-header">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="app-header__inner">
        <Link to="/" className="brand" aria-label="LA LabAccess resources">
          <span className="brand__mark" aria-hidden="true">
            LA
          </span>
          {" "}
          <span>LabAccess</span>
        </Link>
        {publicPage ? (
          <div className="public-nav">
            <span>{registration ? "Already a member?" : "New here?"}</span>
            <Link to={registration ? "/login" : "/register"}>
              {registration ? "Sign in" : "Create account"}
            </Link>
          </div>
        ) : (
          <>
            <nav aria-label="Main navigation">
              <Link
                className="nav-link"
                to="/"
                aria-current={pathname === "/" ? "page" : undefined}
              >
                Resources
              </Link>
              {user ? (
                <Link
                  className="nav-link"
                  to={role === "reviewer" ? "/review" : "/requests"}
                  aria-current={
                    pathname.startsWith("/requests") ||
                    (role === "reviewer" && pathname === "/review")
                      ? "page"
                      : undefined
                  }
                >
                  {role === "reviewer" ? "Review queue" : "My requests"}
                </Link>
              ) : (
                onViewRequests && (
                  <Button
                    className="nav-link"
                    variant="ghost"
                    onClick={onViewRequests}
                  >
                    {role === "reviewer" ? "Review queue" : "My requests"}
                  </Button>
                )
              )}
            </nav>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={profile}
                  className="profile-button"
                  variant="ghost"
                  disabled={logoutBusy}
                  aria-label={`${initials} ${profileName}, open profile menu`}
                >
                  <span className="avatar">
                    {initials}
                  </span>
                  <span className="profile-button__name">
                    {profileName}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user ? `${user.name} · ${role}` : "Fixture preview"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem disabled={logoutBusy} onSelect={onLogout}>
                    Sign out
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      onSelect={() => onOptions(profile.current)}
                    >
                      <SlidersHorizontal />
                      Preview options
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onReset}>
                      <RotateCcw />
                      Reset preview
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
