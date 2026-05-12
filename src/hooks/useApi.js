import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../helpers/api';

export const useFetch = (key, endpoint, options = {}) => {
  return useQuery({
    queryKey: key,
    queryFn: () => api.get(endpoint),
    ...options,
  });
};

export const usePost = (endpoint, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(endpoint, body),
    onSuccess: () => {
      if (options.invalidateKey) {
        queryClient.invalidateQueries({ queryKey: options.invalidateKey });
      }
    },
    ...options,
  });
};

export const usePut = (endpoint, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.put(endpoint, body),
    onSuccess: () => {
      if (options.invalidateKey) {
        queryClient.invalidateQueries({ queryKey: options.invalidateKey });
      }
    },
    ...options,
  });
};

export const useDelete = (endpoint, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(endpoint),
    onSuccess: () => {
      if (options.invalidateKey) {
        queryClient.invalidateQueries({ queryKey: options.invalidateKey });
      }
    },
    ...options,
  });
};
