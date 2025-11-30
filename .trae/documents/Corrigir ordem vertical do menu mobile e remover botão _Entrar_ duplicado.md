## Problema
- No mobile (vertical), a ordem difere do desktop: “Onde estamos” aparece antes de “Bíblia” e “Ministérios”.
- Botão “Entrar” aparece ao final da lista, mas já existe no topo.

## Ordem correta desejada
- Início → Fonte News → Jornada Vida → Eventos → Cursos → Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral

## Arquivo a ajustar
- `src/components/Site/SiteHeader.tsx` — bloco do menu mobile dentro de `<AnimatePresence>`.

## Ajustes
1. Reordenar blocos após “Cursos”:
   - Manter “Pedido de Oração” logo após “Cursos” (`SiteHeader.tsx:474–485`).
   - Mover o bloco “Onde estamos” (`SiteHeader.tsx:489–499`) para APÓS “Ministérios” (`SiteHeader.tsx:513–523`) e ANTES de “Agenda Pastoral” (`SiteHeader.tsx:525–535`).
   - Garantir ordem: Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral.
2. Remover o botão “Entrar” do final da lista (mobile):
   - Seção “Login/Logout no menu mobile” em `SiteHeader.tsx:520–536` — substituir o branch `else` (render de “Entrar”) por nada, mantendo apenas o botão “Sair” quando autenticado.
3. Manter animações parallax:
   - Preservar wrappers `motion.div`/`motion.button` e classes.

## Validação
1. Rebuild e preview local.
2. Deploy Firebase Hosting.
3. Validar em produção com hard refresh: `https://fontenews-877a3.web.app/site` (portrait e landscape) verificando ordem e ausência do “Entrar” ao final.

Confirmando, aplico as alterações agora e publico para validação em produção.