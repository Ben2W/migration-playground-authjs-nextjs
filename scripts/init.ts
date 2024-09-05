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
    ora(
      'Env variables already set. (Delete .env file to re-run setup)',
    ).succeed();
    return;
  }

  let migrationsApiBaseUrl = await select({
    message: 'Select the API base URL:',
    choices: [
      { value: 'http://localhost:8080', name: 'http://localhost:8080' },
      { value: 'https://api.clerk-dev.com', name: 'https://api.clerk-dev.com' },
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

  const instanceId = await ensureInstanceIdAuthorized({
    clerkSecret,
    migrationsApiBaseUrl,
  });

  const resendEmail = await getResendEmailFrom(
    clerkSecret,
    migrationsApiBaseUrl,
  );

  const resendApiKey = await getNewResendApiToken({
    clerkSecret,
    migrationsApiBaseUrl,
  });

  let tursoDbUrl: string | undefined = 'file:dev.db';
  let tursoDbToken: string | undefined = undefined;

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
    resendApiKey,
    resendEmail,
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
  resendApiKey,
  resendEmail,
  githubId,
  githubToken,
}: {
  migrationsApiBaseUrl: string;
  clerkSecret: string;
  clerkPublishableKey: string;
  instanceId: string;
  tursoDbUrl: string;
  tursoDbToken: string | undefined;
  resendApiKey: string;
  resendEmail: string;
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
    `TURSO_DATABASE_URL=${tursoDbUrl}`,
    `${tursoDbToken ? `TURSO_AUTH_TOKEN=${tursoDbToken}` : '# TURSO_AUTH_TOKEN='}`,
    `RESEND_API_KEY=${resendApiKey}`,
    `RESEND_EMAIL_FROM=${resendEmail}`,
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

async function ensureInstanceIdAuthorized({
  clerkSecret,
  migrationsApiBaseUrl,
}: {
  clerkSecret: string;
  migrationsApiBaseUrl: string;
}): Promise<string> {
  const canUsePlaygroundApi = await fetch(
    `${migrationsApiBaseUrl}/migrations/playground`,
    {
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
      },
    },
  );

  if (!canUsePlaygroundApi.ok) {
    if (canUsePlaygroundApi.status === 403) {
      const data = await canUsePlaygroundApi.json();
      throw new Error(data.error);
    } else {
      throw new Error(
        `Could not access the playground API. Status: ${canUsePlaygroundApi.status}`,
      );
    }
  }

  const responseSchema = z.object({
    instance_id: z.string(),
  });

  const data = responseSchema.parse(await canUsePlaygroundApi.json());
  return data.instance_id;
}

async function getResendEmailFrom(
  clerkSecret: string,
  migrationsApiBaseUrl: string,
) {
  const response = await fetch(
    `${migrationsApiBaseUrl}/migrations/playground/get-resend-from`,
    {
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get Resend email from: ${response.statusText}`);
  }

  const responseSchema = z.object({
    email: z.string(),
  });

  const data = responseSchema.parse(await response.json());
  return data.email;
}

async function getNewResendApiToken({
  clerkSecret,
  migrationsApiBaseUrl,
}: {
  clerkSecret: string;
  migrationsApiBaseUrl: string;
}) {
  const response = await fetch(
    `${migrationsApiBaseUrl}/migrations/playground/create-resend-api-key`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to create Resend API key: ${response.statusText}`);
  }
  const responseSchema = z.object({
    token: z.string(),
  });

  const data = responseSchema.parse(await response.json());
  return data.token;
}
