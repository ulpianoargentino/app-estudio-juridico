import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as caseService from "@/services/case.service";
import type { CaseFilters } from "@/services/case.service";
import type { PartyRole } from "@/types";

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: ["cases", filters],
    queryFn: () => caseService.getCases(filters),
  });
}

export function useCase(id: string | undefined) {
  return useQuery({
    queryKey: ["cases", id],
    queryFn: () => caseService.getCase(id!),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => caseService.createCase(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cases"] }); },
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      caseService.updateCase(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["cases", variables.id] });
    },
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => caseService.deleteCase(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cases"] }); },
  });
}

export function useAddParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, personId, role }: { caseId: string; personId: string; role: PartyRole }) =>
      caseService.addParty(caseId, { personId, role }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["cases", variables.caseId] });
    },
  });
}

export function useRemoveParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, partyId }: { caseId: string; partyId: string }) =>
      caseService.removeParty(caseId, partyId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["cases", variables.caseId] });
    },
  });
}

export function useFirmUsers() {
  return useQuery({
    queryKey: ["firm-users"],
    queryFn: () => caseService.getFirmUsers(),
  });
}
