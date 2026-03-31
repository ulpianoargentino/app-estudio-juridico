import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  Briefcase,
  AlertTriangle,
  ClipboardList,
  Calendar,
  FileText,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { es } from "@/i18n/es";
import {
  fetchDashboardStats,
  type DashboardStats,
  type DashboardEvent,
  type DashboardMovement,
} from "@/services/dashboard.service";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.7 0.15 200)",
  "oklch(0.6 0.2 330)",
  "oklch(0.75 0.12 120)",
  "oklch(0.55 0.18 260)",
  "oklch(0.65 0.22 50)",
];

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

// KPI card component
function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
  valueColor,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  valueColor?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-3 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-8 w-16 mb-1" />
          ) : (
            <p className={`text-3xl font-bold ${valueColor ?? ""}`}>{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Event type badge
function EventTypeBadge({ type }: { type: string }) {
  const label =
    es.eventType[type as keyof typeof es.eventType] ?? type;
  const colorMap: Record<string, string> = {
    HEARING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    DEADLINE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    MEETING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    MEDIATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    COURT_VISIT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[type] ?? colorMap.OTHER}`}
    >
      {label}
    </span>
  );
}

// Linked entity display
function LinkedEntity({ event }: { event: DashboardEvent | DashboardMovement }) {
  const navigate = useNavigate();

  if (event.caseId) {
    return (
      <button
        onClick={() => navigate(`/cases/${event.caseId}`)}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate max-w-[200px] text-left"
        title={event.caseTitle ?? ""}
      >
        {event.caseNumber
          ? `Exp. ${event.caseNumber}`
          : event.caseTitle ?? ""}
      </button>
    );
  }

  if (event.matterId) {
    return (
      <button
        onClick={() => navigate(`/matters/${event.matterId}`)}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate max-w-[200px] text-left"
        title={event.matterTitle ?? ""}
      >
        {event.matterTitle ?? ""}
      </button>
    );
  }

  return null;
}

// Pie chart custom label
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPieLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs fill-card-foreground"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// Charts section
function StatusPieChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({
      name: es.caseStatus[key as keyof typeof es.caseStatus] ?? key,
      value,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={renderPieLabel}
          labelLine={false}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--card-foreground)",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value) => <span className="text-card-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function JurisdictionBarChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({
      name: es.jurisdictionType[key as keyof typeof es.jurisdictionType] ?? key,
      value,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--card-foreground)",
          }}
          formatter={(value) => [String(value), "Expedientes"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Events list
function EventsList({ events, loading }: { events: DashboardEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {es.dashboard.noUpcomingEvents}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center min-w-[48px]">
            <Calendar className="h-4 w-4 text-muted-foreground mb-0.5" />
            <span className="text-xs text-muted-foreground">
              {formatShortDate(event.eventDate)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{event.title}</p>
            <LinkedEntity event={event} />
          </div>
          <EventTypeBadge type={event.eventType} />
        </div>
      ))}
    </div>
  );
}

// Movements list
function MovementsList({
  movements,
  loading,
}: {
  movements: DashboardMovement[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {es.dashboard.noRecentActivity}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {movements.map((mov) => (
        <div
          key={mov.id}
          className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center min-w-[48px] mt-0.5">
            <FileText className="h-4 w-4 text-muted-foreground mb-0.5" />
            <span className="text-xs text-muted-foreground">
              {formatShortDate(mov.movementDate)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mov.description}</p>
            <LinkedEntity event={mov} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for the full page
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const deadlineCount = stats?.upcomingDeadlines.length ?? 0;

  if (isLoading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{es.dashboard.title}</h1>
        <p className="text-muted-foreground">
          {es.dashboard.welcome}, {user?.firstName}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={es.dashboard.activeCases}
          value={stats?.totalActiveCases ?? 0}
          icon={Scale}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          loading={isLoading}
        />
        <KpiCard
          title={es.dashboard.activeMatters}
          value={stats?.totalActiveMatters ?? 0}
          icon={Briefcase}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
          loading={isLoading}
        />
        <KpiCard
          title={es.dashboard.upcomingDeadlines}
          value={deadlineCount}
          icon={AlertTriangle}
          iconColor="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
          valueColor={deadlineCount > 0 ? "text-orange-600 dark:text-orange-400" : undefined}
          loading={isLoading}
        />
        <KpiCard
          title={es.dashboard.pendingErrands}
          value={stats?.pendingErrands ?? 0}
          icon={ClipboardList}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400"
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{es.dashboard.casesByStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <StatusPieChart data={stats?.casesByStatus ?? {}} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{es.dashboard.casesByJurisdiction}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <JurisdictionBarChart data={stats?.casesByJurisdictionType ?? {}} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{es.dashboard.upcomingEvents}</CardTitle>
          </CardHeader>
          <CardContent>
            <EventsList
              events={[
                ...(stats?.upcomingDeadlines ?? []),
                ...(stats?.upcomingEvents ?? []),
              ].sort(
                (a, b) =>
                  new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
              ).slice(0, 5)}
              loading={isLoading}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{es.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <MovementsList
              movements={stats?.recentMovements ?? []}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
