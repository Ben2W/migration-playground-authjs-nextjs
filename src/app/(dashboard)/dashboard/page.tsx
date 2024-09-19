import Link from 'next/link';
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from '@/components/ui/card';

import { Metadata } from 'next';
import { Counter } from '@/components/counter';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your tasks',
};

export default function Dashboard() {
  return (
    <div className='container mx-auto p-12'>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your dashboard</CardTitle>
          <CardDescription>
            This is where you can manage your account and access your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className='text-lg font-medium'>Counter</h3>
            <Counter />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
