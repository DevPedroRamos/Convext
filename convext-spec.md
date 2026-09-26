# Convext Platform — Especificação Técnica e de Produto

## 1. Visão geral

**Nome do projeto:** Convext  
**Tipo:** Site institucional + plataforma autenticada  
**Objetivo inicial:** Criar a presença digital da agência Convext com um site institucional de alto impacto visual, autenticação, área restrita em formato de dashboard, página de perfil, sistema de recuperação de senha, design system próprio e infraestrutura pronta para evoluir.

A referência visual principal é o site da **Axiom Power**, especialmente no uso de:

- fundo escuro;
- cor de destaque intensa;
- tipografia editorial;
- blocos de conteúdo com grande escala;
- cards;
- métricas;
- animações vinculadas ao scroll;
- hero com forte apelo visual;
- CTA marcante;
- footer de grande impacto.

A identidade da Convext deve transmitir uma combinação de:

- criatividade;
- tecnologia;
- estratégia;
- sofisticação;
- minimalismo;
- performance.

---

# 2. Stack principal

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- GSAP
- @gsap/react
- ScrollTrigger
- Three.js
- React Three Fiber
- React Three Drei
- Lucide Icons
- React Hook Form
- Zod
- TanStack Query, se necessário

## Backend / Dados

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Next.js Route Handlers
- Server Actions, quando fizer sentido

## E-mails

- Resend
- React Email

## Deploy

- Vercel para o projeto Next.js
- Supabase para banco, autenticação e storage

## Futuro opcional

Caso seja necessário separar serviços pesados do frontend:

- Render para API independente
- workers
- filas
- webhooks complexos
- processamento assíncrono
- integrações externas mais pesadas

---

# 3. Decisão de arquitetura inicial

Para o MVP, a arquitetura recomendada é **não utilizar monorepo inicialmente**.

Estrutura sugerida:

```txt
convext/
├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── styles/
├── public/
├── emails/
├── supabase/
├── types/
├── middleware.ts
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

A ideia é manter:

```txt
Next.js
├── Site institucional
├── Autenticação
├── Dashboard
├── API Routes
├── Server Actions
└── Integração com Resend

Supabase
├── PostgreSQL
├── Auth
└── Storage

Vercel
└── Hospedagem do Next.js
```

Isso reduz a complexidade de deploy e manutenção no início.

---

# 4. Arquitetura futura opcional

Caso a Convext cresça e passe a exigir backend independente:

```txt
convext/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── types/
│   └── config/
├── pnpm-workspace.yaml
└── turbo.json
```

Nesse cenário:

```txt
apps/web → Vercel
apps/api → Render
```

O monorepo não é um problema para Vercel e Render, desde que cada serviço tenha sua raiz de build corretamente configurada.

---

# 5. Identidade visual

## Cores principais

```txt
Primary Orange
#F35703

Dark
#0F0F0F

Light
#FCFCFC
```

## Tokens complementares

```css
--convext-orange: #f35703;
--convext-black: #0f0f0f;
--convext-white: #fcfcfc;

--background: #0f0f0f;
--surface: #151515;
--surface-2: #1b1b1b;

--border: #292929;

--foreground: #fcfcfc;
--muted: #898989;

--primary: #f35703;
```

---

# 6. Tipografia

## Fonte principal de display

**Xenoda**

Usar em:

- Hero
- H1
- H2
- Statements
- CTA
- Footer branding
- números em destaque
- títulos institucionais

## Fonte de interface

**Calibri**

Usar em:

- body
- formulários
- botões
- dashboard
- labels
- navegação
- menus
- tabelas

Fallback:

```css
font-family:
  Calibri,
  Inter,
  Arial,
  sans-serif;
```

Caso Xenoda seja uma fonte local/licenciada:

```ts
import localFont from "next/font/local";
```

---

# 7. Escala tipográfica

```txt
Display XL
clamp(4rem, 10vw, 10rem)

Display
clamp(3.5rem, 8vw, 8rem)

H1
clamp(3rem, 6vw, 6rem)

H2
clamp(2.5rem, 5vw, 5rem)

H3
32px

Body LG
20px

Body
16px

Small
14px

