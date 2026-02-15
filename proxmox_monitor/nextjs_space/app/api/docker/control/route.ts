import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SSHClient } from '@/lib/ssh-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lxcId, containerId, action } = body;
    
    if (!lxcId || !containerId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    const lxc = await prisma.lXCConfig.findUnique({
      where: { id: lxcId },
    });
    
    if (!lxc) {
      return NextResponse.json({ error: 'LXC not found' }, { status: 404 });
    }
    
    const sshClient = new SSHClient({
      host: lxc.ipAddress,
      port: lxc.sshPort,
      username: lxc.sshUsername,
      password: lxc.sshPassword ?? undefined,
      privateKey: lxc.sshKey ?? undefined,
    });
    
    const success = await sshClient.controlDockerContainer(containerId, action as any);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error controlling Docker container:', error);
    return NextResponse.json({ error: 'Failed to control container' }, { status: 500 });
  }
}
