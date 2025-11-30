## Objetivo
- Criar a página `Transborde` na área do Site e adicioná-la ao menu principal entre `Ministérios` e `Cursos`.

## Onde Atualizar
- Menu Desktop: `src/components/Site/SiteHeader.tsx:142–152` (array `siteMenuItems`)
- Menu Mobile: `src/components/Site/SiteHeader.tsx:383–404` (links entre Ministérios e Cursos)
- Rotas do Site: `src/App.tsx` próximo às rotas de `Ministérios` e `Cursos` (`App.tsx:170–171` e `App.tsx:238–239`)
- Nova página: `src/pages/Site/TransbordePage.tsx`

## Implementação
1. Criar `src/pages/Site/TransbordePage.tsx`
   - Componente funcional simples com título `Transborde` e placeholder (“Em breve”).
2. Registrar rota
   - Adicionar `<Route path="/site/transborde" element={<TransbordePage />} />` em `src/App.tsx`, posicionando após `'/site/ministerios'` e antes de `'/site/cursos'`.
3. Atualizar menu Desktop
   - Inserir item em `siteMenuItems` (em `SiteHeader.tsx:142–152`): `{ to: '/site/transborde', label: 'Transborde', Icon: Droplet }`.
   - Importar `Droplet` de `lucide-react` no topo de `SiteHeader.tsx` (já usamos ícones dessa biblioteca no arquivo).
4. Atualizar menu Mobile
   - Adicionar `Link` para `'/site/transborde'` entre os blocos de `Ministérios` e `Cursos` em `SiteHeader.tsx:383–404`, usando o mesmo padrão visual dos demais.

## Considerações de Ícone
- Usar o ícone `Droplet` de `lucide-react` como placeholder para `Transborde`. Se desejar um ícone personalizado, podemos trocar depois.

## Verificação
- Executar o projeto, acessar `'/site/transborde'` e validar:
  - Menu Desktop e Mobile exibem `Transborde` entre `Ministérios` e `Cursos`.
  - Navegação para `Transborde` funciona e renderiza o placeholder.
