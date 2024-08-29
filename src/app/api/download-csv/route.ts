import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { gt } from 'drizzle-orm';
import fs from 'fs';

async function generateBatchCSV() {
  await deleteBatchCSV();

  const filePath = path.join(process.cwd(), 'batch.csv');
  const writeStream = createWriteStream(filePath);
  const batchSize = 1000;
  let cursor: { id: string } | null = null;

  // Write CSV header
  writeStream.write('external_id\n');

  while (true) {
    const query = db
      .select({ id: users.id })
      .from(users)
      .orderBy(users.id)
      .limit(batchSize);

    if (cursor) {
      query.where(gt(users.id, cursor.id));
    }

    const batch = await query;

    if (batch.length === 0) {
      break;
    }

    const csvData = batch.map((user) => user.id).join('\n') + '\n';
    writeStream.write(csvData);

    cursor = batch[batch.length - 1];
  }

  // Return a promise that resolves when the stream is finished
  return new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log('CSV generation completed: batch.csv');
      resolve();
    });
    writeStream.on('error', reject);
    writeStream.end();
  });
}

export async function GET() {
  try {
    await generateBatchCSV();

    // Add a small delay to ensure file system sync
    await new Promise((resolve) => setTimeout(resolve, 100));

    const filePath = path.join(process.cwd(), 'batch.csv');
    const fileStats = await stat(filePath);

    const stream = createReadStream(filePath);

    const response = new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=batch.csv',
        'Content-Length': fileStats.size.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating or sending CSV:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

async function deleteBatchCSV() {
  const filePath = path.join(process.cwd(), 'batch.csv');
  try {
    await fs.promises.unlink(filePath);
    console.log('Existing batch.csv file deleted');
  } catch (error) {
    // If the file doesn't exist, ignore the error
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Error deleting existing batch.csv file:', error);
    }
  }
}
