import { Component, type ReactNode, type ErrorInfo } from "react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">{es.errors.boundaryTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {es.errors.boundaryDescription}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset}>
              {es.errors.retry}
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
            >
              {es.errors.goHome}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
