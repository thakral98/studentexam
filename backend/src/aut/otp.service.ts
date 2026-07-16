import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { NotificationService } from '../common/notification.service';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async issue(userId: string, purpose: string) {
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    await this.prisma.otpCode.create({
      data: {
        userId,
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    // Never log the raw OTP. Delivery only.
    await this.notifications.sendOtp(userId, code, purpose);
  }

  async verify(userId: string, purpose: string, code: string) {
    const record = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('No pending OTP request found');
    if (record.expiresAt < new Date()) throw new BadRequestException('OTP has expired');
    if (record.attempts >= MAX_ATTEMPTS) throw new BadRequestException('Too many attempts. Request a new OTP.');

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(record.codeHash));

    if (!isMatch) {
      await this.prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

    if (purpose === 'VERIFY_MOBILE') {
      await this.prisma.user.update({ where: { id: userId }, data: { isMobileVerified: true } });
    } else if (purpose === 'VERIFY_EMAIL') {
      await this.prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
    }

    return true;
  }
}
