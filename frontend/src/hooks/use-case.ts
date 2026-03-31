import { useQuery } from "@tanstack/react-query";
import * as caseService from "@/services/case.service";

export function useCase(id: string | undefined) {
  return useQuery({
    queryKey: ["cases", id],
    queryFn: () => caseService.getCase(id!),
    enabled: !!id,
  });
}

export function useFirmUsers() {
  return useQuery({
    queryKey: ["firm-users"],
    queryFn: () => caseService.getFirmUsers(),
  });
}
