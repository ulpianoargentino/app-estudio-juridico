import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as personService from "@/services/person.service";
import type { Person, PersonCreateInput, PersonUpdateInput } from "@shared";

// Query key compartido para todas las queries de personas. En tarea C.2 se
// sumarán params al key (filtros, página) — por ahora sólo el dominio.
const personsKey = ["persons"] as const;

export function usePersons() {
  return useQuery<Person[]>({
    queryKey: personsKey,
    queryFn: personService.listPersons,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation<Person, Error, PersonCreateInput>({
    mutationFn: (input) => personService.createPerson(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personsKey });
    },
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation<Person, Error, { id: string; input: PersonUpdateInput }>({
    mutationFn: ({ id, input }) => personService.updatePerson(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personsKey });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => personService.deletePerson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personsKey });
    },
  });
}
