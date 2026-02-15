import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lxcs = await prisma.lXCConfig.findMany({
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({ lxcs });
  } catch (error) {
    console.error('Error fetching LXC configs:', error);
    return NextResponse.json({ error: 'Failed to fetch LXC configs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proxmoxId, name, ipAddress, sshPort, sshUsername, sshPassword, sshKey } = body;
    
    if (!proxmoxId || !name || !ipAddress || !sshUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const lxc = await prisma.lXCConfig.create({
      data: {
        proxmoxId: parseInt(proxmoxId),
        name,
        ipAddress,
        sshPort: sshPort || 22,
        sshUsername,
        sshPassword: sshPassword || null,
        sshKey: sshKey || null,
      },
    });
    
    return NextResponse.json({ lxc });
  } catch (error) {
    console.error('Error creating LXC config:', error);
    return NextResponse.json({ error: 'Failed to create LXC config' }, { status: 500 });
  }
}
