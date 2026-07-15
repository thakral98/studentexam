'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: { back: 'Back', next: 'Next', saving: 'Saving...' },
      registration: {
        steps: {
          personal: 'Personal',
          academic: 'Academic',
          photoSignature: 'Photo & Signature',
          documents: 'Documents',
          review: 'Review',
        },
        stepXofY: 'Step {{current}} of {{total}}',
        saveDraft: 'Save Draft',
      },
      photo: {
        cameraPermissionDenied: 'Camera access was denied. Please upload a file instead.',
        sizeError: 'Image must be {{width}}×{{height}}px and {{min}}–{{max}}KB.',
        uploadFailed: 'Upload failed. Please try again.',
        requirement: 'Required: exactly {{width}}×{{height}}px, {{min}}–{{max}}KB, JPEG only.',
        useCamera: 'Use Camera',
        uploadFile: 'Upload File',
        livePreview: 'Live camera preview',
        capture: 'Capture',
        previewAlt: 'Captured preview',
        retake: 'Retake',
        confirmUpload: 'Confirm & Upload',
      },
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
