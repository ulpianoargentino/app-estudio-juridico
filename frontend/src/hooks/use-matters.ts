import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as matterService from "@/services/matter.service";
import type { MatterFilters } from "@/services/matter.service";

export function useMatters(filters: MatterFilters) {
  return useQuery({
    queryKey: ["matters", filters],
    queryFn: () => matterService.getMatters(filters),
  });
}

export function useMatter(id: string | undefined) {
  return useQuery({
    queryKey: ["matters", id],
    queryFn: () => matterService.getMatter(id!),
    enabled: !!id,
  });
}

export function useCreateMatter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => matterService.createMatter(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matters"] }); },
  });
}

export function useUpdateMatter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      matterService.updateMatter(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["matters"] });
      qc.invalidateQueries({ queryKey: ["matters", variables.id] });
    },
  });
}

export function useDeleteMatter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => matterService.deleteMatter(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matters"] }); },
  });
}

export function useConvertMatterToCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      matterService.convertMatterToCase(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["matters"] });
      qc.invalidateQueries({ queryKey: ["matters", variables.id] });
    },
  });
}
