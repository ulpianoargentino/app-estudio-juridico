import type { LLMTool } from "./llm-client";

export const searchCases: LLMTool = {
  name: "searchCases",
  description:
    "Busca expedientes judiciales del estudio por criterios de búsqueda. " +
    "Usala cuando el usuario pregunte por expedientes, causas, o necesites encontrar un expediente por nombre, número, estado o fuero.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Texto de búsqueda: nombre, número de expediente, o carátula",
      },
      status: {
        type: "string",
        description: "Filtrar por estado del expediente (ej: IN_PROGRESS, EVIDENCE_STAGE, ARCHIVED)",
        enum: [
          "INITIAL",
          "IN_PROGRESS",
          "EVIDENCE_STAGE",
          "CLOSING_ARGUMENTS",
          "AWAITING_JUDGMENT",
          "JUDGMENT_ISSUED",
          "IN_EXECUTION",
          "ARCHIVED",
          "SUSPENDED",
          "IN_MEDIATION",
        ],
      },
      jurisdictionType: {
        type: "string",
        description: "Filtrar por fuero (ej: CIVIL_COMMERCIAL, LABOR, CRIMINAL)",
        enum: [
          "CIVIL_COMMERCIAL",
          "LABOR",
          "CRIMINAL",
          "FAMILY",
          "ADMINISTRATIVE",
          "COLLECTIONS",
          "PROBATE",
          "EXTRAJUDICIAL",
        ],
      },
    },
    required: ["query"],
  },
};

export const getCaseDetail: LLMTool = {
  name: "getCaseDetail",
  description:
    "Obtiene el detalle completo de un expediente judicial, incluyendo partes, juzgado, " +
    "cantidad de movimientos, documentos y eventos próximos. Usala cuando necesites información " +
    "detallada de un expediente específico.",
  input_schema: {
    type: "object" as const,
    properties: {
      caseId: {
        type: "string",
        description: "ID del expediente",
      },
    },
    required: ["caseId"],
  },
};

export const listMovements: LLMTool = {
  name: "listMovements",
  description:
    "Lista los movimientos (actuaciones) de un expediente judicial en orden cronológico. " +
    "Usala cuando el usuario pregunte por las novedades, actuaciones o historial de un expediente.",
  input_schema: {
    type: "object" as const,
    properties: {
      caseId: {
        type: "string",
        description: "ID del expediente",
      },
      limit: {
        type: "number",
        description: "Cantidad máxima de movimientos a devolver (por defecto 20)",
      },
    },
    required: ["caseId"],
  },
};

export const queryCalendar: LLMTool = {
  name: "queryCalendar",
  description:
    "Consulta los eventos próximos del calendario (audiencias, vencimientos, reuniones, mediaciones). " +
    "Usala cuando el usuario pregunte por su agenda, fechas próximas, o vencimientos.",
  input_schema: {
    type: "object" as const,
    properties: {
      days: {
        type: "number",
        description: "Cantidad de días hacia adelante a consultar (por defecto 7)",
      },
      caseId: {
        type: "string",
        description: "Si se especifica, filtra eventos solo de este expediente",
      },
    },
    required: [],
  },
};

export const searchPerson: LLMTool = {
  name: "searchPerson",
  description:
    "Busca personas (físicas o jurídicas) en el directorio del estudio. " +
    "Usala cuando el usuario pregunte por un cliente, contraparte, perito, u otra persona vinculada.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Texto de búsqueda: nombre, apellido, razón social o CUIT/CUIL",
      },
    },
    required: ["query"],
  },
};

export const allTools: LLMTool[] = [
  searchCases,
  getCaseDetail,
  listMovements,
  queryCalendar,
  searchPerson,
];
