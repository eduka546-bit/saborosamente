from pathlib import Path

# whatsapp-notify
p = Path('supabase/functions/whatsapp-notify/index.ts')
s = p.read_text()
old = '''const DEFAULT_MENSAGENS: Record<string, string> = {
  novo_pedido:
    "🍱 Olá, *{nome}*! Recebemos seu pedido *#{protocolo}* com sucesso!\\n\\nAssim que começarmos a preparar, você recebe uma mensagem aqui 😊\\n\\nAcompanhe em: {link}",
  pagamento_confirmado:
    "✅ Pagamento confirmado, *{nome}*! Seu pedido *#{protocolo}* foi confirmado.\\n\\nEstamos preparando com carinho 🍱\\n\\nAcompanhe: {link}",
  preparando:
    "🔥 *{nome}*, seu pedido *#{protocolo}* está sendo preparado agora com carinho 👨‍🍳\\n\\nTempo estimado: 30-45 min\\n\\nAcompanhe: {link}",
  "saiu para entrega":
    "🚚 *{nome}*, seu pedido *#{protocolo}* saiu para entrega agora! 🏃‍♂️\\n\\nRastreie em tempo real: {link}",
  entregue:
    "🎉 Pedido *#{protocolo}* entregue, *{nome}*!\\n\\nEsperamos que aprecie bastante 😋\\n\\nResponda com uma nota de *1 a 5* ⭐ para nos ajudar a melhorar!\\n\\n_Sua opinião é muito importante para nós_ 🫶🏼",
  cancelado:
    "😔 Oi, *{nome}*. Infelizmente seu pedido *#{protocolo}* foi cancelado.\\n\\nEntraremos em contato para explicar. Dúvidas? Responda esta mensagem 💬",
};'''
new = '''const DEFAULT_MENSAGENS: Record<string, string> = {
  novo_pedido:
    "🍱 Oii, *{nome}*! Recebemos seu pedido *#{protocolo}* com sucesso. Assim que ele for confirmado, avisamos por aqui 😊",
  pendente:
    "✅ Oii, *{nome}*! Seu pedido *#{protocolo}* foi recebido e confirmado com sucesso.\\n\\nSaborosaMente 🍱",
  pagamento_confirmado:
    "✅ Oii, *{nome}*! Seu pedido *#{protocolo}* foi recebido e confirmado com sucesso.\\n\\nSaborosaMente 🍱",
  preparando:
    "🍳 *{nome}*, seu pedido *#{protocolo}* está em preparação.\\n\\nSaborosaMente 🍱",
  "saiu para entrega":
    "🚚 Oii, *{nome}*! Seu pedido *#{protocolo}* saiu para entrega e já está a caminho.\\n\\nSaborosaMente 🍱",
  "pronto para retirada":
    "🛍️ Oii, *{nome}*! Seu pedido *#{protocolo}* já está pronto para retirada na loja.\\n\\nSaborosaMente 🍱",
  entregue:
    "Oii, *{nome}*! 😊 Seu pedido *#{protocolo}* foi finalizado.\\n\\nQueremos muito saber como foi sua experiência com a SaborosaMente 💚\\nSe puder, conta pra gente por aqui mesmo o que achou do pedido, dos pratos e do atendimento.\\n\\nSeu feedback ajuda bastante a gente a melhorar cada vez mais. 🫶🏼\\n\\nSaborosaMente 🍱",
  cancelado:
    "Oi, *{nome}*. Seu pedido *#{protocolo}* foi cancelado. Se precisar de ajuda, responda esta mensagem e nossa equipe verifica para você.",
};'''
if old not in s:
    raise SystemExit('DEFAULT_MENSAGENS nao encontrado')
s = s.replace(old, new, 1)
old = '''    const mensagemObj = mensagemStatus(status_novo, pedido, isRecorrente, templates);
    if (!mensagemObj) {'''
new = '''    const metodoEntrega = String(pedido.metodo_entrega ?? "").toLowerCase();
    const statusMensagem =
      status_novo === "saiu para entrega" && metodoEntrega === "retirada"
        ? "pronto para retirada"
        : status_novo;

    const mensagemObj = mensagemStatus(statusMensagem, pedido, isRecorrente, templates);
    if (!mensagemObj) {'''
if old not in s:
    raise SystemExit('mensagemStatus call nao encontrada')
s = s.replace(old, new, 1)
s = s.replace('''      status: status_novo,\n    });''', '''      status: statusMensagem,\n    });''', 1)
s = s.replace('''    claimedStatus = status_novo;''', '''    claimedStatus = statusMensagem;''', 1)
s = s.replace('''    console.log(`Notificação WhatsApp enviada: ${status_novo}`);''', '''    console.log(`Notificação WhatsApp enviada: ${statusMensagem}`);''', 1)
s = s.replace('''        status: status_novo,''', '''        status: statusMensagem,''', 1)
p.write_text(s)

