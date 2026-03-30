import { apiClient } from "./api";

export interface Person {
  id: string;
  firmId: string;
  personType: string;
  firstName: string;
  lastName: string;
  businessName: string | null;
  cuitCuil: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  legalAddress: string | null;
  appointedAddress: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonDetail extends Person {
  parties: Array<{
    id: string;
    role: string;
    caseId: string | null;
    matterId: string | null;
    caseTitle: string | null;
    caseNumber: string | null;
    matterTitle: string | null;
  }>;
}

export interface PersonFilters {
  page?: number;
  limit?: number;
  search?: string;
  personType?: string;
  sort?: string;
  order?: string;
}

export interface PaginatedResponse {
  data: Person[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getPersons(filters: PersonFilters = {}): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.personType) params.set("personType", filters.personType);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/persons?${params.toString()}`);
  return res.data as PaginatedResponse;
}

export async function getPerson(id: string): Promise<PersonDetail> {
  const res = await apiClient.get(`/persons/${id}`);
  return res.data as PersonDetail;
}

export async function createPerson(data: Record<string, unknown>): Promise<Person> {
  const res = await apiClient.post("/persons", data);
  return res.data as Person;
}

export async function updatePerson(id: string, data: Record<string, unknown>): Promise<Person> {
  const res = await apiClient.put(`/persons/${id}`, data);
  return res.data as Person;
}

export async function deletePerson(id: string): Promise<void> {
  await apiClient.delete(`/persons/${id}`);
}
