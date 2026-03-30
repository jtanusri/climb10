import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getAllOrgs } from '@/lib/db/organizations';
import { updateOrgCoordinates } from '@/lib/db/organizations';

export async function GET(request: Request) {
  await ensureMigrations();
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');
  const sig = searchParams.get('sig');

  let orgs = await getAllOrgs();

  if (cat) {
    orgs = orgs.filter(o => o.keyword_category === cat);
  }
  if (sig) {
    orgs = orgs.filter(o => o.signal_strength === sig);
  }

  // Return only fields needed for map rendering
  const mapOrgs = orgs.map(o => ({
    id: o.id,
    name: o.name,
    location: o.location,
    estimated_budget: o.estimated_budget,
    mission_focus: o.mission_focus,
    stage: o.stage,
    keyword_category: o.keyword_category,
    signal_strength: o.signal_strength,
    leadership_signal_tier: o.leadership_signal_tier,
    lat: o.lat,
    lng: o.lng,
  }));

  return NextResponse.json(mapOrgs);
}

export async function PUT(request: Request) {
  await ensureMigrations();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { lat, lng } = await request.json();
  const org = await updateOrgCoordinates(Number(id), lat, lng);
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(org);
}
