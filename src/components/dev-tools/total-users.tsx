'use client';

import useTotalUsers from './useTotalUsers';

export default function TotalUsers({ className }: { className?: string }) {
  const { data: totalUsers, isLoading: isTotalUsersLoading } = useTotalUsers();
  if (isTotalUsersLoading) return <div>Getting total users...</div>;
  return <div className={className}>Total Users: {totalUsers}</div>;
}
