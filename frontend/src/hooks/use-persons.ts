import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as personService from "@/services/person.service";
import type { PersonFilters } from "@/services/person.service";

export function usePersons(filters: PersonFilters) {
  return useQuery({
    queryKey: ["persons", filters],
    queryFn: () => personService.getPersons(filters),
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: ["persons", id],
    queryFn: () => personService.getPerson(id!),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => personService.createPerson(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["persons"] }); },
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      personService.updatePerson(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["persons"] });
      qc.invalidateQueries({ queryKey: ["persons", variables.id] });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personService.deletePerson(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["persons"] }); },
  });
}
