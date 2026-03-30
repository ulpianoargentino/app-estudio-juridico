// AI service abstraction layer.
// All AI calls go through this service — the rest of the app NEVER calls the
// Anthropic API directly.

export class AIService {
  // Genera borrador de escrito judicial a partir de datos del expediente y plantilla
  async generateFiling(
    caseData: unknown,
    templateId: string,
    filingType: string
  ): Promise<string> {
    throw new Error("AIService.generateFiling not implemented");
  }

  // Analiza un documento subido
  async analyzeDocument(documentId: string): Promise<unknown> {
    throw new Error("AIService.analyzeDocument not implemented");
  }

  // Búsqueda semántica de jurisprudencia relevante
  async searchJurisprudence(query: string): Promise<unknown[]> {
    throw new Error("AIService.searchJurisprudence not implemented");
  }

  // Sugiere acciones procesales según el estado del expediente
  async suggestNextSteps(caseId: string): Promise<unknown[]> {
    throw new Error("AIService.suggestNextSteps not implemented");
  }

  // Detecta riesgo de caducidad/prescripción
  async alertExpiration(caseId: string): Promise<unknown> {
    throw new Error("AIService.alertExpiration not implemented");
  }

  // Chat libre con contexto del expediente
  async contextualChat(
    caseId: string,
    message: string
  ): Promise<string> {
    throw new Error("AIService.contextualChat not implemented");
  }
}

export const aiService = new AIService();
