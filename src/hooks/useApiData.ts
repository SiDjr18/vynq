import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useApiData<T>(path: string, deps: unknown[] = []) {
  const queryClient = useQueryClient();
  const queryKey = [path, ...deps];
  const query = useQuery({
    queryKey,
    queryFn: () => api<T>(path),
    staleTime: 30_000
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    setData: (value: T) => queryClient.setQueryData(queryKey, value)
  };
}
