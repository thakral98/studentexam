'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { PersonalDetailsStep } from './steps/PersonalDetailsStep';
import { AcademicDetailsStep } from './steps/AcademicDetailsStep';
import { PhotoSignatureStep } from './steps/PhotoSignatureStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';
import { registrationSchema } from '@/lib/validation/registrationSchema';

const STEPS = ['personal', 'academic', 'photoSignature', 'documents', 'review'] as const;
type Step = (typeof STEPS)[number];

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationWizard({ applicationId }: { applicationId?: string }) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    defaultValues: loadDraftFromLocalCache(applicationId),
  });

  const currentStep: Step = STEPS[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  async function saveDraft() {
    setIsSaving(true);
    try {
      const values = methods.getValues();
      await fetch('/api/applications/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, stepIndex, values }),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function goNext() {
    // Validate only the fields relevant to the current step before advancing,
    // so an incomplete step 4 doesn't block progress saved on step 1.
    const stepFields = STEP_FIELD_MAP[currentStep];
    const valid = await methods.trigger(stepFields as any);
    if (!valid) return;

    await saveDraft();
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
            {STEPS.map((step, i) => (
              <span
                key={step}
                className={i <= stepIndex ? 'text-primary font-semibold' : ''}
                aria-current={i === stepIndex ? 'step' : undefined}
              >
                {t(`registration.steps.${step}`)}
              </span>
            ))}
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('registration.stepXofY', { current: stepIndex + 1, total: STEPS.length })}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 'personal' && <PersonalDetailsStep />}
            {currentStep === 'academic' && <AcademicDetailsStep />}
            {currentStep === 'photoSignature' && <PhotoSignatureStep />}
            {currentStep === 'documents' && <DocumentsStep />}
            {currentStep === 'review' && <ReviewStep onFinalSubmit={() => saveDraft()} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {t('common.back')}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={isSaving}
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              {isSaving ? t('common.saving') : t('registration.saveDraft')}
            </button>
            {stepIndex < STEPS.length - 1 && (
              <button
                type="button"
                onClick={goNext}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {t('common.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

const STEP_FIELD_MAP: Record<Step, string[]> = {
  personal: ['fullName', 'fathersName', 'mothersName', 'dob', 'gender', 'category', 'mobile', 'email'],
  academic: ['academicRecords'],
  photoSignature: ['photoDocumentId', 'signatureDocumentId'],
  documents: ['identityProof'],
  review: ['declarationAccepted'],
};

function loadDraftFromLocalCache(_applicationId?: string) {
  // Draft resume: hydrate from server-fetched application.stepData on the
  // parent server component and pass down as `defaultValues` in real usage.
  return {};
}
