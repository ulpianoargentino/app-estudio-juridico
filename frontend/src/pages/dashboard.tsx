import { useAuth } from "@/contexts/auth-context";
import { es } from "@/i18n/es";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold">{es.dashboard.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {es.dashboard.welcome}, {user?.firstName}
      </p>
    </div>
  );
}
