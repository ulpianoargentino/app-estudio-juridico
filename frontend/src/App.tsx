import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ChatProvider } from "@/contexts/chat-context";
import { ChatPanel } from "@/components/ai/chat-panel";
import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { PersonsPage } from "@/pages/persons";
import { PersonDetailPage } from "@/pages/persons/person-detail";
import { PlaceholderPage } from "@/pages/placeholder";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Rutas protegidas dentro del layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/persons" element={<PersonsPage />} />
                <Route path="/persons/:id" element={<PersonDetailPage />} />
                <Route path="/cases" element={<PlaceholderPage title="cases" />} />
                <Route path="/matters" element={<PlaceholderPage title="matters" />} />
                <Route path="/calendar" element={<PlaceholderPage title="calendar" />} />
                <Route path="/filings" element={<PlaceholderPage title="filings" />} />
                <Route path="/reports" element={<PlaceholderPage title="reports" />} />
                <Route path="/settings" element={<PlaceholderPage title="settings" />} />
              </Route>

              {/* Redirige raíz a dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <ChatPanel />
          <Toaster richColors position="top-right" />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
