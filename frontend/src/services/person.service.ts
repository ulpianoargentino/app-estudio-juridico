import { apiClient } from "./api";
import type { Person, PersonCreateInput, PersonUpdateInput } from "@shared";

// El interceptor de `api.ts` desenvuelve el envelope `{ data: T }` del backend,
// así que `res.data` ya es el tipo de negocio directo. Para el listado, el
// backend devuelve `{ data: Person[], meta: ... }` y el interceptor lo reduce
// al array. La paginación llega en tarea C.2.

export async function listPersons(): Promise<Person[]> {
  const res = await apiClient.get<Person[]>("/persons");
  return res.data;
}

export async function getPerson(id: string): Promise<Person> {
  const res = await apiClient.get<Person>(`/persons/${id}`);
  return res.data;
}

export async function createPerson(input: PersonCreateInput): Promise<Person> {
  const res = await apiClient.post<Person>("/persons", input);
  return res.data;
}

export async function updatePerson(
  id: string,
  input: PersonUpdateInput
): Promise<Person> {
  const res = await apiClient.put<Person>(`/persons/${id}`, input);
  return res.data;
}

export async function deletePerson(id: string): Promise<void> {
  await apiClient.delete(`/persons/${id}`);
}
