import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as portalService from "@/services/portal.service";

export function usePortalCredentials() {
  return useQuery({
    queryKey: ["portal-credentials"],
    queryFn: portalService.getCredentials,
  });
}

export function useCreateCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: portalService.createCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-credentials"] }),
  });
}

export function useUpdateCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { username?: string; password?: string } }) =>
      portalService.updateCredential(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-credentials"] }),
  });
}

export function useDeleteCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: portalService.deleteCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-credentials"] }),
  });
}

export function useSyncAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: portalService.syncAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-credentials"] }),
  });
}

export function useSyncOne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: portalService.syncOne,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-credentials"] }),
  });
}

export function useSyncLogs(credentialId?: string) {
  return useQuery({
    queryKey: ["sync-logs", credentialId],
    queryFn: () => portalService.getSyncLogs(credentialId),
  });
}
