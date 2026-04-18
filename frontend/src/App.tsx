import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { PlaceholderPage } from "@/pages/placeholder";
import { PersonsPage } from "@/pages/persons";
import { CasesPage } from "@/pages/cases";
import { CaseFormPage } from "@/pages/cases/case-form-page";
import { CaseDetailPage } from "@/pages/cases/case-detail-page";

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
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/cases/new" element={<CaseFormPage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />
                <Route path="/cases/:id/edit" element={<CaseFormPage />} />
                <Route path="/matters" element={<PlaceholderPage title="matters" />} />
                <Route path="/persons" element={<PersonsPage />} />
                <Route path="/calendar" element={<PlaceholderPage title="calendar" />} />
                <Route path="/filings" element={<PlaceholderPage title="filings" />} />
                <Route path="/reports" element={<PlaceholderPage title="reports" />} />
                <Route path="/settings" element={<PlaceholderPage title="settings" />} />
              </Route>

              {/* Redirige raíz a dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
