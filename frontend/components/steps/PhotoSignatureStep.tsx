'use client';

import { useFormContext } from 'react-hook-form';
import { PhotoCaptureField } from './PhotoCaptureField';

export function PhotoSignatureStep() {
  const { setValue } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Photo & Signature</h2>

      <div>
        <p className="text-sm font-medium mb-2">Passport Photo</p>
        <PhotoCaptureField
          rules={{ widthPx: 110, heightPx: 140, minSizeKb: 20, maxSizeKb: 50, label: 'photo' }}
          onUploaded={(id) => setValue('photoDocumentId', id, { shouldValidate: true })}
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Signature</p>
        <PhotoCaptureField
          rules={{ widthPx: 140, heightPx: 110, minSizeKb: 10, maxSizeKb: 20, label: 'signature' }}
          onUploaded={(id) => setValue('signatureDocumentId', id, { shouldValidate: true })}
        />
      </div>
    </div>
  );
}
