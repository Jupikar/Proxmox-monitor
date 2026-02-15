'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Server, Plus, Trash2, Edit, Check, X } from 'lucide-react';

interface LXCConfig {
  id: string;
  proxmoxId: number;
  name: string;
  ipAddress: string;
  sshPort: number;
  sshUsername: string;
  sshPassword?: string;
  sshKey?: string;
}

export default function ConfigPage() {
  const [proxmoxUrl, setProxmoxUrl] = useState('');
  const [proxmoxUsername, setProxmoxUsername] = useState('');
  const [proxmoxToken, setProxmoxToken] = useState('');
  const [testingProxmox, setTestingProxmox] = useState(false);
  const [proxmoxSuccess, setProxmoxSuccess] = useState<boolean | null>(null);
  
  const [lxcs, setLxcs] = useState<LXCConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    proxmoxId: '',
    name: '',
    ipAddress: '',
    sshPort: '22',
    sshUsername: '',
    sshPassword: '',
    sshKey: '',
  });
  
  useEffect(() => {
    fetchProxmoxConfig();
    fetchLXCs();
  }, []);
  
  const fetchProxmoxConfig = async () => {
    try {
      const response = await fetch('/api/proxmox/config');
      const data = await response.json();
      
      if (data?.config) {
        setProxmoxUrl(data.config.url ?? '');
        setProxmoxUsername(data.config.username ?? '');
        setProxmoxToken(data.config.token ?? '');
      }
    } catch (error) {
      console.error('Error fetching Proxmox config:', error);
    }
  };
  
  const fetchLXCs = async () => {
    try {
      const response = await fetch('/api/lxc/config');
      const data = await response.json();
      setLxcs(data?.lxcs ?? []);
    } catch (error) {
      console.error('Error fetching LXCs:', error);
    }
  };
  
  const handleTestProxmox = async () => {
    setTestingProxmox(true);
    setProxmoxSuccess(null);
    
    try {
      const response = await fetch('/api/proxmox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: proxmoxUrl,
          username: proxmoxUsername,
          token: proxmoxToken,
        }),
      });
      
      const data = await response.json();
      setProxmoxSuccess(data?.success ?? false);
    } catch (error) {
      console.error('Error testing Proxmox:', error);
      setProxmoxSuccess(false);
    } finally {
      setTestingProxmox(false);
    }
  };
  
  const handleSaveProxmox = async () => {
    try {
      await fetch('/api/proxmox/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: proxmoxUrl,
          username: proxmoxUsername,
          token: proxmoxToken,
        }),
      });
      
      alert('Configuration Proxmox sauvegardée');
    } catch (error) {
      console.error('Error saving Proxmox config:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };
  
  const handleTestSSH = async () => {
    try {
      const response = await fetch('/api/lxc/test-ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: formData.ipAddress,
          sshPort: parseInt(formData.sshPort),
          sshUsername: formData.sshUsername,
          sshPassword: formData.sshPassword || undefined,
          sshKey: formData.sshKey || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data?.success) {
        alert('Connexion SSH réussie !');
      } else {
        alert('Connexion SSH échouée');
      }
    } catch (error) {
      console.error('Error testing SSH:', error);
      alert('Erreur lors du test SSH');
    }
  };
  
  const handleSaveLXC = async () => {
    try {
      const url = editingId
        ? `/api/lxc/config/${editingId}`
        : '/api/lxc/config';
      
      const method = editingId ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        proxmoxId: '',
        name: '',
        ipAddress: '',
        sshPort: '22',
        sshUsername: '',
        sshPassword: '',
        sshKey: '',
      });
      
      fetchLXCs();
    } catch (error) {
      console.error('Error saving LXC:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };
  
  const handleDeleteLXC = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce LXC ?')) return;
    
    try {
      await fetch(`/api/lxc/config/${id}`, { method: 'DELETE' });
      fetchLXCs();
    } catch (error) {
      console.error('Error deleting LXC:', error);
      alert('Erreur lors de la suppression');
    }
  };
  
  const handleEditLXC = (lxc: LXCConfig) => {
    setEditingId(lxc?.id ?? null);
    setFormData({
      proxmoxId: lxc?.proxmoxId?.toString() ?? '',
      name: lxc?.name ?? '',
      ipAddress: lxc?.ipAddress ?? '',
      sshPort: lxc?.sshPort?.toString() ?? '22',
      sshUsername: lxc?.sshUsername ?? '',
      sshPassword: lxc?.sshPassword ?? '',
      sshKey: lxc?.sshKey ?? '',
    });
    setShowAddForm(true);
  };
  
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Configuration</h1>
        <p className="text-muted-foreground">
          Configurez votre connexion Proxmox et ajoutez vos LXC à surveiller
        </p>
      </motion.div>
      
      {/* Proxmox Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-lg bg-card p-6 shadow-md mb-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Connexion Proxmox</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">URL du serveur Proxmox</label>
            <input
              type="text"
              value={proxmoxUrl}
              onChange={(e) => setProxmoxUrl(e.target.value)}
              placeholder="https://proxmox.example.com:8006"
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Nom d'utilisateur API</label>
            <input
              type="text"
              value={proxmoxUsername}
              onChange={(e) => setProxmoxUsername(e.target.value)}
              placeholder="user@pam!token"
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Token API</label>
            <input
              type="password"
              value={proxmoxToken}
              onChange={(e) => setProxmoxToken(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleTestProxmox}
              disabled={testingProxmox}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {testingProxmox ? 'Test en cours...' : 'Tester la connexion'}
            </button>
            
            <button
              onClick={handleSaveProxmox}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Sauvegarder
            </button>
            
            {proxmoxSuccess !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                proxmoxSuccess
                  ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                  : 'bg-red-500/20 text-red-700 dark:text-red-300'
              }`}>
                {proxmoxSuccess ? (
                  <><Check className="h-4 w-4" /> Connexion réussie</>
                ) : (
                  <><X className="h-4 w-4" /> Connexion échouée</>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* LXC Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-lg bg-card p-6 shadow-md"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">LXC à surveiller</h2>
          </div>
          
          {!showAddForm && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
                setFormData({
                  proxmoxId: '',
                  name: '',
                  ipAddress: '',
                  sshPort: '22',
                  sshUsername: '',
                  sshPassword: '',
                  sshKey: '',
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Ajouter un LXC
            </button>
          )}
        </div>
        
        {showAddForm && (
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
            <h3 className="text-lg font-medium mb-4">
              {editingId ? 'Éditer le LXC' : 'Ajouter un nouveau LXC'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">ID Proxmox</label>
                <input
                  type="number"
                  value={formData.proxmoxId}
                  onChange={(e) => setFormData({ ...formData, proxmoxId: e.target.value })}
                  placeholder="100"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nom personnalisé</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mon LXC"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Adresse IP</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="192.168.1.100"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Port SSH</label>
                <input
                  type="number"
                  value={formData.sshPort}
                  onChange={(e) => setFormData({ ...formData, sshPort: e.target.value })}
                  placeholder="22"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Utilisateur SSH</label>
                <input
                  type="text"
                  value={formData.sshUsername}
                  onChange={(e) => setFormData({ ...formData, sshUsername: e.target.value })}
                  placeholder="root"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe SSH</label>
                <input
                  type="password"
                  value={formData.sshPassword}
                  onChange={(e) => setFormData({ ...formData, sshPassword: e.target.value })}
                  placeholder="(optionnel si clé SSH)"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Clé privée SSH (optionnel)</label>
              <textarea
                value={formData.sshKey}
                onChange={(e) => setFormData({ ...formData, sshKey: e.target.value })}
                placeholder="-----BEGIN RSA PRIVATE KEY-----"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border bg-background font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleTestSSH}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Tester SSH
              </button>
              
              <button
                onClick={handleSaveLXC}
                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
              
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {lxcs?.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Aucun LXC configuré. Ajoutez-en un pour commencer.
            </p>
          ) : (
            lxcs?.map((lxc) => (
              <div
                key={lxc?.id ?? Math.random()}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{lxc?.name ?? 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    LXC {lxc?.proxmoxId ?? 'N/A'} • {lxc?.ipAddress ?? 'N/A'} • {lxc?.sshUsername ?? 'N/A'}@{lxc?.sshPort ?? 22}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditLXC(lxc)}
                    className="p-2 rounded hover:bg-blue-500/20 transition-colors"
                    title="Éditer"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteLXC(lxc?.id ?? '')}
                    className="p-2 rounded hover:bg-red-500/20 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