Label
11px
```

Labels:

```txt
UPPERCASE
letter-spacing: .14em
```

---

# 8. Rotas públicas

```txt
/
 /contato
 /login
 /esqueci-senha
 /redefinir-senha
 /design-system
```

---

# 9. Rotas protegidas

```txt
/app
/app/perfil
/app/configuracoes
```

Estrutura futura:

```txt
/app/clientes
/app/projetos
/app/campanhas
/app/relatorios
/app/equipe
```

---

# 10. Estrutura do App Router

```txt
app/
│
├── (marketing)/
│   ├── page.tsx
│   ├── contato/
│   │   └── page.tsx
│   └── design-system/
│       └── page.tsx
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── esqueci-senha/
│   │   └── page.tsx
│   └── redefinir-senha/
│       └── page.tsx
│
├── (dashboard)/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── perfil/
│       │   └── page.tsx
│       └── configuracoes/
│           └── page.tsx
│
├── api/
│   ├── contact/
│   │   └── route.ts
│   └── profile/
│       └── route.ts
│
├── loading.tsx
├── error.tsx
├── not-found.tsx
└── layout.tsx
```

---

# 11. Página raiz `/`

A Home deve ser a página institucional principal da Convext.

Direção visual:

```txt
Axiom-style editorial layout
+
Convext Orange
+
Dark UI
+
Oversized Xenoda Typography
+
High-quality Video
+
GSAP Storytelling
+
Subtle Three.js
```

---

# 12. Header

Header fixo ou flutuante.

Estrutura:

```txt
[ CONVEXT ]

Cases
Serviços
Sobre
Contato

[ Vamos conversar → ]
```

Comportamento:

- fundo translúcido;
- blur;
- borda sutil;
- altura reduzida durante scroll;
- logo sempre visível;
- microinterações no menu.

Exemplo:

```css
background: rgba(15, 15, 15, 0.72);
backdrop-filter: blur(16px);
```

---

# 13. Hero

A Hero será o principal elemento visual da Home.

## Headline sugerida

```txt
Estratégia que move.
Criatividade que converte.
```

Alternativa:

```txt
Ideias que ganham
movimento.
```

Descrição:

> Estratégia, tecnologia e criatividade trabalhando juntas para transformar marcas em experiências que geram resultado.

CTAs:

```txt
[ Conheça a Convext → ]
[ Ver projetos ]
```

---

# 14. Hero com vídeo animado

O vídeo deve ocupar aproximadamente:

```txt
100vw
100vh
```

Configuração base:

```tsx
<video
  autoPlay
  muted
  loop
  playsInline
/>
```

## Animação com scroll

Inicialmente:

```txt
scale: 1
border-radius: 0
```

Durante scroll:

```txt
scale → 0.86
border-radius → 24px
```

Headline:

```txt
opacity → 0
translateY → -80px
```

Tecnologia:

```txt
GSAP
+
ScrollTrigger
+
pin
+
scrub
```

Estrutura:

```txt
Hero
 ├── Video
 ├── Overlay
 ├── Headline
 ├── Description
 ├── CTA
 └── Scroll Indicator
```

---

# 15. Manifesto

Seção inspirada no grande bloco laranja da referência.

Background:

```txt
#F35703
```

Texto sugerido:

> A Convext conecta criatividade, estratégia e tecnologia para construir marcas que não passam despercebidas.

Animação:

```txt
opacity: .2 → 1
```

Cada linha deve ganhar destaque conforme entra no viewport.

Pode ser implementado com:

- GSAP
- SplitText ou alternativa
- mask reveal
- stagger

---

# 16. Serviços

Título:

```txt
O que fazemos.
```

Grid sugerido:

```txt
01
Branding

02
Social Media

03
Performance

04
Web & Technology

05
Creative Strategy

06
Content
```

Hover:

```txt
border → orange
number → orange
arrow → translateX
```

---

# 17. Projetos / Cases

Título:

```txt
Trabalhos que
movem marcas.
```

Cards verticais grandes.

Exemplo:

```txt
Projeto 01
Branding + Website

Projeto 02
Growth + Performance

