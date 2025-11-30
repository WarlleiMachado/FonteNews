## Objetivo
- Criar a página "Onde estamos" na área do Site e adicioná-la ao menu principal entre "Transborde" e "Cursos", com ícone personalizado (`public/onde-estamos.svg`) adaptado ao tema/cor principal.

## Onde Atualizar
- Menu Desktop: `src/components/Site/SiteHeader.tsx` (array `siteMenuItems`) — entre `Transborde` e `Cursos`.
- Menu Mobile: `src/components/Site/SiteHeader.tsx` — bloco de links (entre os links de `Transborde` e `Cursos`).
- Rotas do Site: `src/App.tsx` — adicionar rota `'/site/onde-estamos'` próximo às outras rotas do Site.
- Nova página: `src/pages/Site/OndeEstamosPage.tsx`.
- Ícone: `src/components/Common/OndeEstamosIcon.tsx` (componente React que herda `currentColor`).

## Implementação
1. Criar `src/components/Common/OndeEstamosIcon.tsx`
   - Converter `public/onde-estamos.svg` em componente React usando máscara CSS (`mask`/`-webkit-mask`) apontando para `'/onde-estamos.svg'` e `background-color: currentColor` para herdar tema/cor.
   - Alternativamente inline SVG com `stroke="currentColor"`/`fill="none"`, se o arquivo for traçado; mas manteremos a máscara para consistência com ícones recentes (Agenda Pastoral e Transborde).
2. Criar `src/pages/Site/OndeEstamosPage.tsx`
   - Componente funcional simples com título "Onde estamos" e placeholder (“Conteúdo em breve”).
3. Registrar rota
   - Em `src/App.tsx`, importar a página e adicionar `<Route path="/site/onde-estamos" element={<OndeEstamosPage />} />` próximo a `Transborde` e antes de `Cursos`.
4. Atualizar menu Desktop
   - Inserir no `siteMenuItems`: `{ to: '/site/onde-estamos', label: 'Onde estamos', Icon: OndeEstamosIcon }` entre `Transborde` e `Cursos`.
5. Atualizar menu Mobile
   - Adicionar `<Link to="/site/onde-estamos">` entre os blocos de `Transborde` e `Cursos`, usando `<OndeEstamosIcon className="h-5 w-5" />` e padrões de classes atuais; manter animação parallax já configurada.

## Verificação
- Executar em dev/preview e validar:
  - Menu Desktop e Mobile exibem “Onde estamos” entre “Transborde” e “Cursos”.
  - Ícone acompanha tema/cor principal (currentColor) em estados ativo/hover.
  - Navegação para `'/site/onde-estamos'` funciona e renderiza placeholder.

## Observações
- Se desejar um ajuste de tamanho/alinhamento do ícone, replico overrides locais (como `h-[22px] w-[22px]`) para consistência visual.
- O arquivo `public/onde-estamos.svg` foi verificado e está disponível.