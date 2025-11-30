# Operações — Dev, Build, Preview e Deploy

Este guia descreve o fluxo operacional do projeto para desenvolvimento local, validação e publicação no Firebase Hosting.

## Desenvolvimento local
- Pré‑requisitos:
  - Node.js LTS
  - Firebase CLI (`npm i -g firebase-tools`) — opcional para operações locais
- Comando:
  - `npm run dev`
- Acesso:
  - `http://localhost:5173/` (porta padrão do Vite)

## Build de produção
- Comando: `npm run build`
- Saída: `dist/` (inclui `sw.js` e `workbox-*.js` se PWA habilitado)
- Avisos de tamanho de chunk minificado são esperados em alguns módulos; não interrompem o build.

## Preview (simulação de produção)
- Comando: `npm run preview`
- Porta: geralmente `4173`; se ocupada, o Vite usará uma porta vizinha (ex.: `4175`).
- Uso:
  - Validar visual e comportamento antes do deploy.
  - Exemplos:
    - `http://localhost:4175/` → News
    - `http://localhost:4175/site` → Site/Home

## Deploy (Firebase Hosting)
- Comando padrão: 
  - `npx firebase deploy --only hosting --project fontenews-877a3`
- Boas práticas:
  - Sempre fazer build e validar no preview antes de publicar.
  - Após o deploy, testar as rotas principais e domínios.

## Pós‑deploy
- URL padrão de hospedagem: `https://fontenews-877a3.web.app`
- Rotas principais:
  - `https://fontenews-877a3.web.app/` → News
  - `https://fontenews-877a3.web.app/site` → Site/Home

## Dicas e cuidados
- Auth: adicionar todos os domínios em “Authorized domains” (Firebase Auth) antes de testes de login.
- Analytics: usar mesmo `measurementId` se desejar relatórios unificados entre domínios.
- PWA: a troca de domínio implica caches diferentes; após deploy, atualizações podem exigir recarregar/invalidar cache.
- SEO: usar `rel="canonical"` quando houver conteúdos semelhantes entre domínios.