# Arquitetura e Roteamento

Este documento descreve a organização lógica do app e as rotas das duas áreas atuais: Fonte News e Site/Home.

## Stack e organização
- Frontend: React + Vite + TypeScript
- Estilos: Tailwind CSS (`src/index.css`, `tailwind.config.js`)
- Router: `react-router-dom`
- PWA: `vite-plugin-pwa` (ver `src/pwa.ts`)

## Rotas principais
- `"/"` → Área Fonte News (lista/feeds, conteúdos internos)
- `"/site"` → Área Site/Home (landing, slider/iframe)

### Observações
- Todo o app é SPA; o Hosting reescreve qualquer rota para `index.html`.
- A navegação entre áreas usa rotas internas (`/` e `/site`).

## Fluxo de login e redirecionamento
- Página `src/pages/Login.tsx`:
  - Login com Google (`useAuth.loginWithGoogle`).
  - Login por E‑mail/Senha (`useAuth.login`).
  - Login por Link de E‑mail (envio e conclusão com `sendSignInLinkToEmail` / `signInWithEmailLink`).
- Pré‑autorização: o e‑mail é verificado em `authorizedUsers` (via `AppContext`) e precisa estar `active`.
- Pós‑login:
  - Vincula `firebaseUid` ao `authorizedUsers` e atualiza `/users/{uid}`.
  - Redireciona: admin → `/dashboard`; demais → `/profile`.

## Componentes e layout
- `src/components/Layout/Layout.tsx`: organiza cabeçalho, área de conteúdo e o slider/iframe da Home do site.
- Estado `sliderReady`: atualizado pelo `onLoad` do `iframe`. O indicador visual de loading foi removido.

## Hooks e Contextos
- `src/hooks/useAuth.ts`: integrações com Firebase Auth; provê `user`, `login`, `loginWithGoogle`, `logout` e estados.
- `src/contexts/AuthContext.tsx`: implementa o fluxo completo de autenticação, mapeamento de usuários e sessão por aba.
- `src/hooks/useApp.ts` e `src/contexts/AppContext.tsx`: estados globais, lista `authorizedUsers`, configurações da igreja, presença online.
- `src/hooks/useTheme.ts`: tema/estilo.

## PWA e Service Worker
- Registro básico em `src/pwa.ts`.
- Artefatos gerados em build: `dist/sw.js` e `dist/workbox-*.js`.
- Como SPA, o SW cacheia navegação/ativos; cuidado com atualizações e invalidar caches em deploys.

## Boas práticas
- Validar status do usuário (`active`, `inactive`, `blocked`) antes de conceder acesso a telas administrativas.
- Manter navegação simples entre as duas áreas (`/` e `/site`).