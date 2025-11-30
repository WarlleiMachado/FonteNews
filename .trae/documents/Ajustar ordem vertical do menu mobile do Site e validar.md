## Problema
- No mobile (vertical), há itens fora de ordem e duplicados: um bloco de “Agenda Pastoral” aparece antes do grupo final e a sequência após “Cursos” não segue o pedido.

## Ordem desejada
- Início → Fonte News → Jornada Vida → Eventos → Cursos → Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral

## Arquivo
- `src/components/Site/SiteHeader.tsx` — seção do menu mobile dentro de `<AnimatePresence>` e `<motion.div>` (~linhas 408–535).

## Ajustes
1. Reordenar blocos `<Link>` do mobile para a ordem acima.
2. Remover duplicidade de “Agenda Pastoral” (existe um bloco antes do “sequência ajustada” e outro ao final).
3. Garantir que “Pedido de Oração” venha logo após “Cursos”, seguido por “Bíblia”, “Ministérios”, “Onde estamos” e então “Agenda Pastoral”.
4. Preservar `motion.div` wrappers e classes (parallax/estilos) e `onClick`.

## Validação
- Rodar `npm run build` e reiniciar `npm run preview`.
- Validar no `http://localhost:4173/` que a ordem em mobile (vertical) está exatamente como solicitada.

Posso aplicar a correção e atualizar o preview agora?