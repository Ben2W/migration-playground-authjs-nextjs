import ora from 'ora';
import { input, select, confirm } from '@inquirer/prompts';
import { createTursoDb } from './common-functions/create-turso-db';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import chalk from 'chalk';
import { z } from 'zod';

init();

const honoApiUrl = () => {
  return process.env.NEXT_PUBLIC_HONO_API_URL || 'http://localhost:8080';
};

export default async function init(inputClerkSecret?: string) {
  const alreadySetup = process.env.SETUP_COMPLETE;

  if (alreadySetup) {
    ora(
      'Env variables already set. (Delete .env file to re-run setup)',
    ).succeed();
    return;
  }

  const clerkSecret =
    inputClerkSecret ||
    (await input({
      message: 'Enter your Clerk secret (must start with sk_test_):',
      validate: (input) =>
        input.startsWith('sk_test_') || 'Clerk secret must start with sk_test_',
    }));

  await ensureInstanceIdAuthorized(clerkSecret);

  const resendEmail = await getResendEmailFrom(clerkSecret);

  const resendApiKey = await getNewResendApiToken(clerkSecret);

  let tursoDbUrl: string | null = null;
  let tursoDbToken: string | null = null;

  const selection = await select({
    message:
      'You need a libSQL database. Would you like us to give you one, or would you like to use your own?',
    choices: [
      {
        name: 'Create one for me',
        value: 'create',
      },
      {
        name: 'Use my own',
        value: 'use',
      },
    ],
  });
  if (selection === 'create') {
    const newDb = await createTursoDb(clerkSecret, honoApiUrl());
    if ('failed' in newDb) {
      await init(clerkSecret);
      return;
    }
    tursoDbUrl = newDb.url;
    tursoDbToken = newDb.token;
  } else {
    console.log('You can create a libSQL database here: https://turso.tech');
    tursoDbUrl = await input({
      message: 'Enter your Turso database URL:',
      validate: (input) =>
        input.length > 0 || 'Turso database URL cannot be empty',
    });
    tursoDbToken = await input({
      message: 'Enter your Turso database token:',
      validate: (input) =>
        input.length > 0 || 'Turso database token cannot be empty',
    });
  }

  await migrateDb({ url: tursoDbUrl, token: tursoDbToken });

  const spinner = ora('Testing database connection...').start();
  const client = createClient({
    url: tursoDbUrl,
    authToken: tursoDbToken,
  });

  let success = false;
  try {
    await client.execute({ sql: 'SELECT 1', args: [] });
    spinner.succeed(
      'Database connection test successful - the database is online!',
    );
    success = true;
  } catch (error) {
    spinner.fail('Failed to connect to the database. Please try again.');
  }

  if (!success) {
    await init();
  }

  await wipeAndWriteEnv({
    clerkSecret,
    tursoDbUrl,
    tursoDbToken,
    resendApiKey,
    resendEmail,
  });

  spinner.succeed(
    `Setup complete. Run ${chalk.cyan('`bun db:studio`')} to open the Drizzle Studio.`,
  );
}

async function wipeAndWriteEnv({
  clerkSecret,
  tursoDbUrl,
  tursoDbToken,
  resendApiKey,
  resendEmail,
}: {
  clerkSecret: string;
  tursoDbUrl: string;
  tursoDbToken: string;
  resendApiKey: string;
  resendEmail: string;
}) {
  // Generate a 32-character random string for AUTH_SECRET
  const authSecret = Buffer.from(
    crypto.getRandomValues(new Uint8Array(24)),
  ).toString('base64');

  const envContent = [
    `NEXT_PUBLIC_HONO_API_URL=${honoApiUrl()}`,
    `CLERK_SECRET_KEY=${clerkSecret}`,
    `TURSO_DATABASE_URL=${tursoDbUrl}`,
    `TURSO_AUTH_TOKEN=${tursoDbToken}`,
    `RESEND_API_KEY=${resendApiKey}`,
    `RESEND_EMAIL_FROM=${resendEmail}`,
    `AUTH_SECRET=${authSecret}`,
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

async function ensureInstanceIdAuthorized(clerkSecret: string) {
  const canUsePlaygroundApi = await fetch(`${honoApiUrl()}/playground`, {
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
    },
  });

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
}

async function getResendEmailFrom(clerkSecret: string) {
  const response = await fetch(`${honoApiUrl()}/playground/get-resend-from`, {
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Resend email from: ${response.statusText}`);
  }

  const responseSchema = z.object({
    email: z.string(),
  });

  const data = responseSchema.parse(await response.json());
  return data.email;
}

async function getNewResendApiToken(clerkSecret: string) {
  const response = await fetch(
    `${honoApiUrl()}/playground/create-resend-api-key`,
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

async function migrateDb({ url, token }: { url: string; token: string }) {
  const spinner = ora('Migrating database...').start();

  const client = createClient({
    url: url,
    authToken: token,
  });

  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    spinner.succeed('Database migrated successfully');
  } catch (error) {
    spinner.fail('Failed to migrate database');
    console.error(error);
  }
}
