## Problemas observados
- Ordem do menu mobile (vertical) não coincide com o desktop.
- Botão "Entrar" aparece duplicado no final do menu mobile; já existe o botão no topo.

## Ordem correta desejada
Início → Fonte News → Jornada Vida → Eventos → Cursos → Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral

## Arquivo a ajustar
- `src/components/Site/SiteHeader.tsx` — bloco do menu mobile dentro de `<AnimatePresence>` (~linhas 408–535).

## Ajustes propostos
1. Remover bloco duplicado de "Agenda Pastoral" que aparece antes da sequência final (em ~`SiteHeader.tsx:474–485`).
2. Reordenar os blocos após "Cursos" para a sequência exata:
   - Pedido de Oração (`/site/pedido-de-oracao`)
   - Bíblia (`/site/biblia`)
   - Ministérios (`/site/ministerios`)
   - Onde estamos (`/site/onde-estamos`)
   - Agenda Pastoral (`/site/agenda-pastoral`)
   - Especificamente, mover o bloco "Onde estamos" (em ~`489–499`) para depois de "Ministérios" (em ~`513–523`).
3. Remover o botão "Entrar" do final do menu mobile (deixar de renderizar quando `!firebaseUser`); manter apenas o botão "Sair" quando autenticado.
   - Local: `SiteHeader.tsx:520–536` — substituir o branch `else` (render de "Entrar") por `null`.

## Validação
- Rebuild e reiniciar preview local
- Validar em produção: `https://fontenews-877a3.web.app/site` (portrait e landscape) com hard refresh
- Confirmar ordem e que não há "Entrar" duplicado ao final do menu mobile.

Posso aplicar essas correções e validar no domínio de produção agora?