Projeto 03
Social + Creative
```

Hover:

```txt
image scale 1 → 1.05
overlay
cursor customizado
```

---

# 18. Métricas

Grid de métricas inspirado na referência.

```txt
+120
Projetos entregues

48M+
Impressões geradas

+42%
Performance média

10+
Segmentos atendidos
```

Os números devem utilizar counter animation quando entrarem no viewport.

---

# 19. Seção Three.js

Criar uma seção visual com Three.js.

Possibilidades:

- linhas abstratas;
- partículas;
- mesh animada;
- ondas;
- gradientes;
- objetos seguindo o cursor;
- efeito de profundidade.

Estética:

```txt
black background
orange emissive
subtle particles
```

## Performance

Carregar Three.js dinamicamente:

```ts
dynamic(() => import(...), {
  ssr: false,
});
```

Implementar fallback para:

```txt
prefers-reduced-motion
```

---

# 20. CTA principal

Bloco laranja de alto impacto.

```txt
Tem uma ideia?
Vamos transformar em algo grande.
```

Botão:

```txt
Fale com a Convext →
```

---

# 21. Footer

Estrutura:

```txt
CONVEXT
```

em tamanho muito grande.

Colunas:

```txt
Convext
Sobre
Cases
Contato

Serviços
Branding
Social
Performance
Web

Social
Instagram
LinkedIn
Behance
```

Rodapé:

```txt
© 2026 Convext.
Todos os direitos reservados.
```

---

# 22. Página `/contato`

Estrutura desktop:

```txt
-------------------------------------------------
|                           |                   |
| VAMOS CONVERSAR           | FORMULÁRIO        |
|                           |                   |
| Texto                     | Tipo de projeto   |
|                           |                   |
| E-mail                    | Nome              |
| Telefone                  | E-mail            |
| Instagram                 | Empresa           |
|                           | Mensagem          |
|                           |                   |
|                           | [ Enviar → ]      |
-------------------------------------------------
```

Título sugerido:

```txt
Vamos criar
algo relevante.
```

Descrição:

> Conte para nós sobre sua marca, projeto ou desafio. Nosso time entra em contato para entender como a Convext pode ajudar.

---

# 23. Formulário de contato

Campos:

```txt
Tipo de contato
Nome
Sobrenome
E-mail
Telefone
Empresa
Website / Instagram
Mensagem
```

Tipos:

```txt
Novo projeto
Orçamento
Parcerias
Outro
```

Validação:

```txt
React Hook Form
+
Zod
```

Endpoint:

```txt
POST /api/contact
```

---

# 24. Fluxo do contato

```txt
Browser
   ↓
Next.js Route Handler
   ↓
Validação com Zod
   ↓
Supabase
   ↓
Resend
   ↓
E-mail Convext
```

Também pode ser enviado um e-mail automático de confirmação para o usuário.

---

# 25. Resend

Usar para:

- contato;
- notificações internas;
- confirmações;
- redefinição de senha, caso desejado;
- futuras notificações do dashboard.

Template com React Email.

Exemplo de assunto:

```txt
Novo contato pelo site — Convext
```

Confirmação:

```txt
Recebemos sua mensagem.
```

---

# 26. Página de login

URL:

```txt
/login
```

Layout:

```txt
------------------------------------
|                                  |
|            CONVEXT               |
|                                  |
|       Bem-vindo de volta         |
|                                  |
|       E-mail                     |
|       Senha                      |
|                                  |
|       [ Entrar ]                 |
|                                  |
|       Esqueci minha senha        |
|                                  |
------------------------------------
```

Background:

```txt
#0F0F0F
```

Detalhe gráfico:

- partículas;
- linha animada;
- gradiente;
- Three.js leve;
- glow laranja.

---

# 27. Autenticação

Utilizar:

```txt
Supabase Auth
```

Fluxo:

```txt
E-mail
+
Senha
```

Processo:

```txt
Login
↓
Supabase Auth
↓
Session
↓
Middleware Next.js
↓
/app
```

---

# 28. Redirecionamentos de autenticação

Usuário não autenticado:

```txt
/app
↓
/login
```

Usuário autenticado tentando acessar:

```txt
/login
↓
/app
```

---

# 29. Recuperação de senha

Página:

```txt
/esqueci-senha
```

Campo:

```txt
E-mail
```

Ação:

```txt
Enviar link de recuperação
```

Fluxo:

```txt
Supabase
↓
E-mail
↓
Link
↓
/redefinir-senha
```

---

# 30. Dashboard

Após login:

```txt
/app
```

Conteúdo inicial:

```txt
Olá, {firstName}.
Bem-vindo à Convext.
```

O dashboard deve começar simples, mas já ter estrutura pronta para crescer.

---

# 31. Layout do dashboard

```txt
┌─────────────────────────────────────────┐
│ Sidebar        │ Header                 │
│                │                        │
│ CONVEXT        │ Olá, Pedro             │
│                │                        │
│ Dashboard      │                        │
│ Perfil         │        CONTENT         │
│ Configurações  │                        │
│                │                        │
│                │                        │
│ [Avatar]       │                        │
│ Pedro          │                        │
└─────────────────────────────────────────┘
```

---

# 32. Sidebar

Itens iniciais:

```txt
Logo

