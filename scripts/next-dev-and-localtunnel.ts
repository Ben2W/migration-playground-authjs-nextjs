import localtunnel, { Tunnel } from 'localtunnel';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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

function generateSubdomain(secretKey: string): string {
  const hash = crypto.createHash('sha256').update(secretKey).digest('hex');
  return hash.slice(0, 4);
}

(async () => {
  const port = 3005;
  let tunnel: Tunnel;
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
    const subdomain = `auth-playground-${generateSubdomain(clerkSecretKey)}`;
    const tunnelPromise = localtunnel({
      port,
      subdomain,
    });
    tunnel = await Promise.race([
      tunnelPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Localtunnel connection timeout.')),
          5000,
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

  const newEnvVars = {
    NEXT_PUBLIC_TUNNEL_URL: tunnel.url,
  };

  await updateEnvFile(newEnvVars);
  console.log('Updated .env file with new variables');

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
