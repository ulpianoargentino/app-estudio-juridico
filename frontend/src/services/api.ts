import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Unwrap { data: T } envelope, but preserve meta for paginated responses
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "data" in body) {
      // Paginated response: { data: T[], meta: {...} } — keep as-is
      if ("meta" in body) {
        return response;
      }
      // Single-item response: { data: T } — unwrap
      response.data = body.data;
    }
    return response;
  },
  (error: AxiosError<{ error: { code: string; message: string; details?: Array<{ field: string; message: string }> } }>) => {
    // Network error or no response
    if (!error.response) {
      return Promise.reject(
        new ApiError("NETWORK_ERROR", "Error de conexión. Verificá tu conexión a internet.", 0)
      );
    }

    // Redirect to login on 401 (session expired)
    if (error.response.status === 401) {
      const errorCode = error.response.data?.error?.code;
      if (errorCode === "TOKEN_EXPIRED" || errorCode === "UNAUTHORIZED") {
        // Only redirect if not already on auth pages
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
          window.location.href = "/login";
        }
      }
    }

    if (error.response.data?.error) {
      const { code, message, details } = error.response.data.error;
      return Promise.reject(new ApiError(code, message, error.response.status, details));
    }

    return Promise.reject(
      new ApiError("UNKNOWN_ERROR", "Ocurrió un error inesperado", error.response.status)
    );
  }
);

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ field: string; message: string }>;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = "ApiError";
  }

  get isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR";
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR";
  }
}
