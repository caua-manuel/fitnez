# Relatório do Codex — 25/11/2026

Sessão de 19h50 a 19h59, horário de São Paulo. Ao iniciar, `main` apontava para `56d23ca`, com a integração da tarefa A já commitada. A tag `ponto-seguro-antes-codex-5h` guarda esse ponto. Os novos commits ficaram em `codex/ilustracoes-e-galeria`.

| Tarefa | Status | Commit | Resultado e pendências |
| --- | --- | --- | --- |
| A · Ilustrações | Feito | `56d23ca`, `97e830e` | Check verde e 7 testes de navegador passando. Seis capturas em `docs/ilustracoes/capturas/`. Tag `codex-a-ok`. |
| B · Galeria | Feito | `ba3d291` | 54 GIFs para 57 IDs na galeria. Sem GIF para `rosca_elastico` e `lat_elastico`. Tag `codex-b-ok`. |
| 5.1 · ADR e guia | Feito | `a2fbd01` | ADR 016 e roteiro no guia. Número 017 reservado. |
| 5.2 · Guia ↔ plano | Feito | `589b95d` | Os 59 IDs têm passos e erro comum. O teste anterior conferia a existência do item no guia. O novo também exige conteúdo nos dois campos. |
| 5.3 · Backup | Feito | Testes existentes | A ida e volta preserva perfil, notificações, histórico e catálogo. JSON inválido e versão futura são recusados sem alterar o estado atual. |
| 5.4 · Acessibilidade | Feito no Chromium | Conferência | Os itens conferidos passaram em 390 × 844 nos dois temas. Falta ouvir o anúncio no VoiceOver e conferir em iPhone físico. |
| 5.5 · Auditoria | Feito | Neste relatório | O motor e as regras de dor estão no JS inicial. Detalhes abaixo. |
| 5.6 · Fechamento | Feito | Neste relatório | Check final verde. Tag `codex-extras-ok`. |

O tempo anterior de A não tinha registro de início. Usei como referência o commit anterior a A, às 16h44. Até B verde, o intervalo foi de cerca de 3h10.

## Ilustrações e galeria

- JS inicial passou de 194,1 KB (referência do handoff) para 194,0 KB em gzip. O precache tem 1.155.281 bytes e 60 URLs. Os WebP ficam fora dele.
- O texto do README passou de 8.013 para 15.363 bytes. Os cinco GIFs de tela passaram de 5.896.317 para 2.997.888 bytes. Com a galeria de 309.332 bytes, os GIFs distintos referenciados somam 3.307.220 bytes. Os originais ainda estão em `docs/gifs/` e podem ser removidos depois de uma revisão.
- Para sinalizar texto muito curto, usei menos de 20 caracteres após aparar espaços, só no relatório. Nenhum ID atingiu esse corte. Os campos mais curtos têm 119 caracteres nos passos e 25 no erro comum.
- Backup conferido em `tests/integration/validation-import.test.ts`, `tests/integration/repository.test.ts` e `tests/e2e/fase1.spec.ts`.

## Acessibilidade da folha

No detalhe e na execução, o foco foi para **Fechar** ao abrir e voltou ao nome do exercício ao fechar por Esc ou pelo botão. Tab alcançou a pausa. Espaço pausou e Enter retomou. A árvore de acessibilidade expôs o diálogo com o nome **Como fazer**.

O nome do exercício mediu 44 px de altura no detalhe e 48 px na execução. **Fechar** mediu 48 px de altura e a área clicável de pausa mediu 256 × 256 px. O contraste mínimo medido do texto foi 18,86:1 no tema claro e 15,68:1 no escuro. Nenhuma edição na folha foi necessária.

## Auditoria de leitura

**Motor e dores na carga inicial.** `src/data/validation.ts:6` importa `domain/onboarding`, que importa `painRules` e `planEngine` nas linhas 10 e 11. Para reproduzir, rode `npm.cmd run build` e procure por `punho_cotovelo` e pelos padrões de equipamento e volume de `planEngine` em `dist/assets/index-*.js`. As listas de dor e as tabelas do motor estão ali. O check também emite o aviso do Vite sobre o chunk principal ultrapassar 500 kB após minificação. O orçamento em gzip passa.

