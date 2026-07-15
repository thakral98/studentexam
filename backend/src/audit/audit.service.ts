import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface AuditInput {
  actorId?: string;
  studentId?: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Every mutating operation across the system should call AuditService.log().
 * Audit rows are append-only (no update/delete exposed here) so the trail
 * remains trustworthy for compliance review.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditInput) {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        studentId: input.studentId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        beforeState: input.beforeState ? JSON.parse(JSON.stringify(input.beforeState)) : undefined,
        afterState: input.afterState ? JSON.parse(JSON.stringify(input.afterState)) : undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async trailFor(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
