import https from 'https';
import axios, { AxiosInstance } from 'axios';

export interface ProxmoxCredentials {
  url: string;
  username: string;
  token: string;
}

export interface LXCStatus {
  status: 'running' | 'stopped';
  uptime?: number;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  netin?: number;
  netout?: number;
}

export class ProxmoxAPI {
  private client: AxiosInstance;
  private credentials: ProxmoxCredentials;

  constructor(credentials: ProxmoxCredentials) {
    this.credentials = credentials;
    const baseURL = credentials.url.endsWith('/') ? credentials.url.slice(0, -1) : credentials.url;
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `PVEAPIToken=${credentials.username}=${credentials.token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api2/json/version');
      return response?.status === 200;
    } catch (error) {
      console.error('Proxmox connection error:', error);
      return false;
    }
  }

  async getLXCStatus(node: string, vmid: number): Promise<LXCStatus | null> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/lxc/${vmid}/status/current`);
      return response?.data?.data ?? null;
    } catch (error) {
      console.error(`Error fetching LXC ${vmid} status:`, error);
      return null;
    }
  }

  async getLXCList(node: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/lxc`);
      return response?.data?.data ?? [];
    } catch (error) {
      console.error('Error fetching LXC list:', error);
      return [];
    }
  }

  async getNodes(): Promise<any[]> {
    try {
      const response = await this.client.get('/api2/json/nodes');
      return response?.data?.data ?? [];
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return [];
    }
  }
}
