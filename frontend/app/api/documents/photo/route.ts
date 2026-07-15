import { NextResponse } from 'next/server';

export async function POST() {
  // In production this proxies the multipart upload to the NestJS backend's
  // /api/v1/documents/photo endpoint. Mocked here for local frontend testing
  // without a fully wired auth session.
  return NextResponse.json({ documentId: `mock-photo-${Date.now()}` });
}
