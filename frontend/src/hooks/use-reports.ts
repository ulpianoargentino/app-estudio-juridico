import { useQuery } from "@tanstack/react-query";
import * as reportService from "@/services/report.service";
import type { CasesReportFilters, DeadlinesFilters, ErrandsFilters } from "@/services/report.service";

export function useCasesReport(filters: CasesReportFilters) {
  return useQuery({
    queryKey: ["reports", "cases", filters],
    queryFn: () => reportService.getCasesReport(filters),
  });
}

export function useDeadlinesReport(filters: DeadlinesFilters) {
  return useQuery({
    queryKey: ["reports", "deadlines", filters],
    queryFn: () => reportService.getDeadlinesReport(filters),
  });
}

export function useErrandsReport(filters: ErrandsFilters) {
  return useQuery({
    queryKey: ["reports", "errands", filters],
    queryFn: () => reportService.getErrandsReport(filters),
  });
}
