import { input, select } from '@inquirer/prompts';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import ora from 'ora';
import { migrate } from 'drizzle-orm/libsql/migrator';

const executeMigration = async () => {
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
  spinner.succeed('Migration successful');
};

executeMigration();
