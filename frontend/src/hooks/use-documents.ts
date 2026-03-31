import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as documentService from "@/services/document.service";
import type { DocumentFilters } from "@/services/document.service";

export function useDocuments(filters: DocumentFilters) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: () => documentService.getDocuments(filters),
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof documentService.createDocument>[0]) =>
      documentService.createDocument(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
