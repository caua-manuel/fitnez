# Handoff DevOps: orçamento de JS total 300 KB (23/11/2026)

- Decisão do dono: JS total gzip 250 -> 300 KB (margem para cardápio do ADR 013 e animações). Inicial 205 KB, CSS e chunks inalterados.
- Alterado: `scripts/build-budget.ts`, `scripts/build-budget.test.ts` (limite e teste do total com 6 chunks de 19 KB), ADR 006 (Vigente), ADR 011 (tabela), ADR 013 (Revisão), `docs/ESTUDO-DE-CASO.md`.
- README.md, INICIO.md e GUIA-DE-TESTE.md não citavam 250 KB.
- Medido (com src/ em andamento): total 254,3 KB de 300; inicial 189,1 KB de 205. test:config e build passam.
