import ora from 'ora';
import { input, confirm, select } from '@inquirer/prompts';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import chalk from 'chalk';
import { z } from 'zod';

init();

export default async function init(inputClerkSecret?: string) {
  const alreadySetup = process.env.SETUP_COMPLETE;

  if (alreadySetup) {
    ora('Env variables already set. (run pnpm delete to reset)').succeed();
    return;
  }

  let clerkApiBaseUrl = await select({
    message: 'Select the Clerk API base URL:',
    choices: [
      { value: 'https://api.clerk.dev', name: 'https://api.clerk.dev' },
      {
        value: 'https://api.clerkstage.dev',
        name: 'https://api.clerkstage.dev',
      },
      { value: 'https://api.lclclerk.com', name: 'https://api.lclclerk.com' },
      { value: 'other', name: 'Other' },
    ],
  });

  if (clerkApiBaseUrl === 'other') {
    clerkApiBaseUrl = await input({
      message: 'Enter the Clerk API base URL:',
    });
  }

  let migrationsApiBaseUrl = await select({
    message: 'Select the Migrations API base URL:',
    choices: [
      { value: 'http://localhost:8080', name: 'http://localhost:8080' },
      { value: 'other', name: 'Other' },
    ],
  });

  if (migrationsApiBaseUrl === 'other') {
    migrationsApiBaseUrl = await input({
      message: 'Enter the API base URL:',
      validate: (input) =>
        input.startsWith('http') || 'API base URL must start with http',
    });
  }

  const clerkPublishableKey =
    inputClerkSecret ||
    (await input({
      message: 'Enter your Clerk publishable key (must start with pk_test_):',
      validate: (input) =>
        input.startsWith('pk_test_') ||
        'Clerk publishable key must start with pk_test_',
    }));

  const clerkSecret =
    inputClerkSecret ||
    (await input({
      message: 'Enter your Clerk secret (must start with sk_test_):',
      validate: (input) =>
        input.startsWith('sk_test_') || 'Clerk secret must start with sk_test_',
    }));

  const instanceId = await getInstanceId({
    clerkSecret,
    clerkApiBaseUrl,
  });

  const useTurso = await select({
    message: 'Would you like to use a sqlite file or a Turso database?',
    choices: [
      { value: 'sqlite', name: 'file:dev.db' },
      { value: 'turso', name: 'Turso' },
    ],
  });

  const tursoDbUrl =
    useTurso === 'sqlite'
      ? 'file:dev.db'
      : await input({
          message: 'Enter your Turso database URL:',
          validate: (input) =>
            input.startsWith('libsql://') ||
            'Turso database URL must start with libsql://',
        });
  const tursoDbToken =
    useTurso === 'sqlite'
      ? undefined
      : await input({
          message: 'Enter your Turso auth token:',
          validate: (input) =>
            input.length > 0 || 'Turso auth token cannot be empty',
        });

  const client = createClient({
    url: tursoDbUrl,
    authToken: tursoDbToken,
  });
  const spinner = ora('Setting up database...').start();

  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle' });

  spinner.succeed('Database migrated successfully');

  let githubId: string | null = null;
  let githubToken: string | null = null;

  if (
    await confirm({
      message: 'Do you want to connect GitHub for github OAuth?',
    })
  ) {
    console.log(
      `Create an OAuth app here: ${chalk.cyan(
        'https://github.com/settings/applications/new',
      )}`,
    );

    console.log(
      `Use this Homepage URL: ${chalk.cyan('http://localhost:3005')}`,
    );

    console.log(
      `Use this callback URL: ${chalk.cyan(
        'http://localhost:3005/api/auth/callback/github',
      )}`,
    );

    githubId = await input({
      message: 'Enter your GitHub Client ID:',
      validate: (input) =>
        input.length > 0 || 'GitHub Client ID cannot be empty',
    });

    githubToken = await input({
      message: 'Enter your GitHub Client Secret:',
      validate: (input) =>
        input.length > 0 || 'GitHub Client Secret cannot be empty',
    });
  }

  await wipeAndWriteEnv({
    migrationsApiBaseUrl,
    clerkSecret,
    clerkPublishableKey,
    instanceId,
    tursoDbUrl,
    tursoDbToken,
    clerkApiBaseUrl,
    githubId,
    githubToken,
  });

  spinner.succeed(
    `Setup complete. Run ${chalk.cyan('`bun db:studio`')} to open the Drizzle Studio.`,
  );
}

async function wipeAndWriteEnv({
  migrationsApiBaseUrl,
  clerkSecret,
  clerkPublishableKey,
  instanceId,
  tursoDbUrl,
  tursoDbToken,
  clerkApiBaseUrl,
  githubId,
  githubToken,
}: {
  migrationsApiBaseUrl: string;
  clerkSecret: string;
  clerkPublishableKey: string;
  instanceId: string;
  tursoDbUrl: string;
  tursoDbToken: string | undefined;
  clerkApiBaseUrl: string;
  githubId: string | null;
  githubToken: string | null;
}) {
  // Generate a 32-character random string for AUTH_SECRET
  const authSecret = Buffer.from(
    crypto.getRandomValues(new Uint8Array(24)),
  ).toString('base64');

  const envContent = [
    `NEXT_PUBLIC_HONO_API_URL=${migrationsApiBaseUrl}`,
    `CLERK_SECRET_KEY=${clerkSecret}`,
    `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${clerkPublishableKey}`,
    `NEXT_PUBLIC_CLERK_INSTANCE_ID=${instanceId}`,
    `NEXT_PUBLIC_CLERK_API_URL=${clerkApiBaseUrl}`,
    `TURSO_DATABASE_URL=${tursoDbUrl}`,
    `${tursoDbToken ? `TURSO_AUTH_TOKEN=${tursoDbToken}` : '# TURSO_AUTH_TOKEN='}`,
    `AUTH_SECRET=${authSecret}`,
    `${githubId ? `AUTH_GITHUB_ID=${githubId}` : '# AUTH_GITHUB_ID='}`,
    `${githubToken ? `AUTH_GITHUB_SECRET=${githubToken}` : '# AUTH_GITHUB_SECRET='}`,
    `SETUP_COMPLETE=true`,
  ].join('\n');

  const spinner = ora('Writing environment variables to .env file').start();

  try {
    await import('fs/promises').then(async (fs) => {
      // Clean existing .env file
      await fs.writeFile('.env', '');
      // Write new content
      await fs.writeFile('.env', envContent, { flag: 'w' });
    });
    spinner.succeed('Wiped Environment variables');
  } catch (error) {
    spinner.fail('Failed to write to .env file:');
    console.error(error);
  }
}

const getInstanceId = async ({
  clerkSecret,
  clerkApiBaseUrl,
}: {
  clerkSecret: string;
  clerkApiBaseUrl: string;
}) => {
  const responseSchema = z.object({
    keys: z.array(
      z.object({
        kid: z.string(),
      }),
    ),
  });

  const response = await fetch(`${clerkApiBaseUrl}/v1/jwks`, {
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
    },
  });

  const status = response.status;

  if (status !== 200) {
    throw new Error(`Failed to get instance ID: ${status}`);
  }

  const json = await response.json();

  const data = responseSchema.parse(json);

  const kid = data.keys[0].kid;

  if (!kid) {
    throw new Error('Failed to get instance ID');
  }

  return kid;
};
