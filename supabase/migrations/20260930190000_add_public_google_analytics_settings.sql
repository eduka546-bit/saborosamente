create or replace function public.site_settings_publicos()
returns jsonb
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $$
  select jsonb_build_object(
    'announcement_text', s.announcement_text,
    'announcement_bg_color', s.announcement_bg_color,
    'announcement_text_color', s.announcement_text_color,
    'nav_bg_color', s.nav_bg_color,
    'nav_text_color', s.nav_text_color,
    'hero_image_url', s.hero_image_url,
    'profile_image_url', s.profile_image_url,
    'hero_features', s.hero_features,
    'promo_banners', s.promo_banners,
    'payment_methods', s.payment_methods,
    'card_flags', s.card_flags,
    'meal_flags', s.meal_flags,
    'logo_url', s.logo_url,
    'banner_url', s.banner_url,
    'banner_link', s.banner_link,
    'whatsapp', s.whatsapp,
    'instagram', s.instagram,
    'endereco', s.endereco,
    'maps_url', s.maps_url,
    'footer_logo_url', s.footer_logo_url,
    'footer_whatsapp', s.footer_whatsapp,
    'footer_instagram', s.footer_instagram,
    'footer_address_line1', s.footer_address_line1,
    'footer_address_line2', s.footer_address_line2,
    'footer_address_cep', s.footer_address_cep,
    'footer_maps_url', s.footer_maps_url,
    'footer_description', s.footer_description,
    'footer_credit', s.footer_credit,
    'exit_intent_discount', s.exit_intent_discount,
    'cashback_percentual', s.cashback_percentual,
    'cashback_validade_dias', s.cashback_validade_dias,
    'cashback_minimo_uso', s.cashback_minimo_uso,
    'cashback_limite_desconto_pct', s.cashback_limite_desconto_pct,
    'cashback_ativo', s.cashback_ativo,
    'contato_whatsapp', s.contato_whatsapp,
    'contato_instagram', s.contato_instagram,
    'contato_email', s.contato_email,
    'contato_whatsapp_humano', s.contato_whatsapp_humano,
    'popup_boas_vindas', s.popup_boas_vindas,
    'horarios_funcionamento', s.horarios_funcionamento,
    'avisos_informativos', s.avisos_informativos,
    'parametros_loja', jsonb_build_object(
      'precos_marmita', s.parametros_loja->'precos_marmita',
      'acrescimos', s.parametros_loja->'acrescimos',
      'entrega', s.parametros_loja->'entrega',
      'marmita_personalizada', s.parametros_loja->'marmita_personalizada',
      'google_analytics_ativo', coalesce(s.parametros_loja->'google_analytics_ativo', 'false'::jsonb),
      'google_analytics_id', coalesce(s.parametros_loja->'google_analytics_id', '""'::jsonb)
    )
  )
  from public.site_settings s
  limit 1;
$$;

revoke all on function public.site_settings_publicos() from public;
grant execute on function public.site_settings_publicos() to anon, authenticated, service_role;
