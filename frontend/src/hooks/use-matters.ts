import { useQuery } from "@tanstack/react-query";
import * as matterService from "@/services/matter.service";

export function useMatter(id: string | undefined) {
  return useQuery({
    queryKey: ["matters", id],
    queryFn: () => matterService.getMatter(id!),
    enabled: !!id,
  });
}
