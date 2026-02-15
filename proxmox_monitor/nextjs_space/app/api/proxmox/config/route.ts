import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.proxmoxConfig.findFirst();
    
    if (!config) {
      return NextResponse.json({ config: null });
    }
    
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching Proxmox config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, username, token } = body;
    
    if (!url || !username || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Delete existing config and create new one
    await prisma.proxmoxConfig.deleteMany();
    const config = await prisma.proxmoxConfig.create({
      data: { url, username, token },
    });
    
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error saving Proxmox config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
