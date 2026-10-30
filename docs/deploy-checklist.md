# Convext Deploy Checklist

URL atual: `https://convextmidias.com.br`

Conta Cloudflare: `webboostconvext@gmail.com` (perfil Wrangler `convext`, só neste diretório).
Zona: `convextmidias.com.br` (`d406566c8b05694fe50f04ffb50a4a50`).

## Cloudflare Workers

- Deploy com `npm run deploy:vinext` (build Vite + Wrangler 4.149 no perfil `convext`).
- Rotas do Worker: `convextmidias.com.br/*` e `www.convextmidias.com.br/*` (DNS da zona já existia; custom domain exigiria apagar os A/CNAME).
- `NEXT_PUBLIC_APP_URL` em `wrangler.jsonc` e em `.env.production.local` aponta para `https://convextmidias.com.br`.
- `NEXT_PUBLIC_SUPABASE_URL` fica em `wrangler.jsonc` (`vars`).
- Segredos no Worker: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONVEXT_CONTACT_EMAIL`.
- Atualizar um segredo: `npx wrangler secret put NOME --profile convext`.
- URL de fallback: `https://convext.webboostconvext.workers.dev`.

## Supabase

Projeto `kfhxiljdzgwylruinrve` (`fduran1901@gmail.com's Project`), ligado a este diretório.

- Site URL no Auth: `https://convextmidias.com.br` (já aplicado via `supabase config push`).
- Redirect URLs já aplicados:
  - `https://convextmidias.com.br/auth/callback`
  - `https://convextmidias.com.br/redefinir-senha`
  - `https://www.convextmidias.com.br/auth/callback`
  - `https://www.convextmidias.com.br/redefinir-senha`
  - `http://localhost:8080/auth/callback`
  - `http://localhost:8080/redefinir-senha`
- Confirmar migrations com `npx supabase migration list --linked`.
- Ativar leaked password protection em Authentication > Password Security.
- Confirmar bucket `avatars` e policies de Storage.
- Criar usuários reais via convite ou painel Supabase.

## Resend

- `RESEND_API_KEY` já está no Worker.
- Verificar o domínio de envio `convextmidias.com.br` no Resend. Sem isso o contato grava no Supabase e `emailSent` fica `false`.
- Enviar teste de contato em `https://convextmidias.com.br/contato`.

## Pós-deploy

- Testar `/`, `/contato`, `/design-system`, `/login`, `/esqueci-senha`, `/app`, `/app/perfil` e `/app/configuracoes` no domínio.
- Conferir sitemap em `/sitemap.xml` e robots em `/robots.txt`.
- Rodar Lighthouse em desktop e mobile.
