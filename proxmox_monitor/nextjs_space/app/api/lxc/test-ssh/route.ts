import { NextResponse } from 'next/server';
import { SSHClient } from '@/lib/ssh-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ipAddress, sshPort, sshUsername, sshPassword, sshKey } = body;
    
    if (!ipAddress || !sshUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const sshClient = new SSHClient({
      host: ipAddress,
      port: sshPort || 22,
      username: sshUsername,
      password: sshPassword || undefined,
      privateKey: sshKey || undefined,
    });
    
    const isConnected = await sshClient.testConnection();
    
    return NextResponse.json({ success: isConnected });
  } catch (error) {
    console.error('Error testing SSH connection:', error);
    return NextResponse.json({ success: false, error: 'Connection failed' }, { status: 500 });
  }
}
