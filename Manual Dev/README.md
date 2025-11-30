# Manual do Desenvolvedor — FonteNews

Este manual dá uma visão rápida e prática do app FonteNews para qualquer desenvolvedor (humano ou IA) entrar em contexto e trabalhar com segurança. O projeto é 100% baseado em Firebase e serviços Google.

## Visão geral
- Projeto: `FonteNews`
- Firebase: `fontenews-877a3` (Projeto ID) — Hosting, Auth, Firestore, Storage, Analytics
- Stack web: React + Vite + TypeScript + Tailwind (CSS)
- PWA: via `vite-plugin-pwa` (arquivo `src/pwa.ts`, artefatos gerados em `dist/sw.js`)
- Áreas do app:
  - `/` → Área “News” (Fonte News)
  - `/site` → Área “Site/Home”

## Convenções e princípios
- Só usamos Firebase/Google para backend e serviços (sem servidores próprios).
- Segurança e privacidade: credenciais sensíveis em `.env` sempre que possível; a `apiKey` do Firebase no front é pública por design.
- SPA com `react-router-dom`; todas as rotas reescrevem para `index.html` no Hosting.
- Deploys fazem build de produção e publicam no Firebase Hosting.

## Como rodar
- Desenvolvimento: `npm run dev`
- Build produção: `npm run build`
- Preview (simula prod): `npm run preview`
- Deploy (Hosting): `npx firebase deploy --only hosting --project fontenews-877a3`

## Estrutura de pastas relevante
- `src/` código-fonte do app
  - `pages/` páginas (Admin, Agenda, Home, Site, etc.)
  - `components/` componentes (inclui `Layout`) 
  - `lib/firebase.ts` inicialização do SDK Firebase
  - `pwa.ts` registro do service worker
  - `hooks/` hooks (`useAuth`, `useApp` etc.)
- `public/` ativos estáticos (imagens, sons, `slider-test.html`)
- `dist/` saída do build (inclui `sw.js` e `workbox-*.js` quando PWA habilitado)
- `firebase.json` configuração do Hosting e rewrites
- `firestore.rules`, `storage.rules` regras de segurança

## Autenticação e login
- Provedores ativos: E‑mail/Senha e Google.
- Fluxo principal:
  - Login com Google via `useAuth.loginWithGoogle`.
  - Login por E‑mail/Senha via `useAuth.login`.
  - Alternativamente, login por Link de E‑mail (em `Login.tsx` com `sendSignInLinkToEmail` e `signInWithEmailLink`).
- Pré‑autorização: o e‑mail informado é verificado contra `authorizedUsers` (em `AppContext`), com status `active | inactive | blocked`.
- Mapeamento de segurança: após login, vinculamos `firebaseUid` ao registro em `authorizedUsers` e atualizamos `/users/{uid}`.
- Redirecionamento pós‑login: admins → `/dashboard`; demais → `/profile`.
- Persistência: `browserSessionPersistence` (sessão por aba, configurado em `lib/firebase.ts`).

## PWA/Service Worker
- Registro básico em `src/pwa.ts`.
- Artefatos gerados em build: `dist/sw.js` e `dist/workbox-*.js`.

## Layout do Site/Home
- `src/components/Layout/Layout.tsx` organiza cabeçalho e conteúdo.
- O `iframe` da Home carrega conteúdo externo; `sliderReady` controla estado interno. O indicador visual de loading foi removido.

## Próximos documentos
- Arquitetura (`Manual Dev/Arquitetura.md`)
- Firebase e serviços (`Manual Dev/Firebase.md`)
- Operações e deploy (`Manual Dev/Operacoes.md`)