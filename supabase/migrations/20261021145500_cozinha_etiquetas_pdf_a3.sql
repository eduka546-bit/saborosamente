-- PDFs originais de etiquetas: um arquivo A3 de três páginas por sabor.
create table if not exists public.cozinha_etiqueta_pdf_modelos (
  produto_id uuid primary key references public.produtos(id) on delete cascade,
  arquivo_path text not null,
  nome_arquivo text,
  updated_at timestamptz not null default now()
);

alter table public.cozinha_etiqueta_pdf_modelos enable row level security;

create policy "cozinha consulta modelos pdf" on public.cozinha_etiqueta_pdf_modelos
for select to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
);

create policy "cozinha administra modelos pdf" on public.cozinha_etiqueta_pdf_modelos
for all to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
)
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('etiquetas-pdf', 'etiquetas-pdf', false, 26214400, array['application/pdf']::text[])
on conflict (id) do nothing;

create policy "cozinha consulta arquivos de etiquetas" on storage.objects
for select to authenticated
using (
  bucket_id = 'etiquetas-pdf' and (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  )
);

create policy "cozinha envia arquivos de etiquetas" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'etiquetas-pdf' and (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  )
);

create policy "cozinha remove arquivos de etiquetas" on storage.objects
for delete to authenticated
using (
  bucket_id = 'etiquetas-pdf' and (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  )
);