Dashboard
Perfil
Configurações

---

Avatar
Nome
E-mail
Logout
```

Mobile:

```txt
sidebar → Sheet / Drawer
```

---

# 33. Componente de usuário

Estrutura:

```txt
Avatar
Nome
E-mail
DropdownMenu
```

Menu:

```txt
Pedro Ribeiro
pedro@email.com

Perfil
Configurações

Sair
```

---

# 34. Página de perfil

URL:

```txt
/app/perfil
```

Campos:

```txt
Avatar
Nome
Sobrenome
E-mail
Telefone
Cargo
Empresa
```

Ações:

```txt
Salvar alterações
Alterar senha
```

Avatar:

```txt
Supabase Storage
```

---

# 35. Página de configurações

URL:

```txt
/app/configuracoes
```

Itens iniciais:

```txt
Conta
Segurança
Preferências
Tema
Sessão
```

No MVP, pode começar apenas com:

- alteração de senha;
- logout;
- dados básicos de conta.

---

# 36. Banco de dados

## Tabela `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  role VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Relacionamento:

```txt
auth.users
     │
     │ 1:1
     ▼
profiles
```

---

# 37. Tabela `contacts`

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  company VARCHAR,
  website VARCHAR,
  inquiry_type VARCHAR,
  message TEXT,
  status VARCHAR DEFAULT 'new',
  created_at TIMESTAMP DEFAULT now()
);
```

Status:

```txt
new
contacted
qualified
archived
```

---

# 38. Design System

URL:

```txt
/design-system
```

A página deve mostrar:

- cores;
- tipografia;
- espaçamentos;
- botões;
- inputs;
- selects;
- badges;
- cards;
- modals;
- dropdowns;
- loaders;
- tabelas;
- estados;
- ícones;
- componentes do dashboard;
- exemplos de animação.

---

# 39. Buttons

Variantes:

```txt
Primary
Secondary
Ghost
Outline
Icon
```

Primary:

```txt
background: #F35703
color: #0F0F0F
```

Hover:

```txt
scale: .98
```

Ícone:

```txt
→
```

Microinteração:

```txt
translateX
```

---

# 40. Border radius

```txt
sm: 6px
md: 10px
lg: 16px
xl: 24px
```

---

# 41. Loading personalizado

Componente:

```txt
<ConvextLoader />
```

Tela:

```txt
#0F0F0F
```

Centro:

```txt
CONVEXT
```

Animação sugerida:

```txt
0%
C

25%
CON

60%
CONVEXT

100%
fade-out
```

Barra inferior:

```txt
0 → 100%
```

Cor:

```txt
#F35703
```

GSAP Timeline:

```txt
logo
progress
fade
page reveal
```

---

# 42. Page transitions

Transição sugerida:

```txt
Page exit
↓
orange overlay
↓
route change
↓
orange overlay sobe
↓
page reveal
```

Duração:

```txt
500–800ms
```

No dashboard, as transições devem ser mais discretas.

---

# 43. Motion Design

Usar GSAP como biblioteca principal.

Animações:

```txt
Text Reveal
Fade Up
Mask Reveal
Image Scale
Horizontal Marquee
Parallax
Scroll Pin
Video Scrubbing
Counter
Cursor Follow
Page Reveal
```

As animações devem reforçar a narrativa, não apenas decorar.

---

# 44. Componentes principais

```txt
components/

