'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';

export function AcademicDetailsStep() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'academicRecords' });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Academic Details</h2>

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-md border p-3 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <select {...register(`academicRecords.${index}.level`)} className="input">
              <option value="">Level</option>
              <option value="TENTH">10th</option>
              <option value="TWELFTH">12th</option>
              <option value="GRADUATION">Graduation</option>
              <option value="POST_GRADUATION">Post Graduation</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="ITI">ITI</option>
            </select>
            <input
              {...register(`academicRecords.${index}.boardOrUniversity`)}
              className="input"
              placeholder="Board / University"
            />
            <input
              type="number"
              {...register(`academicRecords.${index}.passingYear`, { valueAsNumber: true })}
              className="input"
              placeholder="Passing Year"
            />
            <input
              type="number"
              step="0.01"
              {...register(`academicRecords.${index}.percentage`, { valueAsNumber: true })}
              className="input"
              placeholder="Percentage"
            />
          </div>
          <button type="button" onClick={() => remove(index)} className="text-xs text-destructive">
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ level: '', boardOrUniversity: '', passingYear: new Date().getFullYear() })}
        className="rounded-md border px-3 py-1.5 text-sm"
      >
        + Add Academic Record
      </button>
    </div>
  );
}
