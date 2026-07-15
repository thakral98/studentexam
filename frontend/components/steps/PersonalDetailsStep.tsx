'use client';

import { useFormContext } from 'react-hook-form';

export function PersonalDetailsStep() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Personal Details</h2>

      <Field label="Full Name" error={errors.fullName?.message as string}>
        <input {...register('fullName')} className="input" />
      </Field>
      <Field label="Father's Name" error={errors.fathersName?.message as string}>
        <input {...register('fathersName')} className="input" />
      </Field>
      <Field label="Mother's Name" error={errors.mothersName?.message as string}>
        <input {...register('mothersName')} className="input" />
      </Field>
      <Field label="Date of Birth" error={errors.dob?.message as string}>
        <input type="date" {...register('dob')} className="input" />
      </Field>
      <Field label="Gender" error={errors.gender?.message as string}>
        <select {...register('gender')} className="input">
          <option value="">Select</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </select>
      </Field>
      <Field label="Category" error={errors.category?.message as string}>
        <select {...register('category')} className="input">
          <option value="">Select</option>
          <option value="GENERAL">General</option>
          <option value="OBC">OBC</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="EWS">EWS</option>
        </select>
      </Field>
      <Field label="Mobile Number" error={errors.mobile?.message as string}>
        <input {...register('mobile')} className="input" placeholder="10-digit mobile" />
      </Field>
      <Field label="Email" error={errors.email?.message as string}>
        <input type="email" {...register('email')} className="input" />
      </Field>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive mt-1">{error}</span>}
    </label>
  );
}
