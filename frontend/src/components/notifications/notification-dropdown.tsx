import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, FileText, Clock, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications";
import { es } from "@/i18n/es";
import type { Notification } from "@/services/notification.service";
import { useState } from "react";

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

  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "PORTAL_UPDATE":
      return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
    case "DEADLINE_REMINDER":
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (n: Notification) => void;
}) {
  return (
    <button
      onClick={() => onRead(notification)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
        !notification.isRead ? "bg-muted/30" : ""
      }`}
    >
      <NotificationIcon type={notification.notificationType} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notification.isRead ? "font-medium" : ""}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeDate(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to the referenced entity if available
    if (notification.referenceType && notification.referenceId) {
      const routeMap: Record<string, string> = {
        case: "/cases",
        matter: "/matters",
        event: "/calendar",
      };
      const basePath = routeMap[notification.referenceType];
      if (basePath) {
        setOpen(false);
        navigate(`${basePath}/${notification.referenceId}`);
        return;
      }
    }

    setOpen(false);
  }

  function handleMarkAllAsRead() {
    markAllAsRead.mutate();
  }

  function handleViewAll() {
    setOpen(false);
    navigate("/notifications");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">{es.header.notifications}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{es.notifications.title}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              {es.notifications.markAllAsRead}
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-4 w-4 shrink-0 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">{es.notifications.empty}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={handleViewAll}
          >
            {es.notifications.viewAll}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
