import { z } from 'zod';

const academicRecordSchema = z.object({
  level: z.string().min(1),
  boardOrUniversity: z.string().min(1),
  passingYear: z.number().int().min(1950).max(new Date().getFullYear()),
  percentage: z.number().min(0).max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  fathersName: z.string().min(2, "Father's name is required"),
  mothersName: z.string().min(2, "Mother's name is required"),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS']),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email address'),

  academicRecords: z.array(academicRecordSchema).min(1, 'At least one academic record is required'),

  photoDocumentId: z.string().min(1, 'Photo is required').optional(),
  signatureDocumentId: z.string().min(1, 'Signature is required').optional(),

  identityProof: z
    .object({
      type: z.string(),
      documentNumber: z.string().min(1),
    })
    .optional(),

  declarationAccepted: z.boolean().refine((v) => v === true, 'You must accept the declaration'),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
