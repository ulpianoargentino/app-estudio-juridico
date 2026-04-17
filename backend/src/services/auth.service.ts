import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { Response } from "express";
import { db } from "../db";
import { firms, users } from "../models";
import { userRole, type UserRole } from "../models/enums";
import { config } from "../config";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";
import type { RegisterRequest, AuthUser } from "@shared";

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = "7d";

type RegisterData = RegisterRequest;
type UserResponse = AuthUser;

function generateToken(userId: string, firmId: string, role: UserRole): string {
  return jwt.sign({ userId, firmId, role }, config.jwt.secret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function setTokenCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function formatUser(
  user: { id: string; email: string; firstName: string; lastName: string; role: string },
  firm: { id: string; name: string }
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    firm: { id: firm.id, name: firm.name },
  };
}

export async function register(
  data: RegisterData,
  res: Response
): Promise<UserResponse> {
  // Verificar email duplicado
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, "EMAIL_EXISTS", "Este email ya está registrado");
  }

  const firmId = uuidv7();
  const userId = uuidv7();
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Crear estudio y primer usuario (ADMIN) en transacción
  await db.transaction(async (tx) => {
    await tx.insert(firms).values({
      id: firmId,
      name: data.firmName,
    });

    await tx.insert(users).values({
      id: userId,
      firmId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: userRole.ADMIN,
    });
  });

  const token = generateToken(userId, firmId, userRole.ADMIN);
  setTokenCookie(res, token);

  return formatUser(
    {
      id: userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: userRole.ADMIN,
    },
    { id: firmId, name: data.firmName }
  );
}

export async function login(
  email: string,
  password: string,
  res: Response
): Promise<UserResponse> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      firmId: users.firmId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = result[0];

  if (!user) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email o contraseña incorrectos"
    );
  }

  if (!user.isActive) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email o contraseña incorrectos"
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email o contraseña incorrectos"
    );
  }

  // Obtener datos del firm
  const firmResult = await db
    .select({ id: firms.id, name: firms.name })
    .from(firms)
    .where(eq(firms.id, user.firmId))
    .limit(1);

  const firm = firmResult[0]!;

  // Actualizar last_login_at
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const token = generateToken(user.id, user.firmId, user.role as UserRole);
  setTokenCookie(res, token);

  return formatUser(user, firm);
}

export function logout(res: Response): void {
  res.clearCookie("token", {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getCurrentUser(userId: string): Promise<UserResponse> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      firmId: users.firmId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = result[0];
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }

  const firmResult = await db
    .select({ id: firms.id, name: firms.name })
    .from(firms)
    .where(eq(firms.id, user.firmId))
    .limit(1);

  const firm = firmResult[0]!;

  return formatUser(user, firm);
}
