import type { PainRegion } from './planEngine';

// Dor por região (ADR 015; conteudo-volume-assistente-v2.md, seção 2). Lista conservadora do que mais exige a região;
// o app não trata nem diagnostica. Todos os números e escolhas: a verificar. Fica só em memória (dado de saúde).

/** IDs do catálogo a evitar quando a pessoa marca dor na região. IDs não listados continuam permitidos. */
export const PAIN_AVOID: Readonly<Record<PainRegion, readonly string[]>> = {
 ombro: ['supino', 'inclinado', 'press_a', 'press_b', 'pike', 'barra', 'cruc', 'lat_a', 'lat_b', 'lat_elastico', 'ytw', 'puxada', 'puxada_elastico', 'flexao_fechada', 'tri_b', 'prancha', 'joelhos', 'roll'],
 joelho: ['agach', 'leg', 'goblet', 'agach_livre', 'sentar_levantar', 'bulg', 'afundo', 'afundo_livre', 'salto_l', 'salto_b', 'nordic'],
 lombar: ['agach', 'stiff', 'stiff_uni', 'remada_a', 'remada_mochila', 'farmer', 'roll', 'med', 'joelhos', 'salto_l', 'salto_b'],
 punho_cotovelo: ['flexao', 'flexao_fechada', 'pike', 'rosca_a', 'rosca_b', 'rosca_elastico', 'tri_a', 'tri_b', 'barra', 'farmer', 'joelhos', 'roll'],
 quadril: ['bulg', 'afundo', 'afundo_livre', 'copen_l', 'copen_b', 'ponte_uni', 'stiff_uni', 'salto_l', 'salto_b']
};

export const PAIN_LABEL: Readonly<Record<PainRegion, string>> = { ombro: 'Ombro', joelho: 'Joelho', lombar: 'Lombar (parte de baixo das costas)', punho_cotovelo: 'Punho ou cotovelo', quadril: 'Quadril' };
/** Forma usada na frase "por causa da dor {regiao}". */
export const PAIN_PHRASE: Readonly<Record<PainRegion, string>> = { ombro: 'do ombro', joelho: 'do joelho', lombar: 'da lombar', punho_cotovelo: 'do punho ou cotovelo', quadril: 'do quadril' };

export const PAIN_TEXT = {
 title: 'Alguma região incomoda quando você treina?',
 help: 'Marque onde você sente dor ou desconforto ao treinar. O app troca os exercícios que mais exigem essa região. Você não precisa dizer a causa.',
 swapLine: 'Troquei {de} por {para}, por causa da dor {regiao}.',
 removedLine: 'Tirei {de} por causa da dor {regiao}. Não há troca segura com o seu equipamento.',
 safety: 'Dor forte ou que piora: pare e procure um fisioterapeuta ou médico.',
 footer: 'O app só evita os exercícios que mais exigem essa região. Ele não trata nem diagnostica, e não substitui um profissional.'
} as const;

/** Linha pronta para a revisão. `de`/`para` são os nomes dos exercícios; `para` null = sem troca possível. */
export function painLine(region: PainRegion, de: string, para: string | null): string {
 const t = para === null ? PAIN_TEXT.removedLine : PAIN_TEXT.swapLine;
 return t.replace('{de}', de).replace('{para}', para ?? '').replace('{regiao}', PAIN_PHRASE[region]);
}
