'use client';

import { useFormContext } from 'react-hook-form';

export function DocumentsStep() {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Identity Documents</h2>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Document Type</span>
        <select {...register('identityProof.type')} className="input">
          <option value="">Select</option>
          <option value="AADHAAR">Aadhaar</option>
          <option value="PAN">PAN</option>
          <option value="PASSPORT">Passport</option>
          <option value="DRIVING_LICENCE">Driving Licence</option>
          <option value="VOTER_ID">Voter ID</option>
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Document Number</span>
        <input {...register('identityProof.documentNumber')} className="input" />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Upload Document (PDF/JPEG)</span>
        <input type="file" accept="application/pdf,image/jpeg" className="input" />
      </label>
    </div>
  );
}
