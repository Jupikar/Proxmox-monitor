import { NextResponse } from 'next/server';
import { ProxmoxAPI } from '@/lib/proxmox-api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, username, token } = body;
    
    if (!url || !username || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const api = new ProxmoxAPI({ url, username, token });
    const isConnected = await api.testConnection();
    
    return NextResponse.json({ success: isConnected });
  } catch (error) {
    console.error('Error testing Proxmox connection:', error);
    return NextResponse.json({ success: false, error: 'Connection failed' }, { status: 500 });
  }
}
