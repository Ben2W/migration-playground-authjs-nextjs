import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

(async () => {
  const envPath = path.resolve(process.cwd(), '.env');

  const envSpinner = ora('Deleting .env file').start();
  try {
    await fs.unlink(envPath);
    envSpinner.succeed('.env file deleted successfully.');
  } catch (error) {
    envSpinner.fail(`Error deleting .env file: ${error}`);
  }

  if (process.env.TURSO_AUTH_TOKEN) {
    console.log(
      chalk.yellow(
        'This script does not delete the Turso remote database. Please delete it manually.',
      ),
    );
    return;
  }

  const dbPath = path.resolve(process.cwd(), 'dev.db');

  const dbSpinner = ora('Deleting dev.db file').start();
  try {
    await fs.unlink(dbPath);
    dbSpinner.succeed('dev.db file deleted successfully.');
  } catch (error) {
    dbSpinner.fail(`Error deleting dev.db file: ${error}`);
  }
})();
