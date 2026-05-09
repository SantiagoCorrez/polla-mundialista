import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../common/middlewares/error-handler';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenString,
} from './jwt.utils';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Password validation: min 8 chars, 1 uppercase, 1 number, 1 symbol
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  cedula: string;
  password: string;
}

export interface LoginInput {
  identifier: string; // email or username
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const { fullName, username, email, cedula, password } = input;

    // Validate password strength
    if (!PASSWORD_REGEX.test(password)) {
      throw new AppError(
        'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 symbol',
        400
      );
    }

    // Check unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }

    // Check unique username
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }

    // Check unique cedula
    const existingCedula = await prisma.user.findUnique({ where: { cedula } });
    if (existingCedula) {
      throw new AppError('Cedula already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        email: email.toLowerCase(),
        cedula,
        passwordHash,
        isActive: false,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        cedula: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(input: LoginInput) {
    const { identifier, password } = input;

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is blocked. Contact administrator.', 403);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenJwt = generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenJwt,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenJwt,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401);
    }

    // Verify the token exists in DB and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError('Refresh token expired', 401);
    }

    // Verify JWT validity
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError('Invalid refresh token', 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError('Account is blocked', 403);
    }

    // Delete old token and create new ones
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const tokenPayload = { userId: storedToken.user.id, role: storedToken.user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }

    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}
