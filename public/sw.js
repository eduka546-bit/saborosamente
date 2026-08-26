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

// Recebe Web Push do servidor (funciona com o app fechado) e mostra a notificação.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Saborosamente", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Saborosamente";
  const options = {
    body: payload.body || "",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: payload.tag || "saborosamente",
    requireInteraction: payload.requireInteraction ?? true,
    data: { url: payload.url || "/admin/pedidos" },
    // Vibração no celular (Android)
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ao clicar numa notificação do sistema, foca/abre a rota indicada no payload.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || "/admin/pedidos";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const jaAberto = clientsArr.find((c) => c.url.includes("/admin"));
      if (jaAberto) {
        jaAberto.focus();
        if ("navigate" in jaAberto) jaAberto.navigate(destino).catch(() => {});
        return;
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    }),
  );
});
