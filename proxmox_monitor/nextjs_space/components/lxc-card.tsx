'use client';

import { motion } from 'framer-motion';
import { Server, HardDrive, Cpu, MemoryStick, Network, Clock } from 'lucide-react';
import { DockerContainerList } from './docker-container-list';

interface LXCCardProps {
  lxc: {
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
  };
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i] ?? 'B'}`;
}

function formatUptime(seconds?: number): string {
  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function LXCCard({ lxc }: LXCCardProps) {
  const isRunning = lxc?.status === 'running';
  const cpuPercent = ((lxc?.cpu ?? 0) * 100).toFixed(1);
  const memPercent = lxc?.maxmem ? ((lxc?.mem ?? 0) / lxc.maxmem * 100).toFixed(1) : '0';
  const diskPercent = lxc?.maxdisk ? ((lxc?.disk ?? 0) / lxc.maxdisk * 100).toFixed(1) : '0';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg bg-card p-6 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${
            isRunning ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <Server className={`h-5 w-5 ${
              isRunning ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{lxc?.name ?? 'Unknown'}</h3>
            <p className="text-sm text-muted-foreground">
              LXC {lxc?.proxmoxId ?? 'N/A'} • {lxc?.ipAddress ?? 'N/A'}
            </p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isRunning
            ? 'bg-green-500/20 text-green-700 dark:text-green-300'
            : 'bg-red-500/20 text-red-700 dark:text-red-300'
        }`}>
          {isRunning ? 'Running' : 'Stopped'}
        </span>
      </div>
      
      {isRunning && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Uptime:</span>
              <span className="font-medium">{formatUptime(lxc?.uptime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">CPU:</span>
              <span className="font-medium">{cpuPercent}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MemoryStick className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">RAM:</span>
              <span className="font-medium">
                {formatBytes(lxc?.mem)} / {formatBytes(lxc?.maxmem)} ({memPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">Disque:</span>
              <span className="font-medium">
                {formatBytes(lxc?.disk)} / {formatBytes(lxc?.maxdisk)} ({diskPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm col-span-2">
              <Network className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Réseau:</span>
              <span className="font-medium">
                ↓ {formatBytes(lxc?.netin)} / ↑ {formatBytes(lxc?.netout)}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>Conteneurs Docker</span>
              <span className="text-xs text-muted-foreground">({lxc?.containers?.length ?? 0})</span>
            </h4>
            <DockerContainerList containers={lxc?.containers ?? []} lxcId={lxc?.id ?? ''} />
          </div>
        </>
      )}
    </motion.div>
  );
}
