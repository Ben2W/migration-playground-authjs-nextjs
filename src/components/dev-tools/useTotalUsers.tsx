import { getTotalUsers } from '@/actions/dev-tools/get-total-users';
import { useQuery } from '@tanstack/react-query';

const fetchTotalUsers = async () => {
  return await getTotalUsers();
};

export default function useTotalUsers() {
  return useQuery({
    queryKey: ['totalUsers'],
    queryFn: fetchTotalUsers,
  });
}
