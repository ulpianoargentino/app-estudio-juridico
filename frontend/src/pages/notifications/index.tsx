import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, FileText, Clock, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from "@/hooks/use-notifications";
import { es } from "@/i18n/es";
import type { Notification } from "@/services/notification.service";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return es.notifications.justNow;
  if (diffMin < 60) return `${es.notifications.ago} ${diffMin} min`;
  if (diffHours < 24) return `${es.notifications.ago} ${diffHours}h`;
  if (diffDays === 1) return es.notifications.yesterday;
  if (diffDays < 7) return `${es.notifications.ago} ${diffDays} ${es.notifications.days}`;

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "PORTAL_UPDATE":
      return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
    case "DEADLINE_REMINDER":
      return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground shrink-0" />;
  }
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (n: Notification) => void;
}) {
  return (
    <button
      onClick={() => onRead(notification)}
      className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
        !notification.isRead ? "border-primary/20 bg-muted/30" : "border-border"
      }`}
    >
      <NotificationIcon type={notification.notificationType} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {notification.message}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

type FilterTab = "all" | "unread";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterTab>("all");
  const { data: unreadCount = 0 } = useUnreadCount();

  const { data, isLoading } = useNotifications({
    page,
    limit: 20,
    unreadOnly: filter === "unread",
  });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    if (notification.referenceType && notification.referenceId) {
      const routeMap: Record<string, string> = {
        case: "/cases",
        matter: "/matters",
        event: "/calendar",
      };
      const basePath = routeMap[notification.referenceType];
      if (basePath) {
        navigate(`${basePath}/${notification.referenceId}`);
      }
    }
  }

  return (
    <div>
      <PageHeader
        title={es.notifications.title}
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {es.notifications.markAllAsRead}
            </Button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => { setFilter("all"); setPage(1); }}
        >
          {es.notifications.filterAll}
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => { setFilter("unread"); setPage(1); }}
        >
          {es.notifications.filterUnread}
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-lg border p-4">
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">
            {filter === "unread"
              ? es.notifications.emptyUnread
              : es.notifications.empty}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onRead={handleNotificationClick}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
