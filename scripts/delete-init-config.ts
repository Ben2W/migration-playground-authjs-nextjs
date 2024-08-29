import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';

(async () => {
  const envPath = path.resolve(process.cwd(), '.env');
  const dbPath = path.resolve(process.cwd(), 'dev.db');

  const envSpinner = ora('Deleting .env file').start();
  try {
    await fs.unlink(envPath);
    envSpinner.succeed('.env file deleted successfully.');
  } catch (error) {
    envSpinner.fail(`Error deleting .env file: ${error}`);
  }

  const dbSpinner = ora('Deleting dev.db file').start();
  try {
    await fs.unlink(dbPath);
    dbSpinner.succeed('dev.db file deleted successfully.');
  } catch (error) {
    dbSpinner.fail(`Error deleting dev.db file: ${error}`);
  }
})();
