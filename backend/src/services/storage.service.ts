import fs from "fs";
import path from "path";
import { Readable } from "stream";

export interface StorageProvider {
  upload(firmId: string, relativePath: string, data: Buffer): Promise<string>;
  download(filePath: string): Promise<Readable>;
  delete(filePath: string): Promise<void>;
}

const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");

export const localStorageProvider: StorageProvider = {
  async upload(firmId: string, relativePath: string, data: Buffer): Promise<string> {
    const fullDir = path.join(UPLOADS_ROOT, firmId, path.dirname(relativePath));
    await fs.promises.mkdir(fullDir, { recursive: true });

    const fullPath = path.join(UPLOADS_ROOT, firmId, relativePath);
    await fs.promises.writeFile(fullPath, data);

    // Return the relative path stored in DB (uploads/{firmId}/...)
    return path.join(firmId, relativePath);
  },

  async download(filePath: string): Promise<Readable> {
    const fullPath = path.join(UPLOADS_ROOT, filePath);

    // Prevent directory traversal
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(UPLOADS_ROOT)) {
      throw new Error("Invalid file path");
    }

    await fs.promises.access(fullPath, fs.constants.R_OK);
    return fs.createReadStream(fullPath);
  },

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(UPLOADS_ROOT, filePath);

    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(UPLOADS_ROOT)) {
      throw new Error("Invalid file path");
    }

    await fs.promises.unlink(fullPath).catch(() => {
      // File already deleted — ignore
    });
  },
};

// Current provider — swap this for an S3-compatible provider in production
export const storage: StorageProvider = localStorageProvider;
