drop policy if exists "authenticated can read whatsapp media" on storage.objects;

create policy "admin can read whatsapp media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'whatsapp-midias'
  and public.usuario_tem_role(array['admin'])
);
