import { useTheme } from "@/contexts/theme-context";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { Bot, Menu, Moon, Sun } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function Header({ onMenuClick, showMenuButton }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const today = formatDate(new Date());
  // Capitalizar primera letra
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{es.header.openMenu}</span>
          </Button>
        )}
        <span className="hidden text-sm text-muted-foreground md:block">
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <NotificationDropdown />

        {/* AI assistant */}
        <Button variant="ghost" size="icon">
          <Bot className="h-4 w-4" />
          <span className="sr-only">{es.header.aiAssistant}</span>
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">{es.header.toggleTheme}</span>
        </Button>
      </div>
    </header>
  );
}
