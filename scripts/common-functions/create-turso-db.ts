import ora from 'ora';
import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { z } from 'zod';

const databaseSchema = z.object({
  name: z.string(),
  url: z.string(),
  token: z.string(),
});

const responseSchema = z.object({
  message: z.string(),
  database: databaseSchema,
});

type Response = z.infer<typeof databaseSchema>;

export async function createTursoDb(
  clerkSecret?: string,
  honoApiUrl?: string,
): Promise<Response | { failed: true }> {
  const clerkSecretKey = clerkSecret || process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error(
      chalk.red(
        'Could not find Clerk secret key. Please set the CLERK_SECRET_KEY environment variable.',
      ),
    );
    return { failed: true };
  }

  const api = honoApiUrl || process.env.NEXT_PUBLIC_HONO_API_URL;
  if (!api) {
    console.error(
      chalk.red(
        'Could not find Hono API URL. Please set the NEXT_PUBLIC_HONO_API_URL environment variable.',
      ),
    );
    return { failed: true };
  }

  const spinner = ora('Creating database...').start();

  try {
    const response = await fetch(`${api}/playground/create-empty-turso-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!response.ok) {
      spinner.fail(
        chalk.red(
          `HTTP error! status: ${response.status} - ${response.statusText}`,
        ),
      );
      console.log(await response.text());
      return { failed: true };
    }

    const data = responseSchema.parse(await response.json());

    spinner.succeed(chalk.green(data.message));

    console.log('\nHere are the following commands to manage your database:');
    console.log('bun db:create - Create a new database');
    console.log('bun db:push - Push schema changes to the database');
    console.log('bun db:generate - Generate migration files');
    console.log('bun db:studio - Open Drizzle Studio');
    console.log('bun db:migrate - Run database migrations');

    const { name, url, token } = data.database;

    return { name, url, token };
  } catch (error) {
    spinner.fail(chalk.red(`Unable to create database ${error}`));
    return { failed: true };
  }
}
