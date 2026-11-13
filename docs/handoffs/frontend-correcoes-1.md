# Frontend: correções 1

- Aviso de backup: `hasUserData` e `shouldShowBackupReminder` (src/domain/userData.ts, testadas em tests/unit/userData.test.ts). Só aparece com dados (dias, medidas, catálogo editado com `catalog.revision > 0`, nome/objetivo) e `backupDue`. Usado em Início e Perfil; backup/importação intactos.
- Evolução: formulário "Registrar medidas" fechado por padrão (vazio e com dados), placeholders `0,0`, cabeçalho alinhado. O e2e agora clica em "Abrir".
- Perfil: números em coluna (ícone 30 px, número 2rem, rótulo 1rem); `—` mantido quando não há registros.
- Início: sem mudanças de espaçamento necessárias; o topo vazio ficou limpo sem o aviso.
