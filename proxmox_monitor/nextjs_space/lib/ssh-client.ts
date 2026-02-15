import { Client, ConnectConfig } from 'ssh2';

export interface SSHCredentials {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'dead';
  cpuPercent?: string;
  memUsage?: string;
  memLimit?: string;
  memPercent?: string;
  netIO?: string;
  blockIO?: string;
}

export class SSHClient {
  private credentials: SSHCredentials;

  constructor(credentials: SSHCredentials) {
    this.credentials = credentials;
  }

  private async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let output = '';
      let errorOutput = '';

      const config: ConnectConfig = {
        host: this.credentials.host,
        port: this.credentials.port,
        username: this.credentials.username,
        readyTimeout: 10000,
      };

      if (this.credentials.privateKey) {
        config.privateKey = this.credentials.privateKey;
      } else if (this.credentials.password) {
        config.password = this.credentials.password;
      }

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }

          stream.on('close', () => {
            conn.end();
            if (errorOutput && !output) {
              reject(new Error(errorOutput));
            } else {
              resolve(output);
            }
          }).on('data', (data: Buffer) => {
            output += data.toString();
          }).stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });
        });
      }).on('error', (err) => {
        reject(err);
      });

      conn.connect(config);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.executeCommand('echo "test"');
      return true;
    } catch (error) {
      console.error('SSH connection error:', error);
      return false;
    }
  }

  async getDockerContainers(): Promise<DockerContainer[]> {
    try {
      const output = await this.executeCommand(
        'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}"'
      );
      
      const lines = output.trim().split('\n').filter(line => line.length > 0);
      return lines.map(line => {
        const [id, name, image, status, state] = line.split('|');
        return {
          id: id ?? '',
          name: name ?? '',
          image: image ?? '',
          status: status ?? '',
          state: (state?.toLowerCase() as any) ?? 'exited',
        };
      });
    } catch (error) {
      console.error('Error fetching Docker containers:', error);
      return [];
    }
  }

  async getDockerContainerStats(containerId: string): Promise<Partial<DockerContainer>> {
    try {
      const output = await this.executeCommand(
        `docker stats ${containerId} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}"`
      );
      
      const [cpuPercent, memUsage, memPercent, netIO, blockIO] = output.trim().split('|');
      const [usage, limit] = memUsage?.split('/') ?? ['', ''];
      
      return {
        cpuPercent: cpuPercent ?? '0%',
        memUsage: usage?.trim() ?? '0B',
        memLimit: limit?.trim() ?? '0B',
        memPercent: memPercent ?? '0%',
        netIO: netIO ?? '0B / 0B',
        blockIO: blockIO ?? '0B / 0B',
      };
    } catch (error) {
      console.error(`Error fetching stats for container ${containerId}:`, error);
      return {};
    }
  }

  async controlDockerContainer(containerId: string, action: 'start' | 'stop' | 'restart'): Promise<boolean> {
    try {
      await this.executeCommand(`docker ${action} ${containerId}`);
      return true;
    } catch (error) {
      console.error(`Error ${action}ing container ${containerId}:`, error);
      return false;
    }
  }
}
