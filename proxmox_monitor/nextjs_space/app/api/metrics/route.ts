import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProxmoxAPI } from '@/lib/proxmox-api';
import { SSHClient } from '@/lib/ssh-client';

export const dynamic = 'force-dynamic';

interface LXCMetrics {
  id: string;
  proxmoxId: number;
  name: string;
  ipAddress: string;
  status: 'running' | 'stopped';
  uptime?: number;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  netin?: number;
  netout?: number;
  containers: any[];
}

export async function GET() {
  try {
    const proxmoxConfig = await prisma.proxmoxConfig.findFirst();
    
    if (!proxmoxConfig) {
      return NextResponse.json({ configured: false, metrics: [] }, { status: 200 });
    }
    
    const lxcs = await prisma.lXCConfig.findMany();
    
    if (!lxcs || lxcs.length === 0) {
      return NextResponse.json({ metrics: [] });
    }
    
    const api = new ProxmoxAPI({
      url: proxmoxConfig.url,
      username: proxmoxConfig.username,
      token: proxmoxConfig.token,
    });
    
    // Get first node (assuming single node setup)
    const nodes = await api.getNodes();
    const node = nodes?.[0]?.node ?? 'pve';
    
    const metricsPromises = lxcs.map(async (lxc) => {
      try {
        // Get LXC status from Proxmox
        const status = await api.getLXCStatus(node, lxc.proxmoxId);
        
        let containers: any[] = [];
        
        // If LXC is running, get Docker containers via SSH
        if (status?.status === 'running') {
          try {
            const sshClient = new SSHClient({
              host: lxc.ipAddress,
              port: lxc.sshPort,
              username: lxc.sshUsername,
              password: lxc.sshPassword ?? undefined,
              privateKey: lxc.sshKey ?? undefined,
            });
            
            containers = await sshClient.getDockerContainers();
          } catch (error) {
            console.error(`Error fetching containers for LXC ${lxc.name}:`, error);
          }
        }
        
        return {
          id: lxc.id,
          proxmoxId: lxc.proxmoxId,
          name: lxc.name,
          ipAddress: lxc.ipAddress,
          status: status?.status ?? 'stopped',
          uptime: status?.uptime,
          cpu: status?.cpu,
          mem: status?.mem,
          maxmem: status?.maxmem,
          disk: status?.disk,
          maxdisk: status?.maxdisk,
          netin: status?.netin,
          netout: status?.netout,
          containers,
        } as LXCMetrics;
      } catch (error) {
        console.error(`Error fetching metrics for LXC ${lxc.name}:`, error);
        return {
          id: lxc.id,
          proxmoxId: lxc.proxmoxId,
          name: lxc.name,
          ipAddress: lxc.ipAddress,
          status: 'stopped',
          containers: [],
        } as LXCMetrics;
      }
    });
    
    const metrics = await Promise.all(metricsPromises);
    
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
