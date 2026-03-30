import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";
import { LogOut } from "lucide-react";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">{es.dashboard.title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.firstName} {user?.lastName}
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {es.auth.logout}
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          {es.dashboard.welcome}, {user?.firstName}
        </p>
      </main>
    </div>
  );
}