# admin pedidos
p = Path('src/routes/admin.pedidos.tsx')
s = p.read_text()
old = '''      const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
      if (error) throw error;
'''
new = '''      const { data: pedidoAtual, error: pedidoAtualError } = await supabase
        .from("pedidos")
        .select("metodo_entrega")
        .eq("id", id)
        .maybeSingle();
      if (pedidoAtualError) throw pedidoAtualError;

      const statusEfetivo =
        status === "saiu para entrega" && String(pedidoAtual?.metodo_entrega ?? "").toLowerCase() === "retirada"
          ? "pronto para retirada"
          : status;

      const { error } = await supabase.from("pedidos").update({ status: statusEfetivo }).eq("id", id);
      if (error) throw error;
'''
if old not in s:
    raise SystemExit('update status nao encontrado')
s = s.replace(old, new, 1)
s = s.replace('''      if (status === "entregue") {''', '''      if (statusEfetivo === "entregue") {''', 1)
s = s.replace('''            status_novo: status,''', '''            status_novo: statusEfetivo,''', 1)
s = s.replace('''    { label: "saiu para entrega", icon: MapPin, color: "text-purple-500" },
    { label: "entregue", icon: CheckCircle2, color: "text-green-500" },''', '''    { label: "saiu para entrega", icon: MapPin, color: "text-purple-500" },
    { label: "pronto para retirada", icon: Package, color: "text-purple-500" },
    { label: "entregue", icon: CheckCircle2, color: "text-green-500" },''', 1)
s = s.replace('''    "saiu para entrega": "bg-purple-50 text-purple-600 border-purple-200",
    entregue: "bg-green-50 text-green-600 border-green-200",''', '''    "saiu para entrega": "bg-purple-50 text-purple-600 border-purple-200",
    "pronto para retirada": "bg-purple-50 text-purple-600 border-purple-200",
    entregue: "bg-green-50 text-green-600 border-green-200",''', 1)
p.write_text(s)

# whatsapp-agent feedback escrito
p = Path('supabase/functions/whatsapp-agent/index.ts')
s = p.read_text()
old = '''          if (notaMatch) {
            const nota = parseInt(notaMatch[0]);
            const pedidoId = conversa.aguardando_avaliacao;

            await supabase.from("avaliacoes").insert({
              pedido_id: pedidoId,
              telefone,
              nota,
              comentario: null,
            });

            await supabase
              .from("whatsapp_conversas")
              .update({ aguardando_avaliacao: null })
              .eq("id", conversa.id);

            const msgs = [
              "",
              "Ih, precisa melhorar 😔",
              "Vamos nos esforçar mais! 🙏",
              "Obrigado pelo feedback 😊",
              "Que ótimo! Ficamos felizes 😄",
              "Perfeito! Que alegria! 🎉",
            ];
            const agradecimento = `${msgs[nota]} Obrigada pela avaliação, *${nota} estrela${nota > 1 ? "s" : ""}*! ⭐\\n\\nSe quiser comentar algo, pode escrever agora. Se não, é só me chamar quando precisar! 🫶🏼`;
            await sendWhatsAppMessage(telefone, agradecimento);
            await appendMensagem(conversa.id, historico, {
              role: "assistant",
              content: agradecimento,
            });
          } else {
            // Resposta conversacional: NÃO reexibir o menu (evita atrito de
            // grudar o menu no meio de uma conversa fluida).
            await sendWhatsAppMessage(telefone, resposta);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: resposta });
          }'''
new = '''          if (notaMatch) {
            const nota = parseInt(notaMatch[0]);
            const pedidoId = conversa.aguardando_avaliacao;

            await supabase.from("avaliacoes").insert({
              pedido_id: pedidoId,
              telefone,
              nota,
              comentario: null,
            });

            await supabase
              .from("whatsapp_conversas")
              .update({ aguardando_avaliacao: null })
              .eq("id", conversa.id);

            const agradecimento = `Muito obrigada pelo feedback! 💚 Sua opinião ajuda muito a SaborosaMente a melhorar cada vez mais. 🫶🏼`;
            await sendWhatsAppMessage(telefone, agradecimento);
            await appendMensagem(conversa.id, historico, {
              role: "assistant",
              content: agradecimento,
            });
          } else {
            const pedidoId = conversa.aguardando_avaliacao;
            const comentario = texto.trim();
            if (comentario) {
              await supabase.from("avaliacoes").insert({
                pedido_id: pedidoId,
                telefone,
                nota: null,
                comentario,
              });
              await supabase
                .from("whatsapp_conversas")
                .update({ aguardando_avaliacao: null })
                .eq("id", conversa.id);

              const agradecimento = "Muito obrigada por contar pra gente! 💚 Seu feedback foi registrado e ajuda muito a SaborosaMente a melhorar cada vez mais. 🫶🏼";
              await sendWhatsAppMessage(telefone, agradecimento);
              await appendMensagem(conversa.id, historico, { role: "assistant", content: agradecimento });
            }
          }'''
if old not in s:
    raise SystemExit('bloco avaliacao nao encontrado')
s = s.replace(old, new, 1)
p.write_text(s)
