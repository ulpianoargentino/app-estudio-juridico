import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as caseService from "@/services/case.service";
import type {
  Case,
  CaseCreateInput,
  CaseUpdateInput,
  CaseListItem,
  CaseDetail,
  SubCaseCreateInput,
  SubCaseListItem,
  SubCaseType,
  SubCaseNextNumberResponse,
} from "@shared";

// Raíz común de todas las queries del dominio — permite invalidar con un solo
// prefijo todas las variantes (activos, archivados, detalle).
const casesRoot = ["cases"] as const;

const casesListKey = (isActive: boolean) => [...casesRoot, "list", { isActive }] as const;
const caseDetailKey = (id: string) => [...casesRoot, "detail", id] as const;
const subCasesKey = (parentId: string) => [...casesRoot, "subCases", parentId] as const;

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

// ───── Subexpedientes ─────

export function useSubCases(parentId: string | undefined) {
  return useQuery<SubCaseListItem[]>({
    queryKey: subCasesKey(parentId ?? ""),
    queryFn: () => caseService.listSubCases(parentId!),
    enabled: Boolean(parentId),
  });
}

export function useCreateSubCase(parentId: string) {
  const qc = useQueryClient();
  return useMutation<Case, Error, SubCaseCreateInput>({
    mutationFn: (input) => caseService.createSubCase(parentId, input),
    onSuccess: () => {
      // Invalida la lista de subs del padre, su detail (subCaseCount), y el
      // listado principal de cases (sufijo "(N subexpedientes)").
      qc.invalidateQueries({ queryKey: subCasesKey(parentId) });
      qc.invalidateQueries({ queryKey: caseDetailKey(parentId) });
      qc.invalidateQueries({ queryKey: casesRoot });
    },
  });
}

// Sugerencia del próximo número de sub. Solo dispara cuando hay tipo
// seleccionado — el placeholder del input depende del tipo elegido.
export function useNextSubCaseNumber(
  parentId: string | undefined,
  type: SubCaseType | "" | undefined
) {
  return useQuery<SubCaseNextNumberResponse>({
    queryKey: [...casesRoot, "subCases", parentId ?? "", "nextNumber", type ?? ""] as const,
    queryFn: () => caseService.getNextSubCaseNumber(parentId!, type as SubCaseType),
    enabled: Boolean(parentId) && Boolean(type),
  });
}
