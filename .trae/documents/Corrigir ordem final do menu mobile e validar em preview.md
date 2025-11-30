## Constatação
- No mobile, após “Cursos” a ordem atual está: “Pedido de Oração” → “Onde estamos” → “Bíblia” → “Ministérios” → “Agenda Pastoral”.
- Ordem desejada: “Pedido de Oração” → “Bíblia” → “Ministérios” → “Onde estamos” → “Agenda Pastoral”.

## Arquivo a ajustar
- `src/components/Site/SiteHeader.tsx` (menu mobile dentro do `<AnimatePresence>`), aproximadamente linhas `460–535`.

## Alterações
1. Reordenar blocos `<Link>` para a sequência correta depois de “Cursos”:
   - Manter “Pedido de Oração” (`/site/pedido-de-oracao`) como primeiro após “Cursos”.
   - Colocar “Bíblia” (`/site/biblia`) logo depois.
   - Depois “Ministérios” (`/site/ministerios`).
   - Depois “Onde estamos” (`/site/onde-estamos`).
   - Por último “Agenda Pastoral” (`/site/agenda-pastoral`).
   - Preservar wrappers `motion.div` e classes.

## Validação
- Rodar `npm run build` e reiniciar `npm run preview`.
- Validar no `http://localhost:4173/` a ordem completa: Início → Fonte News → Jornada Vida → Eventos → Cursos → Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral.

## Observação
- Nenhum ajuste de rotas; apenas reordenação dos blocos no mobile.