layout/
  Header.tsx
  Footer.tsx
  Container.tsx
  Section.tsx

marketing/
  Hero.tsx
  Manifesto.tsx
  Services.tsx
  Projects.tsx
  Metrics.tsx
  CTA.tsx

motion/
  RevealText.tsx
  FadeUp.tsx
  Parallax.tsx
  SmoothScroll.tsx
  PageTransition.tsx
  ConvextLoader.tsx

dashboard/
  AppSidebar.tsx
  AppHeader.tsx
  UserMenu.tsx

forms/
  ContactForm.tsx
  LoginForm.tsx
  ResetPasswordForm.tsx

ui/
  shadcn components
```

---

# 45. Middleware

Arquivo:

```txt
middleware.ts
```

Responsabilidades:

- validar sessão;
- proteger `/app`;
- redirecionar usuário autenticado;
- renovar sessão do Supabase quando necessário.

Pseudo fluxo:

```ts
if (!session && pathname.startsWith("/app")) {
  redirect("/login");
}

if (session && pathname === "/login") {
  redirect("/app");
}
```

---

# 46. Segurança

Ativar:

```txt
Row Level Security
```

desde o início.

Regra de profiles:

```txt
usuário lê apenas o próprio profile
usuário edita apenas o próprio profile
```

Nunca expor no frontend:

```env
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
DATABASE_URL
```

---

# 47. Variáveis de ambiente

## Frontend / Vercel

```env
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Server-side

```env
SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

---

# 48. API inicial

Mesmo sem Render, a aplicação pode ter API própria via Next.js.

Endpoints:

```txt
GET /api/health

GET /api/profile

PATCH /api/profile

POST /api/contact
```

Exemplo:

```json
{
  "status": "ok"
}
```

---

# 49. Fluxo geral do sistema

```txt
                   ┌─────────────┐
                   │   Browser   │
                   └──────┬──────┘
                          │
                          ▼
                    ┌──────────┐
                    │  Vercel  │
                    │ Next.js  │
                    └────┬─────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       ┌────────────┐          ┌──────────┐
       │ Supabase   │          │ Resend   │
       │ Auth + DB  │          │ E-mails  │
       │ + Storage  │          └──────────┘
       └────────────┘
```

---

# 50. Deploy na Vercel

Fluxo:

```txt
GitHub
↓
Vercel
↓
Preview Deployments
↓
Production
```

Branch principal:

```txt
main
```

Pull Requests:

```txt
preview deployments
```

Domínios:

```txt
convext.com.br
www.convext.com.br
```

---

# 51. Render como evolução futura

O Render não é necessário no MVP.

Pode ser adicionado caso surjam:

- processamento pesado;
- webhooks de longa duração;
- workers;
- filas;
- cron jobs complexos;
- automações;
- integrações externas;
- serviços independentes.

Arquitetura futura:

```txt
Browser
   ↓
Next.js / Vercel
   ↓
Render API
   ↓
Supabase / serviços externos
```

---

# 52. SEO

Metadata:

```txt
Convext — Marketing, criatividade e tecnologia
```

Description:

> Agência de marketing, tecnologia e criatividade focada na construção de marcas e experiências digitais.

Implementar:

- metadata;
- OpenGraph;
- Twitter Cards;
- favicon;
- manifest;
- sitemap.xml;
- robots.txt.

---

# 53. Acessibilidade

Obrigatório:

- semantic HTML;
- keyboard navigation;
- focus-visible;
- aria labels;
- contraste WCAG AA;
- prefers-reduced-motion;
- formulários acessíveis;
- navegação por teclado.

GSAP deve respeitar:

```css
@media (prefers-reduced-motion: reduce) {
  /* reduzir ou remover animações */
}
```

---

# 54. Performance

Objetivos:

```txt
Lighthouse

