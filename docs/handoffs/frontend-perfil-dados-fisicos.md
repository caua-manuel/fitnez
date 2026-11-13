# Frontend: Perfil, dados físicos

- Formulário "Dados físicos" no Perfil (nome, objetivo, idade, peso com vírgula decimal, altura): validação com `validateProfile`, erros por campo com a entrada preservada, gravação via `commit` em `settings.profile`, confirmação "Salvo" em `role=status`.
- Meta de proteína derivada ("Meta de proteína: N g por dia, 2,4 g por kg") exibida no formulário e na linha "Dados físicos" quando há peso.
- "Meu objetivo" e "Dados físicos" abrem o editor (foco no campo correspondente).
- Constância mostra "—" sem nenhum registro concluído; o percentual aparece quando há treino, atividade prevista cumprida ou refeição registrada.
- Aviso de saúde discreto no fim do Perfil.
- Arquivo pessoal gerado e conferido (importação em contexto limpo), fora do git.
- Testes: `tests/e2e/fase1.spec.ts` ganhou o caso de dados físicos, com valores sintéticos.
