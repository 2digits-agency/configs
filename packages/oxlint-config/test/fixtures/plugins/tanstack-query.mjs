import { useQuery } from '@tanstack/react-query';

export function useTodos() {
  const { data, ...rest } = useQuery({ queryKey: ['todos'], queryFn: () => fetch('/todos') });

  return [data, rest];
}
