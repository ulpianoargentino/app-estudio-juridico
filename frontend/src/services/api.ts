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
  (error: AxiosError<{ error: { code: string; message: string } }>) => {
    if (error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      return Promise.reject(new ApiError(code, message, error.response.status));
    }
    return Promise.reject(error);
  }
);

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ApiError";
  }
}
