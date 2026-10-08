import { ChevronDown, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function AppHeader({ role, onViewRequests, onOptions, onReset }) {
  const profile = useRef(null);
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a href="/" className="brand" aria-label="LabAccess resources">
          <span className="brand__mark">LA</span>
          <span>LabAccess</span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-link" href="/" aria-current="page">
            Resources
          </a>
          <Button className="nav-link" variant="ghost" onClick={onViewRequests}>
            {role === "reviewer" ? "Review queue" : "My requests"}
          </Button>
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={profile}
              className="profile-button"
              variant="ghost"
              aria-label="Open demo profile menu"
            >
              <span className="avatar">DL</span>
              <span className="profile-button__name">Demo {role}</span>
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Fixture preview</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onOptions(profile.current)}>
              <SlidersHorizontal />
              Preview options
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onReset}>
              <RotateCcw />
              Reset preview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
