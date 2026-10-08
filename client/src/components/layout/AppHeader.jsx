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
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a href="/" className="brand" aria-label="LabAccess resources">
          <span className="brand__mark">LA</span>
          <span>LabAccess</span>
        </a>
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
                  aria-current={pathname !== "/" ? "page" : undefined}
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
                  aria-label={
                    user ? "Open profile menu" : "Open demo profile menu"
                  }
                >
                  <span className="avatar">
                    {user
                      ? user.name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                      : "DL"}
                  </span>
                  <span className="profile-button__name">
                    {user?.name ?? `Demo ${role}`}
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
