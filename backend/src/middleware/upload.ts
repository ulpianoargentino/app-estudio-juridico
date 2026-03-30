import multer from "multer";
import { AppError } from "./error-handler";

const ALLOWED_MIMETYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/tiff",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "INVALID_FILE_TYPE", "Tipo de archivo no permitido"));
    }
  },
}).single("file");
