## Objetivo
- Ajustar a ordem dos itens do menu mobile do Site para: Início → Fonte News → Jornada Vida → Eventos → Cursos → Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral.

## Situação Atual
- Desktop já está correto.
- Mobile está com “Onde estamos” antes de “Bíblia” e “Ministérios”.

## Arquivo a alterar
- `src/components/Site/SiteHeader.tsx`
  - Seção do menu mobile dentro do `<AnimatePresence>` e `<motion.div>` (aprox. linhas 408–535).

## Passos
1. Reordenar blocos `<Link>` no menu mobile:
   - Manter Início, Fonte News, Jornada Vida, Eventos, Cursos como estão.
   - Garantir a sequência após “Cursos” de:
     - Pedido de Oração (`/site/pedido-de-oracao`)
     - Bíblia (`/site/biblia`)
     - Ministérios (`/site/ministerios`)
     - Onde estamos (`/site/onde-estamos`)
     - Agenda Pastoral (`/site/agenda-pastoral`)
   - Mover o bloco “Onde estamos” (hoje em ~489–499) para depois do bloco “Ministérios” (em ~513–523) e antes de “Agenda Pastoral” (em ~525–535).
   - Preservar wrappers `motion.div`, classes e `onClick` para manter animação parallax e estilo.
2. Rebuildar e reiniciar o preview:
   - `npm run build` e `npm run preview`.
3. Validar visualmente a ordem no `http://localhost:4173/`.

## Observação
- Nenhuma mudança de rota/caminho; apenas reordenação dos blocos de links no mobile.

Posso aplicar agora e atualizar o preview para você validar?