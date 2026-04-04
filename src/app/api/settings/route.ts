import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  return NextResponse.json({ settings: db.settings });
}

export async function POST(req: Request) {
  try {
    const { academiaPromotionThreshold } = await req.json();
    const db = await getDb();
    
    if (academiaPromotionThreshold !== undefined) {
      db.settings.academiaPromotionThreshold = academiaPromotionThreshold;
    }
    
    await saveDb(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
