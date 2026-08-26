// Service worker mínimo da Saborosamente Admin.
// Objetivo: tornar o site instalável como app (PWA) e tratar cliques em
// notificação. NÃO faz cache de páginas de propósito — o painel admin é
// dinâmico (SSR + dados em tempo real), então cachear quebraria o conteúdo.

self.addEventListener("install", (event) => {
  // Ativa a nova versão imediatamente, sem esperar abas antigas fecharem.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Assume o controle das páginas abertas assim que ativa.
  event.waitUntil(self.clients.claim());
});

// Passthrough de rede: sempre busca da rede. Sem cache offline por enquanto.
self.addEventListener("fetch", () => {
  // Intencionalmente vazio — deixa o navegador tratar as requisições
  // normalmente. Ter um handler de fetch registrado é o que torna o app
  // instalável em alguns navegadores.
});

// Ao clicar numa notificação do sistema, foca/abre o painel de pedidos.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const jaAberto = clientsArr.find((c) => c.url.includes("/admin"));
      if (jaAberto) return jaAberto.focus();
      if (self.clients.openWindow) return self.clients.openWindow("/admin/pedidos");
    }),
  );
});
