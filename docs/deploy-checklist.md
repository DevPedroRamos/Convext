# Convext Deploy Checklist

## Vercel

- Conectar o repositório GitHub ao projeto Vercel.
- Definir `NEXT_PUBLIC_APP_URL` com a URL final.
- Definir `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Definir `SUPABASE_SERVICE_ROLE_KEY` apenas como variável server-side.
- Definir `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `CONVEXT_CONTACT_EMAIL`.
- Validar domínio `convext.com.br` e `www.convext.com.br`.
- Rodar `npm run build` no preview antes de promover para produção.

## Supabase

- Confirmar migrations aplicadas com `npx supabase migration list --linked`.
- Ativar leaked password protection em Authentication > Password Security.
- Configurar URLs de redirect: `/auth/callback` e `/redefinir-senha`.
- Confirmar bucket `avatars` e policies de Storage.
- Criar usuários reais via convite ou painel Supabase.

## Resend

- Autenticar CLI com `resend login` ou preencher `RESEND_API_KEY`.
- Verificar domínio de envio.
- Enviar teste de contato em preview.

## Pós-deploy

- Testar `/`, `/contato`, `/design-system`, `/login`, `/esqueci-senha`, `/app`, `/app/perfil` e `/app/configuracoes`.
- Conferir sitemap em `/sitemap.xml` e robots em `/robots.txt`.
- Rodar Lighthouse em desktop e mobile.
