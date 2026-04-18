import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as caseService from "@/services/case.service";
import type {
  Case,
  CaseCreateInput,
  CaseUpdateInput,
  CaseListItem,
  CaseDetail,
} from "@shared";

// Raíz común de todas las queries del dominio — permite invalidar con un solo
// prefijo todas las variantes (activos, archivados, detalle).
const casesRoot = ["cases"] as const;

const casesListKey = (isActive: boolean) => [...casesRoot, "list", { isActive }] as const;
const caseDetailKey = (id: string) => [...casesRoot, "detail", id] as const;

export function useCases(isActive: boolean = true) {
  return useQuery<CaseListItem[]>({
    queryKey: casesListKey(isActive),
    queryFn: () => caseService.listCases(isActive),
  });
}

export function useCase(id: string | undefined) {
  return useQuery<CaseDetail>({
    queryKey: caseDetailKey(id ?? ""),
    queryFn: () => caseService.getCase(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation<Case, Error, CaseCreateInput>({
    mutationFn: (input) => caseService.createCase(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: casesRoot });
    },
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation<Case, Error, { id: string; input: CaseUpdateInput }>({
    mutationFn: ({ id, input }) => caseService.updateCase(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: casesRoot });
      qc.invalidateQueries({ queryKey: caseDetailKey(id) });
    },
  });
}

export function useArchiveCase() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => caseService.archiveCase(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: casesRoot });
      qc.invalidateQueries({ queryKey: caseDetailKey(id) });
    },
  });
}

export function useUnarchiveCase() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => caseService.unarchiveCase(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: casesRoot });
      qc.invalidateQueries({ queryKey: caseDetailKey(id) });
    },
  });
}
