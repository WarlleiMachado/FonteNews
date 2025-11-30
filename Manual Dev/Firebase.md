# Firebase — Recursos e Configuração

Este projeto utiliza exclusivamente serviços Firebase/Google. Abaixo, um guia de como está configurado e como operar cada recurso com segurança.

## Projeto
- Nome do projeto: `FonteNews`
- ID do projeto: `fontenews-877a3`
- Número do projeto: `920658565832`
- Hosting vinculado: `fontenews-877a3`
- Nome exibido ao público: `Fonte News`
- App ID web: `1:920658565832:web:33f3aea58c6a9377f4e3fd`

## SDK e Configuração Web
A inicialização do Firebase no front segue o padrão abaixo:

```ts
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM',
  authDomain: 'fontenews-877a3.firebaseapp.com',
  projectId: 'fontenews-877a3',
  storageBucket: 'fontenews-877a3.appspot.com',
  messagingSenderId: '920658565832',
  appId: '1:920658565832:web:33f3aea58c6a9377f4e3fd',
  measurementId: 'G-6C8W88C3XN'
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

Referência no código: `src/lib/firebase.ts`.

## Authentication
- Provedores ativos: E‑mail/Senha e Google.
- Domínios autorizados: inclua o domínio padrão de hospedagem no Console (Auth → Settings → Authorized domains), como `fontenews-877a3.web.app`.
- Observações:
  - Sessão é isolada por aba (persistência de sessão configurada em `lib/firebase.ts`).
  - URLs de redirect precisam estar autorizadas no Console.

## Firestore
- Uso típico: conteúdos, perfis e dados do app (ver `firestore.rules` e `firestore.indexes.json`).
- Boas práticas:
  - Definir regras mínimas de leitura/gravação por usuário/role.
  - Versionar estruturas e manter migrações simples.

## Storage
- Bucket: `fontenews-877a3.appspot.com`.
- Uso: imagens, mídias e recursos públicos.
- Regras: ver `storage.rules` (controla quem pode ler/gravar).

## Hosting
- SPA: `rewrites` para `index.html`.
- Deploy:
  - `npx firebase deploy --only hosting --project fontenews-877a3`

## Analytics
- Measurement ID: `G-6C8W88C3XN`.
-

## Cloud Functions / Cloud Run
- Não há backend próprio; novas necessidades devem ser atendidas com produtos Firebase/Google.
- Se necessário, preferimos Functions no mesmo projeto para manter o ecossistema unificado.

## Remote Config / Messaging
- Não usados por padrão. Podem ser ativados conforme necessidade.

## Boas práticas
- Manter `.env` para variáveis não estritamente públicas; evitar chaves privadas no front.
- Validar sempre regras de segurança (`firestore.rules`, `storage.rules`) ao alterar fluxos.
- Antes de publicar, testar no preview (`npm run preview`).