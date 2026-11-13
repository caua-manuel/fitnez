# Handoff frontend, Entrega A, Tarefa 13 (notificações)

- Criado `src/pwa/notifications.ts` (`NotifySupport`, `notifySupport`, `enableNotifications`, `notifyRestEnd`) e `tests/unit/notifications.test.ts`.
- `notifyRestEnd` usa `registration.showNotification('Descanso terminado', { body: nome do exercício })`; no-op silencioso sem permissão ou sem service worker. Nenhum dado pessoal.
- `public/sw.js`: acrescentado `notificationclick` (foca a janela do app ou abre a URL da execução; só aceita URLs da própria origem e base). Precache e versionamento intactos.
- Pendente (Tarefa 14): interruptor "Notificações" no Perfil, com o texto do plano, chamando `enableNotifications`.
- Limitação: push agendado com o app fechado fica para a Entrega C (depende de serviço de envio aprovado pelo dono).
- Revisão pendente: `seguranca-privacidade`.
