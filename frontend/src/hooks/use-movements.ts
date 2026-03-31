import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as movementService from "@/services/movement.service";
import type { MovementFilters, CreateMovementPayload } from "@/services/movement.service";

export function useMovements(caseId: string | undefined, filters: MovementFilters = {}) {
  return useQuery({
    queryKey: ["movements", caseId, filters],
    queryFn: () => movementService.getMovements(caseId!, filters),
    enabled: !!caseId,
  });
}

export function useCreateMovement(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, file }: { data: CreateMovementPayload; file?: File }) =>
      movementService.createMovement(caseId, data, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements", caseId] });
    },
  });
}

export function useUpdateMovement(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMovementPayload> }) =>
      movementService.updateMovement(caseId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements", caseId] });
    },
  });
}

export function useDeleteMovement(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (movementId: string) => movementService.deleteMovement(caseId, movementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements", caseId] });
    },
  });
}
