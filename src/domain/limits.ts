import { PROFILE_GOAL_MAX, PROFILE_NAME_MAX } from './profile';

// Limites aplicados na validação de backup e de estado (src/data/validation.ts). Nenhum uso real chega perto:
// os tetos de texto são pelo menos o dobro do maxLength da interface (o protótipo antigo não tinha limite, então
// backups v1/v2 precisam de folga) e os de quantidade valem décadas de uso. Quem passa do teto é rejeitado com
// mensagem; nada é truncado em silêncio. A justificativa de cada número está em docs/handoffs/dados-validacao-importacao.md.
export const LIMITS = {
 // Textos (em caracteres)
 profileName: PROFILE_NAME_MAX, // 60, igual ao formulário do perfil
 profileGoal: PROFILE_GOAL_MAX, // 140, igual ao formulário do perfil
 id: 200, // ids, chaves e rótulos curtos
 name: 200, // nomes de treino, exercício, opção e receita (interface: NAME_MAX = 120)
 sub: 320, // descrição do treino (interface: 160)
 min: 40, // duração do treino (interface: 20)
 exerciseNote: 600, // observação do exercício (interface: 300)
 dayNote: 2000, // nota do dia / observação da aula (interface: 300)
 sportLabel: 60, // nome do esporte na rotina (interface: SPORT_LABEL_MAX = 30)
 value: 100, // carga, repetições, tempo, medidas, escolha de opção (interface: 30)
 line: 1000, // ingrediente, passo de receita, item de cardápio, item do condomínio
 recipeText: 2000, // tipo, uso e dica da receita
 // Quantidades
 days: 20000, measurements: 20000, // cerca de 55 anos de dias
 exercises: 1000, sessions: 500, order: 1000, sessionExercises: 200, planList: 200, seriesColumns: 20,
 exercisesPerDay: 500, rowsPerExercise: 200, perDayEntries: 500, workoutsPerDay: 100,
 meals: 50, optionsPerMeal: 1000, optionItems: 200, recipes: 1000, recipeLines: 200,
 sleepWeeks: 520, snapshots: 200, recovery: 400,
 snapshotChars: 1024 * 1024, // 1 MiB serializado por snapshot
} as const;
