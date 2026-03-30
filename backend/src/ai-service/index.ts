// AI service abstraction layer.
// The rest of the application NEVER calls the Anthropic API directly.
// All AI interactions go through this service.

export class AIService {
  // Genera borrador de escrito judicial a partir de datos del expediente y plantilla
  async generateFiling(
    caseData: unknown,
    templateId: string,
    filingType: string
  ): Promise<string> {
    // TODO: Implement via Anthropic API
    throw new Error("Not implemented: generateFiling");
  }

  // Analiza un documento subido
  async analyzeDocument(documentContent: string): Promise<unknown> {
    // TODO: Implement via Anthropic API
    throw new Error("Not implemented: analyzeDocument");
  }

  // Búsqueda semántica de jurisprudencia relevante
  async searchJurisprudence(query: string): Promise<unknown[]> {
    // TODO: Implement via Anthropic API
    throw new Error("Not implemented: searchJurisprudence");
  }

  // Sugiere acciones procesales según el estado del expediente
  async suggestNextSteps(caseData: unknown): Promise<string[]> {
    // TODO: Implement via Anthropic API
    throw new Error("Not implemented: suggestNextSteps");
  }

  // Detecta riesgo de caducidad/prescripción
  async alertExpiration(caseData: unknown): Promise<unknown> {
    // TODO: Implement via Anthropic API
    throw new Error("Not implemented: alertExpiration");
  }

  // Chat libre con contexto del expediente
  async contextualChat(
    message: string,
    caseContext: unknown
  ): Promise<string> {
    // TODO: Implement via Anthropic API
    throw new Error("Not implemented: contextualChat");
  }
}

export const aiService = new AIService();
