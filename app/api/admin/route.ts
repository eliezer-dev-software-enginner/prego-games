import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../admin/_utils/utils';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({}, { status: 200 });
}
