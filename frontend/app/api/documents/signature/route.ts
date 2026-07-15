import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ documentId: `mock-signature-${Date.now()}` });
}
