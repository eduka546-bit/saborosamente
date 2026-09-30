update public.site_settings
set parametros_loja = jsonb_set(
  coalesce(parametros_loja, '{}'::jsonb),
  '{whatsapp_notificacoes,recuperacao_carrinho}',
  jsonb_build_object(
    'ativo', true,
    'texto', 'Oi {nome}! 💚 Seu pedido na SaborosaMente ainda está no carrinho, no valor de {valor}. Se quiser, finalize pelo botão abaixo. Se precisar de ajuda, é só responder esta mensagem.',
    'template_meta', 'recuperacao_carrinho_saborosamente',
    'template_aprovado', false,
    'atraso_minutos', 60
  ),
  true
);
