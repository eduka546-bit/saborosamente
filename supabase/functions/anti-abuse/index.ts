// Anti-abuse: rate limit para storage público
// Bloqueia requisições excessivas de bots

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RATE_LIMIT_REQUESTS = 100; // requisições por IP
const RATE_LIMIT_WINDOW = 3600; // janela de 1 hora em segundos
const requestCounts = new Map<string, { count: number; resetTime: number }>();

serve(async (req) => {
  // Pegar IP do cliente
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  
  const now = Math.floor(Date.now() / 1000);
  let data = requestCounts.get(ip);

  // Resetar se a janela expirou
  if (!data || data.resetTime < now) {
    data = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    requestCounts.set(ip, data);
  }

  data.count++;

  // Se ultrapassou limite, bloqueia
  if (data.count > RATE_LIMIT_REQUESTS) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Bloquear User-Agents suspeitos
  const userAgent = req.headers.get("user-agent") || "";
  const botPatterns = [
    "bot", "crawler", "spider", "scraper", "curl", "wget", "python",
    "java(?!script)", "ruby", "perl", "php"
  ];
  
  const isBot = botPatterns.some(pattern => 
    new RegExp(pattern, "i").test(userAgent)
  );

  if (isBot) {
    console.warn(`Blocked bot from ${ip}: ${userAgent}`);
    return new Response(JSON.stringify({ error: "Bot access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Se passou nas verificações, permite
  return new Response(JSON.stringify({ 
    status: "ok",
    requests_remaining: RATE_LIMIT_REQUESTS - data.count,
    reset_time: data.resetTime
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
