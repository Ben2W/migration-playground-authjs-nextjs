'use client';

import { Button } from '@/components/ui/button';
import CopyableClipboard from '../copy-text';

export default function DownloadBatchCSV() {
  const handleDownload = () => {
    window.location.href = '/api/download-csv';
  };

  return (
    <div className='flex flex-col gap-4'>
      <Button onClick={handleDownload}>Download Batch CSV</Button>
      <div className='text-sm text-muted-foreground'>
        <p className='mb-2'>
          You can also execute the following command in Drizzle Studio:
        </p>
        <p className='mb-2'>
          (Note: Depending on how many users you have, it might crash your
          browser)
        </p>
        <CopyableClipboard
          textToCopy='select id as external_id from user;'
          isCode={true}
        />
      </div>
    </div>
  );
}
