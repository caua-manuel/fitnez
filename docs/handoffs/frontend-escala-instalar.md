# Frontend: escala "como terminou", observações da aula e instalar na tela inicial

## 1. Escala
- Início: "(1 = leve, 5 = destruído)"; aria-labels "Nota 1 de 5, leve" e "Nota 5 de 5, destruído" (os demais não mudam).
- `TerceiraAula.tsx`, `SemanaFaixa.tsx`: já não citavam a escala ("destruído" está coerente). Nenhuma regra alterada.

## 2. Observações
- Não existia campo de observação na aula de jiu-jitsu. O "nota" do teste de desmarcar era a sensação (`feel`).
- Usei o campo opcional já previsto e validado `notes` do dia (`Record<string,string>`), chave `aula-bjj`. Sem mudança de esquema, de `src/domain/` nem de `src/data/`; backups antigos seguem válidos; entra no backup JSON. O CSV não exporta aulas (só cargas, medidas e dieta), então não muda.
- `src/features/inicio/ObservacaoAula.tsx`: rótulo "Observações (opcional)", placeholder discreto, limite de 300 caracteres (igual ao do exercício), grava ao sair do campo ou após 700 ms de pausa; vazio remove a chave. Desmarcar apaga `feel` e observação; Desfazer devolve ambos.
- Treino de musculação: já tem "Observação (opcional)" no exercício; nada criado.

## 3. Instalar na tela inicial
- `src/pwa/install.ts`: funções puras (`isIos`, `isIosSafari`, `isStandalone`, `installMode`) e guarda do `beforeinstallprompt` (ouvinte no carregamento do módulo, para não perder o evento) com `useInstall`.
- `src/features/perfil/InstalarApp.tsx`: botão secundário em Perfil > Dados neste aparelho > "Instalar e usar offline"; atalho discreto (texto) no Início, só se não instalado. Com evento: `prompt()` e aviso ("Instalando o app" / "Instalação cancelada…"). iPhone/iPad: folha com 3 passos e ícones Phosphor (Export, PlusSquare, Check); em outro navegador do iOS, aviso para abrir no Safari. Demais: instruções genéricas. Instalado: no Perfil só "App instalado".
- Ícones novos em `src/ui/icons.tsx` (importados individualmente). CSS em `perfil.css` e `inicio.css`.

## Testes
- `tests/unit/install.test.ts` (9) e `tests/e2e/escala-instalar.spec.ts` (11).

## Sem verificar
Instalação real em Android e iPhone físicos; leitor de tela.
