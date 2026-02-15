import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request.json();
    const { proxmoxId, name, ipAddress, sshPort, sshUsername, sshPassword, sshKey } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing LXC ID' }, { status: 400 });
    }
    
    const lxc = await prisma.lXCConfig.update({
      where: { id },
      data: {
        ...(proxmoxId && { proxmoxId: parseInt(proxmoxId) }),
        ...(name && { name }),
        ...(ipAddress && { ipAddress }),
        ...(sshPort && { sshPort }),
        ...(sshUsername && { sshUsername }),
        ...(sshPassword !== undefined && { sshPassword }),
        ...(sshKey !== undefined && { sshKey }),
      },
    });
    
    return NextResponse.json({ lxc });
  } catch (error) {
    console.error('Error updating LXC config:', error);
    return NextResponse.json({ error: 'Failed to update LXC config' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing LXC ID' }, { status: 400 });
    }
    
    await prisma.lXCConfig.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting LXC config:', error);
    return NextResponse.json({ error: 'Failed to delete LXC config' }, { status: 500 });
  }
}
