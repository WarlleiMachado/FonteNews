## O que mudar
- Alterar o rótulo do item de menu “Fonte News” para “Programações” no cabeçalho do Site.

## Onde editar
- `src/components/Site/SiteHeader.tsx`
  - Linha ~162: entrada do array de navegação `{ to: '/', label: 'Fonte News', Icon: NewsIcon }` → `label: 'Programações'`.
  - Linha ~431: `<span>Fonte News</span>` (exibição direta do rótulo) → `Programações`.

## Validação
- Build e checar no Site que o menu mostra “Programações” e o link continua apontando para `/`.

Posso aplicar essa alteração agora?