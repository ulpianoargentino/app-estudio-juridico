import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

// Unwrap { data: T } envelope from successful responses
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && "data" in response.data) {
      response.data = response.data.data;
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
