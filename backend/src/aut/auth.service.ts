import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OtpService } from './otp.service';

const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly otp: OtpService,
  ) {}

  /**
   * Registration: creates user in unverified state, sends OTP to mobile + email.
   * Password is hashed with Argon2id (memory-hard, OWASP recommended).
   */
  async register(input: { email: string; mobile: string; password: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { mobile: input.mobile }] },
    });
    if (existing) throw new BadRequestException('Email or mobile already registered');

    this.assertPasswordStrength(input.password);

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 19456, // ~19 MB, OWASP baseline
      timeCost: 2,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: { email: input.email, mobile: input.mobile, passwordHash },
    });

    await this.otp.issue(user.id, 'VERIFY_MOBILE');
    await this.otp.issue(user.id, 'VERIFY_EMAIL');

    await this.audit.log({
      actorId: user.id,
      entityType: 'User',
      entityId: user.id,
      action: 'REGISTER',
    });

    return { userId: user.id, message: 'OTP sent to mobile and email for verification' };
  }

  async login(input: { emailOrMobile: string; password: string; deviceInfo?: string; ip?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.emailOrMobile }, { mobile: input.emailOrMobile }] },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked due to repeated failed login attempts. Try again later or reset your password.');
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      await this.registerFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified || !user.isMobileVerified) {
      throw new ForbiddenException('Please verify your email and mobile before logging in');
    }

    // reset failed count on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastLoginAt: new Date() },
    });

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        deviceInfo: input.deviceInfo,
        ipAddress: input.ip,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12h session
      },
    });

    const tokens = await this.issueTokenPair(user.id, user.role);

    await this.audit.log({ actorId: user.id, entityType: 'Session', entityId: session.id, action: 'LOGIN' });

    return { ...tokens, sessionId: session.id, role: user.role };
  }

  private async registerFailedLogin(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
    });
    if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
      await this.prisma.user.update({ where: { id: userId }, data: { isLocked: true } });
      // Auto-unlock job should run separately (e.g. BullMQ delayed job) after LOCK_DURATION_MS
      await this.audit.log({ actorId: userId, entityType: 'User', entityId: userId, action: 'ACCOUNT_LOCKED' });
    }
  }

  async issueTokenPair(userId: string, role: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, role }, { expiresIn: ACCESS_TOKEN_TTL });

    const rawRefresh = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  /** Refresh token rotation: old token is revoked, new pair issued. Prevents replay. */
  async refresh(rawRefresh: string) {
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    return this.issueTokenPair(user.id, user.role);
  }

  async logout(userId: string, sessionId: string) {
    await this.prisma.session.update({ where: { id: sessionId }, data: { isActive: false } });
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
    await this.audit.log({ actorId: userId, entityType: 'Session', entityId: sessionId, action: 'LOGOUT' });
  }

  /** Lists all active sessions/devices for a user — supports multi-device login management. */
  async listActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new ForbiddenException();
    await this.prisma.session.update({ where: { id: sessionId }, data: { isActive: false } });
  }

  private assertPasswordStrength(password: string) {
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
    if (!strong.test(password)) {
      throw new BadRequestException(
        'Password must be at least 10 characters and include uppercase, lowercase, a number, and a symbol.',
      );
    }
  }
}
