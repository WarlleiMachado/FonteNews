## Compromisso de Validação
- Passo padrão: validar todas as mudanças em `https://fontenews-877a3.web.app/site` (produção), tanto em mobile vertical (portrait) quanto horizontal (landscape).
- Usar hard refresh (Ctrl+F5) e, se necessário, navegação anônima para evitar cache do service worker.

## Ordem Desejada
- Início → Fonte News → Jornada Vida → Eventos → Cursos → Pedido de Oração → Bíblia → Ministérios → Onde estamos → Agenda Pastoral

## Ações Planejadas
1. Verificar a ordem atual em produção (`https://fontenews-877a3.web.app/site`) em mobile vertical.
2. Reordenar os blocos do menu mobile no arquivo `src/components/Site/SiteHeader.tsx` para refletir exatamente a sequência acima.
   - Garantir que não exista duplicidade de “Agenda Pastoral”.
   - Preservar animações parallax (`motion.div`) e classes.
3. Rebuildar e fazer deploy no Firebase Hosting.
4. Validar novamente em `https://fontenews-877a3.web.app/site`:
   - Mobile vertical e horizontal.
   - Confirmar a ordem e o funcionamento dos links.

## Critérios de Aceite
- A ordem no mobile (vertical e horizontal) coincide com a lista especificada.
- Nenhum item duplicado.
- Navegação de todos os links funcional.

Se você aprovar, executo os ajustes e publico, validando em `https://fontenews-877a3.web.app/site`. 