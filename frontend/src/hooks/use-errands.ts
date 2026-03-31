import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as errandService from "@/services/errand.service";
import type { ErrandFilters, CreateErrandPayload } from "@/services/errand.service";

export function useErrands(caseId: string | undefined, filters: ErrandFilters = {}) {
  return useQuery({
    queryKey: ["errands", caseId, filters],
    queryFn: () => errandService.getErrands(caseId!, filters),
    enabled: !!caseId,
  });
}

export function useCreateErrand(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateErrandPayload) => errandService.createErrand(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["errands", caseId] });
    },
  });
}

export function useUpdateErrand(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateErrandPayload> }) =>
      errandService.updateErrand(caseId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["errands", caseId] });
    },
  });
}

export function useMarkErrandCompleted(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (errandId: string) => errandService.markErrandCompleted(caseId, errandId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["errands", caseId] });
    },
  });
}

export function useDeleteErrand(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (errandId: string) => errandService.deleteErrand(caseId, errandId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["errands", caseId] });
    },
  });
}
