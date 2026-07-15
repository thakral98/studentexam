'use client';

import { useFormContext } from 'react-hook-form';

export function ReviewStep({ onFinalSubmit }: { onFinalSubmit: () => void }) {
  const { register, getValues, handleSubmit, formState: { errors } } = useFormContext();
  const values = getValues();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review & Submit</h2>

      <div className="rounded-md border p-4 text-sm space-y-1 bg-muted/40">
        <p><strong>Name:</strong> {values.fullName || '—'}</p>
        <p><strong>Mobile:</strong> {values.mobile || '—'}</p>
        <p><strong>Email:</strong> {values.email || '—'}</p>
        <p><strong>Academic Records:</strong> {values.academicRecords?.length ?? 0} added</p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" {...register('declarationAccepted')} className="mt-1" />
        <span>
          I declare that the information provided is true to the best of my knowledge and I understand that
          providing false information may lead to rejection of my application.
        </span>
      </label>
      {errors.declarationAccepted && (
        <p className="text-xs text-destructive">{errors.declarationAccepted.message as string}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit(() => onFinalSubmit())}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Final Submit
      </button>
    </div>
  );
}
