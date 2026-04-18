import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as courtService from "@/services/court.service";
import type { Court, CourtCreateInput } from "@shared";

const courtsKey = ["courts"] as const;

export function useCourts() {
  return useQuery<Court[]>({
    queryKey: courtsKey,
    queryFn: courtService.listCourts,
  });
}

export function useCreateCourt() {
  const qc = useQueryClient();
  return useMutation<Court, Error, CourtCreateInput>({
    mutationFn: (input) => courtService.createCourt(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courtsKey });
    },
  });
}
