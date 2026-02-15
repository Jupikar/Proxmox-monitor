'use client';

import { useEffect, useState } from 'react';
import { Server, Container, PlayCircle, StopCircle } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { LXCCard } from '@/components/lxc-card';
import { motion } from 'framer-motion';

interface Metrics {
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      
      if (data?.configured === false) {
        setError('Proxmox not configured');
        setMetrics([]);
      } else if (data?.error) {
        console.error('Metrics error:', data.error);
        setError(data.error);
        setMetrics([]);
      } else {
        setMetrics(data?.metrics ?? []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Erreur lors de la récupération des métriques');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(() => {
      fetchMetrics();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const totalLXCs = metrics?.length ?? 0;
  const runningLXCs = metrics?.filter(m => m?.status === 'running')?.length ?? 0;
  const totalContainers = metrics?.reduce((sum, m) => sum + (m?.containers?.length ?? 0), 0) ?? 0;
  const runningContainers = metrics?.reduce(
    (sum, m) => sum + (m?.containers?.filter(c => c?.state === 'running')?.length ?? 0),
    0
  ) ?? 0;
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des métriques...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    const isNotConfigured = error === 'Proxmox not configured';
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className={`rounded-lg border p-6 text-center ${
          isNotConfigured
            ? 'bg-blue-500/10 border-blue-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <p className={`font-medium ${
            isNotConfigured
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isNotConfigured ? 'Configuration requise' : error}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isNotConfigured
              ? 'Configurez votre connexion Proxmox dans la page Configuration pour commencer.'
              : 'Vérifiez votre configuration dans la page Configuration.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de vos LXC et conteneurs Docker en temps réel
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="LXC Totaux"
          value={totalLXCs}
          icon={Server}
          color="bg-blue-500"
        />
        <StatsCard
          title="LXC Actifs"
          value={runningLXCs}
          icon={PlayCircle}
          color="bg-green-500"
        />
        <StatsCard
          title="Conteneurs Totaux"
          value={totalContainers}
          icon={Container}
          color="bg-purple-500"
        />
        <StatsCard
          title="Conteneurs Actifs"
          value={runningContainers}
          icon={PlayCircle}
          color="bg-orange-500"
        />
      </div>
      
      <div className="space-y-6">
        {metrics?.length === 0 ? (
          <div className="rounded-lg bg-muted/50 p-12 text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucun LXC configuré</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez vos premiers LXC dans la page Configuration pour commencer.
            </p>
          </div>
        ) : (
          metrics?.map((lxc) => (
            <LXCCard key={lxc?.id ?? Math.random()} lxc={lxc} />
          ))
        )}
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Rafraîchissement automatique toutes les 10 secondes
      </div>
    </div>
  );
}
