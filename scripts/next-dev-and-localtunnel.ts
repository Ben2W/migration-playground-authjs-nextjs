import localtunnel, { Tunnel } from 'localtunnel';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function getPublicIp(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching public IP:', error);
    throw error;
  }
}

async function updateEnvFile(newVars: Record<string, string>, remove = false) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = await fs.readFile(envPath, 'utf-8').catch(() => '');

  for (const [key, value] of Object.entries(newVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (remove) {
      envContent = envContent.replace(regex, '');
    } else if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  await fs.writeFile(envPath, envContent.trim());
}

(async () => {
  const port = 3005;
  let tunnel: Tunnel;
  try {
    const tunnelPromise = localtunnel({
      port,
      subdomain: `auth-playground-${Math.random().toString(36).substring(2, 6)}`,
    });
    tunnel = await Promise.race([
      tunnelPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Localtunnel connection timeout. (The a16z office wifi blocks localtunnel)',
              ),
            ),
          3000,
        ),
      ),
    ]);

    if (!tunnel || !tunnel.url) {
      throw new Error('Localtunnel connection failed');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error connecting to localtunnel:', error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    process.exit(1);
  }
  const publicIp = await getPublicIp();

  const newEnvVars = {
    NEXT_PUBLIC_TUNNEL_URL: tunnel.url,
    NEXT_PUBLIC_IPV4_IP: publicIp,
  };

  await updateEnvFile(newEnvVars);
  console.log('Updated .env file with new variables');
  console.log(`Public IPv4 Address: ${publicIp}`);

  // Spawn the Next.js dev server
  const nextDev = spawn('next', ['dev', '--turbo', '-p', port.toString()], {
    stdio: 'inherit',
  });

  // Handle Next.js dev server closure
  nextDev.on('close', async (code) => {
    console.log(`Next.js dev server stopped with code ${code}`);
    tunnel.close();
    console.log('LocalTunnel closed');
    await updateEnvFile(newEnvVars, true);
    console.log('Removed temporary variables from .env file');
    process.exit(code);
  });

  // Handle process termination signals
  async function cleanup() {
    nextDev.kill('SIGTERM');
    tunnel.close();
    await updateEnvFile(newEnvVars, true);
    console.log('Removed temporary variables from .env file');
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
})();
