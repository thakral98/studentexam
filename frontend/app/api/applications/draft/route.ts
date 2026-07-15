import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  const body = await req.json();
  console.log('[draft-save mock]', { stepIndex: body.stepIndex });
  // In production this proxies to the NestJS backend's /api/v1/applications/draft
  // endpoint with the user's auth cookie/token attached.
  return NextResponse.json({ saved: true });
}
