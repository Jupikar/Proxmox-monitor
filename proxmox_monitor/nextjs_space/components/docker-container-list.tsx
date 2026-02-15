'use client';

import { useState } from 'react';
import { Container, Play, Square, RotateCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'dead';
}

interface DockerContainerListProps {
  containers: DockerContainer[];
  lxcId: string;
}

export function DockerContainerList({ containers, lxcId }: DockerContainerListProps) {
  const [loadingContainer, setLoadingContainer] = useState<string | null>(null);
  
  const handleAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    setLoadingContainer(containerId);
    
    try {
      const response = await fetch('/api/docker/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lxcId, containerId, action }),
      });
      
      const data = await response.json();
      
      if (data?.success) {
        // Refresh will happen on next poll
        setTimeout(() => setLoadingContainer(null), 1000);
      } else {
        alert('Action échouée');
        setLoadingContainer(null);
      }
    } catch (error) {
      console.error('Error controlling container:', error);
      alert('Erreur lors de l\'action');
      setLoadingContainer(null);
    }
  };
  
  if (!containers || containers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">Aucun conteneur Docker détecté</p>
    );
  }
  
  return (
    <div className="space-y-2">
      {containers.map((container, index) => {
        const isRunning = container?.state === 'running';
        const isLoading = loadingContainer === container?.id;
        
        return (
          <motion.div
            key={container?.id ?? index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`rounded-full p-1.5 ${
                isRunning ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Container className={`h-4 w-4 ${
                  isRunning ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{container?.name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground truncate">{container?.image ?? 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {!isRunning && (
                    <button
                      onClick={() => handleAction(container?.id ?? '', 'start')}
                      className="p-1.5 rounded hover:bg-green-500/20 transition-colors group"
                      title="Démarrer"
                    >
                      <Play className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                    </button>
                  )}
                  {isRunning && (
                    <>
                      <button
                        onClick={() => handleAction(container?.id ?? '', 'restart')}
                        className="p-1.5 rounded hover:bg-blue-500/20 transition-colors group"
                        title="Redémarrer"
                      >
                        <RotateCw className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                      </button>
                      <button
                        onClick={() => handleAction(container?.id ?? '', 'stop')}
                        className="p-1.5 rounded hover:bg-red-500/20 transition-colors group"
                        title="Arrêter"
                      >
                        <Square className="h-4 w-4 text-red-600 group-hover:text-red-700" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
