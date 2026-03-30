// Global Express type augmentation — imported from index.ts for side effects
import type { UserRole } from "../models/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        firmId: string;
        role: UserRole;
      };
      firmId?: string;
    }
  }
}

export {};
