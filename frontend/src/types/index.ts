// Re-export del API contract: todo lo que consume el frontend viene de shared/
// (Zod como source of truth). Preferimos importar desde "@shared" directamente;
// este archivo se mantiene sólo para código existente que apunta a "@/types".
export * from "@shared";
