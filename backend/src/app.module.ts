import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaService } from './common/prisma.service';
import { S3Service } from './common/s3.service';
import { PdfService } from './common/pdf.service';
import { NotificationService } from './common/notification.service';
import { RetentionJob } from './common/retention.job';

import { HealthController } from './health/health.controller';

import { AuthService } from './auth/auth.service';
import { OtpService } from './auth/otp.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { AuditService } from './audit/audit.service';

import { ImageValidationService } from './documents/image-validation.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';

import { PaymentsService } from './payments/payments.service';
import { AdmitCardsService } from './admit-cards/admit-cards.service';
import { ResultsService } from './results/results.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [HealthController, DocumentsController],
  providers: [
    PrismaService,
    S3Service,
    PdfService,
    NotificationService,
    RetentionJob,
    AuthService,
    OtpService,
    JwtAuthGuard,
    AuditService,
    ImageValidationService,
    DocumentsService,
    PaymentsService,
    AdmitCardsService,
    ResultsService,
  ],
})
export class AppModule {}
