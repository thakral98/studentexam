'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Rules {
  widthPx: number;
  heightPx: number;
  minSizeKb: number;
  maxSizeKb: number;
  label: 'photo' | 'signature';
}

/**
 * Client-side capture/crop/compress UX. This is a convenience layer only —
 * the server re-validates every hard constraint (dimensions, size, mime)
 * on upload, since client-side checks can always be bypassed.
 */
export function PhotoCaptureField({
  rules,
  onUploaded,
}: {
  rules: Rules;
  onUploaded: (documentId: string) => void;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode('camera');
    } catch {
      setError(t('photo.cameraPermissionDenied'));
    }
  }, [t]);

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach((track) => track.stop());
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = rules.widthPx;
    canvas.height = rules.heightPx;
    const ctx = canvas.getContext('2d')!;
    // Center-crop the video frame to the target aspect ratio before drawing.
    const srcAspect = video.videoWidth / video.videoHeight;
    const targetAspect = rules.widthPx / rules.heightPx;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (srcAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sh) / 2;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, rules.widthPx, rules.heightPx);

    stopCamera();
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
    setMode('preview');
  }

  function retake() {
    setPreviewUrl(null);
    startCamera();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMode('preview');
  }

  async function confirmAndUpload() {
    if (!previewUrl) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await (await fetch(previewUrl)).blob();

      // Client-side pre-check for fast feedback — server is authoritative.
      const sizeKb = blob.size / 1024;
      if (sizeKb < rules.minSizeKb || sizeKb > rules.maxSizeKb) {
        setError(
          t('photo.sizeError', { width: rules.widthPx, height: rules.heightPx, min: rules.minSizeKb, max: rules.maxSizeKb }),
        );
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', blob, `${rules.label}.jpg`);

      const res = await fetch(`/api/documents/${rules.label}`, { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? t('photo.uploadFailed'));
      }
      const { documentId } = await res.json();
      onUploaded(documentId);
    } catch (err: any) {
      setError(err.message ?? t('photo.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground mb-3">
        {t('photo.requirement', { width: rules.widthPx, height: rules.heightPx, min: rules.minSizeKb, max: rules.maxSizeKb })}
      </p>

      {mode === 'idle' && (
        <div className="flex gap-3">
          <button type="button" onClick={startCamera} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            {t('photo.useCamera')}
          </button>
          <label className="rounded-md border px-4 py-2 text-sm cursor-pointer">
            {t('photo.uploadFile')}
            <input type="file" accept="image/jpeg" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-3">
          <video ref={videoRef} className="w-full max-w-xs rounded-md" aria-label={t('photo.livePreview')} muted playsInline />
          <button type="button" onClick={capture} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            {t('photo.capture')}
          </button>
        </div>
      )}

      {mode === 'preview' && previewUrl && (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt={t('photo.previewAlt')}
            className="rounded-md border"
            style={{ width: rules.widthPx, height: rules.heightPx }}
          />
          <div className="flex gap-3">
            <button type="button" onClick={retake} className="rounded-md border px-4 py-2 text-sm">
              {t('photo.retake')}
            </button>
            <button
              type="button"
              onClick={confirmAndUpload}
              disabled={uploading}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              {uploading ? t('common.saving') : t('photo.confirmUpload')}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
