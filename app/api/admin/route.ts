import { verifyAdmin } from '@/app/admin/_utils/utils';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({}, { status: 200 });
}
