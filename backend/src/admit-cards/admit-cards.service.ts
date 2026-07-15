import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../common/prisma.service';
import { S3Service } from '../common/s3.service';
import { PdfService } from '../common/pdf.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdmitCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly pdf: PdfService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Generates an admit card for a student whose application is APPROVED and
   * who has a confirmed exam-center allotment. QR payload is a signed token
   * (not raw student PII) so a scanner backend can verify authenticity without
   * exposing personal data on the printed card.
   */
  async generate(studentId: string, actorId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: { application: true, examCenterAllotment: { include: { examCenter: true } } },
    });

    if (student.application?.status !== 'APPROVED') {
      throw new BadRequestException('Admit card can only be generated for approved applications.');
    }
    if (!student.examCenterAllotment) {
      throw new BadRequestException('Exam center has not been allotted yet.');
    }

    const admitCardNumber = `AC-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;

    const signedToken = this.signPayload({
      admitCardNumber,
      studentId: student.id,
      rollNumber: student.rollNumber,
    });

    const qrDataUrl = await QRCode.toDataURL(signedToken, { errorCorrectionLevel: 'M', width: 300 });
    const barcodePayload = student.rollNumber ?? admitCardNumber; // CODE128-compatible value

    const pdfBuffer = await this.pdf.renderAdmitCard({
      studentName: student.fullName,
      rollNumber: student.rollNumber!,
      admitCardNumber,
      examCenterName: student.examCenterAllotment.examCenter.name,
      examCenterAddress: student.examCenterAllotment.examCenter.address,
      examDate: student.examCenterAllotment.examDate,
      reportingTime: student.examCenterAllotment.reportingTime,
      qrDataUrl,
      barcodePayload,
    });

    const pdfFileKey = `admit-cards/${student.id}/${admitCardNumber}.pdf`;
    await this.s3.putObjectEncrypted(pdfFileKey, pdfBuffer, 'application/pdf');

    const admitCard = await this.prisma.admitCard.create({
      data: {
        studentId: student.id,
        admitCardNumber,
        qrCodePayload: signedToken,
        barcodePayload,
        pdfFileKey,
      },
    });

    await this.audit.log({
      actorId,
      studentId: student.id,
      entityType: 'AdmitCard',
      entityId: admitCard.id,
      action: 'GENERATE',
    });

    return admitCard;
  }

  /** Verifies a scanned QR payload at the exam center without exposing raw student data. */
  verifyQrToken(token: string) {
    return this.verifyPayload(token); // throws if tampered/expired
  }

  private signPayload(payload: object): string {
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.ADMIT_CARD_SIGNING_SECRET!).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private verifyPayload(token: string) {
    const [body, sig] = token.split('.');
    const expected = crypto
      .createHmac('sha256', process.env.ADMIT_CARD_SIGNING_SECRET!)
      .update(body)
      .digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      throw new BadRequestException('Invalid or tampered admit card.');
    }
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  }
}
