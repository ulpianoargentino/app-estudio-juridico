import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as firmService from "@/services/firm.service";

export function useFirm() {
  return useQuery({
    queryKey: ["firm"],
    queryFn: firmService.getFirm,
  });
}

export function useUpdateFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: firmService.updateFirm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firm"] }),
  });
}
