# E-mails de autenticação — SaborosaMente

Os e-mails de autenticação continuam sendo gerenciados pelo Supabase Auth, mas a entrega deve usar o Resend por SMTP.

## SMTP

- Sender name: `SaborosaMente`
- Sender email: `pedidos@saborosamente.com`
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: usar uma API key ativa do Resend como segredo. Nunca versionar a chave.

## URLs

- Site URL: `https://saborosamente.com`
- Redirect permitido: `https://saborosamente.com/auth`

## Fluxos

Ativar confirmação de e-mail para novos cadastros e a notificação de segurança quando a senha for alterada.

### Confirm signup

Assunto: `Confirme seu e-mail | SaborosaMente`

Conteúdo: `supabase/templates/confirmation.html`

### Reset password

Assunto: `Redefina sua senha | SaborosaMente`

Conteúdo: `supabase/templates/recovery.html`

### Password changed

Assunto: `Sua senha foi alterada | SaborosaMente`

Conteúdo: `supabase/templates/password_changed_notification.html`

O site já usa `resetPasswordForEmail` no fluxo “Esqueci minha senha” e envia o usuário de volta para `/auth`, onde a nova senha é definida.
