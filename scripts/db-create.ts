import chalk from 'chalk';
import { createTursoDb } from './common-functions/create-turso-db';
import ora from 'ora';

export default async function createDb() {
  const spinner = ora('Creating database...').start();
  const newDb = await createTursoDb();
  if ('failed' in newDb) {
    spinner.fail(chalk.red('Failed to create database'));
    return;
  }
  spinner.succeed(chalk.green('Database created successfully'));
  console.log(
    'Copy the following to your .env file. You likely need to migrate the database.',
  );
  console.log(chalk.green(`TURSO_DATABASE_URL=${newDb.url}`));
  console.log(chalk.green(`TURSO_AUTH_TOKEN=${newDb.token}`));
  console.log(
    chalk.yellow(
      '\n🚀 Remember to migrate your database after setting the environment variables!',
    ),
  );
  console.log('You can do this by running:');
  console.log(chalk.cyan('  bun run db:migrate'));
}
