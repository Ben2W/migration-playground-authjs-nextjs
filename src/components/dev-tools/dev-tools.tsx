import GenerateLoginUser from './generate-login-user';
import GenerateUsers from './generate-users';
import DevToolsLinks from './links';
import SimulateActiveUsers from './simulate-active-users';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import CopyableClipboard from '../copy-text';
import TotalUsers from './total-users';
import DeleteAllUsers from './delete-all-users';
import DownloadBatchCSV from './download-batch-csv';

export default function DevTools() {
  return (
    <div className='p-4'>
      <div className='mb-4 flex items-center justify-between text-lg'>
        <span className='font-bold'>Dev Tools</span>
        {process.env.NEXT_PUBLIC_CLERK_INSTANCE_ID && (
          <span className='ml-2'>
            <CopyableClipboard
              textToCopy={process.env.NEXT_PUBLIC_CLERK_INSTANCE_ID}
            />
          </span>
        )}
      </div>
      <DevToolsLinks />
      <TotalUsers className='my-4' />
      <Accordion type='multiple' className='w-full'>
        {process.env.NEXT_PUBLIC_TUNNEL_URL && (
          <AccordionItem value='view-local-tunnel-info'>
            <AccordionTrigger>View Local Tunnel Info</AccordionTrigger>
            <AccordionContent>
              <CopyableClipboard
                textToCopy={process.env.NEXT_PUBLIC_TUNNEL_URL}
              />
            </AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem value='generate-users'>
          <AccordionTrigger>Generate Users</AccordionTrigger>
          <AccordionContent>
            <GenerateUsers />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='generate-login-user'>
          <AccordionTrigger>Generate Login User</AccordionTrigger>
          <AccordionContent>
            <GenerateLoginUser />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='delete-all-users'>
          <AccordionTrigger>Delete All Users</AccordionTrigger>
          <AccordionContent>
            <DeleteAllUsers />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='simulate-active-users'>
          <AccordionTrigger>Simulate Active Users</AccordionTrigger>
          <AccordionContent>
            <SimulateActiveUsers />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='restart-initialization'>
          <AccordionTrigger>Restart Initialization</AccordionTrigger>
          <AccordionContent>
            <div className='text-sm text-muted-foreground'>
              To restart the initialization step run{' '}
              <CopyableClipboard textToCopy='pnpm delete-init-config && pnpm dev' />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='download-batch-csv'>
          <AccordionTrigger>Download Batch CSV</AccordionTrigger>
          <AccordionContent>
            <DownloadBatchCSV />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