Performance > 90
Accessibility > 95
Best Practices > 95
SEO > 95
```

Usar:

- next/image;
- next/font;
- dynamic imports;
- lazy loading;
- code splitting;
- WebM;
- AVIF;
- imagens otimizadas;
- vídeos comprimidos;
- preload seletivo.

---

# 55. Responsividade

Breakpoints:

```txt
mobile
< 640

tablet
640–1024

desktop
1024+

large
1440+
```

A experiência mobile deve ser pensada especificamente.

Exemplo Hero:

```txt
Desktop
120px headline

Mobile
56px headline
```

---

# 56. Fases de desenvolvimento

## Sprint 01 — Fundação

```txt
Next.js
TypeScript
Tailwind
shadcn
Supabase
ESLint
Prettier
Environment
Repository
```

---

## Sprint 02 — Design System

```txt
Colors
Typography
Spacing
Buttons
Inputs
Cards
Dialog
Dropdown
Navigation
Loading
```

---

## Sprint 03 — Site

```txt
Header
Hero
Manifesto
Services
Cases
Metrics
CTA
Footer
```

---

## Sprint 04 — Motion

```txt
GSAP
ScrollTrigger
Hero Video
Scroll Animations
Three.js
Page Transitions
Loader
```

---

## Sprint 05 — Auth

```txt
Login
Session
Forgot Password
Reset Password
Middleware
```

---

## Sprint 06 — Dashboard

```txt
Sidebar
Header
User Component
Home
Profile
Settings
```

---

## Sprint 07 — Contact

```txt
Contact Page
Form
API
Database
Resend
```

---

## Sprint 08 — Deploy

```txt
Supabase Production
Vercel
Domains
Analytics
Monitoring
```

---

# 57. Definition of Done do MVP

O MVP será considerado concluído quando:

- `/` estiver responsiva;
- Hero possuir vídeo e animação vinculada ao scroll;
- GSAP estiver implementado nas principais seções;
- Three.js estiver presente em pelo menos uma experiência visual;
- `/contato` estiver funcional;
- formulário salvar contato no banco;
- formulário enviar e-mail via Resend;
- login estiver integrado ao Supabase;
- recuperação de senha estiver funcionando;
- `/app` exigir autenticação;
- dashboard possuir sidebar;
- dashboard possuir header;
- dashboard possuir user menu;
- `/app/perfil` estiver funcional;
- loading personalizado estiver funcionando;
- design system possuir página própria;
- aplicação estiver publicada na Vercel;
- Supabase estiver configurado em produção;
- Resend estiver configurado;
- responsividade mobile/tablet/desktop estiver validada.

---

# 58. Direção visual final

A Convext deve parecer um estúdio criativo e tecnológico, não um SaaS corporativo genérico.

A linguagem visual deve combinar:

```txt
Editorial
+
Minimalista
+
Premium
+
Tecnológica
+
Cinematográfica
```

Site institucional:

```txt
expressivo
animado
imersivo
visual
```

Dashboard:

```txt
funcional
limpo
discreto
rápido
```

---

# 59. Referências visuais

Referência principal:

```txt
https://axiom-power-template.webflow.io
```

Aspectos a reproduzir como direção, sem copiar conteúdo:

- hierarchy;
- dark interface;
- large typography;
- orange accent;
- scroll storytelling;
- cards;
- metrics;
- motion;
- large CTA/footer.

---

# 60. Observação sobre `awesome.md` e `impecable`

Os nomes `awesome.md` e `impecable` não foram considerados como dependências fechadas neste documento porque precisam ser confirmados quanto ao pacote, repositório ou ferramenta exata.

Recomendação:

```txt
validar pacote
↓
validar compatibilidade
↓
adicionar ao package.json
```

---

# 61. Resumo técnico final

Arquitetura recomendada para o início:

```txt
Next.js
├── Site
├── Login
├── Dashboard
├── API Routes
├── Server Actions
└── Resend

Supabase
├── PostgreSQL
├── Auth
└── Storage

Vercel
└── Hosting
```

Render fica opcional para uma fase futura.

Essa arquitetura atende todo o escopo atual com menos complexidade operacional, menor custo de manutenção e maior velocidade de desenvolvimento.
