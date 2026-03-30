import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { es } from "@/i18n/es";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Scale,
  Briefcase,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: es.nav.dashboard, icon: LayoutDashboard },
  { to: "/cases", label: es.nav.cases, icon: Scale },
  { to: "/matters", label: es.nav.matters, icon: Briefcase },
  { to: "/persons", label: es.nav.people, icon: Users },
  { to: "/calendar", label: es.nav.calendar, icon: Calendar },
  { to: "/filings", label: es.nav.filings, icon: FileText },
  { to: "/reports", label: es.nav.reports, icon: BarChart3 },
  { to: "/settings", label: es.nav.settings, icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();

  const firmInitials = user?.firm.name
    ? user.firm.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "EJ";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo and firm name */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
          {firmInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.firm.name}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">
            {user?.firstName} {user?.lastName}
          </span>
        </button>
      </div>
    </div>
  );
}