**.roast/** contém só `last-audit.json`, um registro local de auditoria com versão, horários, duração, resumo e resultados. Tem 1.112 bytes, aparece como pasta não rastreada e `git check-ignore` não indica regra aplicável.

**Commit `41d5fec`.** `git show 41d5fec --stat` confirma o rascunho e a fila sem trava. O commit mexeu em `src/app/commitQueue.ts` e `src/features/treino/Executar.tsx` e incluiu `rascunho.ts`, o teste unitário e o teste de navegador do rascunho.

**Maiores arquivos em `dist/`**, em bytes no disco:

| Arquivo | Bytes |
| --- | ---: |
| `assets/index-D1k7yyOh.js` | 501.598 |
| `assets/index-CE6kUjVQ.css` | 129.644 |
| `assets/icons-9z67FQLZ.js` | 110.115 |
| `img/exercise/cruc-2.webp` | 58.428 |
| `img/exercise/agach-1.webp` | 58.246 |

O total de JavaScript tem 38,1 KB de folga no limite de 300 KB em gzip. A carga inicial tem 11,0 KB de folga.

### JavaScript por chunk em gzip

| Chunk | Bytes | Chunk | Bytes |
| --- | ---: | --- | ---: |
| `index-D1k7yyOh` | 156.134 | `diet-DwzjSd8U` | 1.659 |
| `icons-9z67FQLZ` | 27.548 | `DataProvider-BHxrz5Sj` | 1.553 |
| `Assistente-Bzxw9miy` | 11.191 | `Biblioteca-DKxQJEwm` | 1.429 |
| `Evolucao-3k_0T6Yt` | 7.447 | `ComoFazer-S-wvWgKe` | 1.168 |
| `ResumoSemana-_EnKH8zr` | 6.313 | `calendar-CWHvB9wz` | 1.164 |
| `planShare-9xunzqsb` | 5.164 | `NovoTreino-DN_6u3nH` | 1.132 |
| `MetasSheet-CH3OYRuv` | 4.719 | `EditarExercicio-k6CHnJZh` | 1.075 |
| `exerciseNotes-fLWivaw9` | 4.515 | `setPlaceholder-V2b184Zm` | 927 |
| `Compartilhar-04De5xxb` | 4.005 | `weekStreak-a9mzU2_q` | 904 |
| `dayActivity-D7VcaPSe` | 3.800 | `UndoToast-CSp9Ymge` | 708 |
| `mealPlan-DdICJJ5d` | 3.114 | `progression-BMwBsPP3` | 675 |
| `foods-bbTWSXkp` | 3.011 | `PlanResumo-Dv-imJ8l` | 505 |
| `Campos-qCejQvNb` | 2.738 | `templates-DQToLc4b` | 436 |
| `Sheet-BBTpFr_6` | 2.717 | `muscleGroups-CajJuQ_u` | 423 |
| `EditarTreino-Da_xAPVH` | 2.629 | `mode-DehUAL39` | 337 |
| `ExercicioPagina-BAxyp45y` | 2.453 | `foods-DTC9130L` | 263 |
| `generate-B65N-MCD` | 2.143 | `exerciseImages-B-zFZwm-` | 249 |
| `evolucao-BTwKVO0d` | 2.108 | `repository-Cl7Ovm72` | 118 |
| `generatedDiet-BONYRkl_` | 1.694 | | |

### Dez maiores suspeitos de export sem uso no app

Triagem por tamanho da declaração e ocorrências do identificador no código do app e nas configurações do Vite e do Playwright. Alguns podem ter uso em testes.

| Export | Local |
| --- | --- |
| `checkFoodData` | `src/domain/mealPlan.ts:276` |
| `palette` | `src/ui/tokens.ts:7` |
| `MealIllustration` | `src/ui/illustrations.tsx:859` |
| `ExerciseIllustration` | `src/ui/illustrations.tsx:614` |
| `sessionGroups` | `src/features/treino/util.ts:92` |
| `painLine` | `src/domain/painRules.ts:29` |
| `weightDelta` | `src/domain/evolution.ts:103` |
| `previousSetAt` | `src/domain/setPlaceholder.ts:30` |
| `PAIN_LABEL` | `src/domain/painRules.ts:15` |
| `dayTypeOf` | `src/domain/dayActivity.ts:34` |

## Saída final

```text
ℹ tests 20
ℹ pass 20
 Test Files  60 passed (60)
      Tests  1415 passed (1415)
Precache: 1155281 bytes em 60 URLs, sem os WebP dos exercícios.
Carga inicial (gzip): JavaScript 194,0 KB de 205 KB; CSS 22,9 KB de 26 KB.
Total (gzip): JavaScript 261,9 KB de 300 KB; CSS 28,9 KB de 32 KB.
Maior chunk sob demanda (gzip): JavaScript assets/Assistente-Bzxw9miy.js 10,9 KB de 20 KB; CSS assets/evolucao-DhYaMxkW.css 2,7 KB de 4 KB; 28 chunks.
Artefato verificado: base /Projeto-Treino/; 169 arquivos; 60 URLs de precache; CSP de produção.
```

`git diff --stat main...HEAD`, antes deste relatório: 181 arquivos alterados, 223 inserções e 3 remoções.

Para voltar à `main`, use `git switch main`. Para abrir o ponto de retorno, use `git switch --detach ponto-seguro-antes-codex-5h`. Para voltar à entrega, use `git switch codex/ilustracoes-e-galeria`.
