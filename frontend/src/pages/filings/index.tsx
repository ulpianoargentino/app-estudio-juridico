import { NavLink, Outlet } from "react-router-dom";
import { es } from "@/i18n/es";
import { cn } from "@/lib/utils";
import { FilePlus, LayoutTemplate } from "lucide-react";

const tabs = [
  { to: "/filings/generate", label: es.filings.generate, icon: FilePlus },
  { to: "/filings/templates", label: es.filings.templates, icon: LayoutTemplate },
];

export function FilingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{es.filings.title}</h1>
      </div>

      {/* Sub-navigation tabs */}
      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Nested route content */}
      <Outlet />
    </div>
  );
}
