import GenerateLoginUser from './generate-login-user';
import GenerateUsers from './generate-users';
import DevToolsLinks from './links';
import { Separator } from '@/components/ui/separator';
import SimulateActiveUsers from './simulate-active-users';
export default function DevTools() {
  return (
    <div className='p-4'>
      Note: Delete your .env to trigger the setup cli.
      <div className='mb-4 text-lg font-bold'>Dev Tools</div>
      <DevToolsLinks />
      <Separator className='my-4' />
      <GenerateUsers />
      <Separator className='my-4' />
      <GenerateLoginUser />
      <Separator className='my-4' />
      <SimulateActiveUsers />
    </div>
  );
}
