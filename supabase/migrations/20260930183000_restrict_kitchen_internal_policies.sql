alter policy cozinha_embalagens_select
on public.cozinha_embalagens
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
);

alter policy cozinha_embalagens_write
on public.cozinha_embalagens
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
)
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
);

alter policy "cozinha sinergias leitura autenticada"
on public.cozinha_sinergias_ingredientes
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
);
