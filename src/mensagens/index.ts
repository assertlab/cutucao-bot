import rawTemplates from "./templates.json";

export type CategoriaTemplate =
  | "lembrete"
  | "cobranca"
  | "resumo"
  | "boas-vindas"
  | "comando"
  | "erro";

export interface MensagemTemplate {
  categoria: CategoriaTemplate;
  descricao: string;
  texto: string;
}

export type Templates = Record<string, MensagemTemplate>;

const defaultTemplates = rawTemplates as unknown as Templates;

export class MensagemService {
  private readonly templates: Templates;

  constructor(customTemplates?: Templates) {
    this.templates = customTemplates ?? defaultTemplates;
  }

  get(id: string, placeholders?: Record<string, string>): string {
    const template = this.templates[id] as MensagemTemplate | undefined;
    if (!template) {
      throw new Error(
        `Template de mensagem não encontrado: "${id}". Verifique src/mensagens/templates.json.`,
      );
    }
    if (!placeholders) return template.texto;
    let texto = template.texto;
    for (const [key, value] of Object.entries(placeholders)) {
      texto = texto.replaceAll(`{{${key}}}`, value);
    }
    return texto;
  }

  getTemplate(id: string): MensagemTemplate | undefined {
    return this.templates[id] as MensagemTemplate | undefined;
  }

  listAll(): ReadonlyMap<string, MensagemTemplate> {
    return new Map(Object.entries(this.templates));
  }
}

export const mensagens = new MensagemService();
