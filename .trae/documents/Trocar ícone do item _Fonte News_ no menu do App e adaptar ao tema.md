## Alterações
- Criar um componente `FonteNewsCamIcon` que renderiza o SVG `public/Fonte-News-Cam.svg` usando CSS mask para seguir `currentColor` (compatível com tema claro/escuro).
- Substituir o ícone do item de menu “Fonte News” no desktop (`src/components/Layout/Header.tsx` – array `desktopMenuItems`) para usar `FonteNewsCamIcon`.
- Substituir o ícone e rótulo no menu mobile do App (em `Header.tsx`) para usar `FonteNewsCamIcon` e texto “Fonte News”.

## Vantagens
- O ícone adapta automaticamente a cor conforme o estado do tema (via `currentColor`).
- Mantém dimensões via classes utilitárias existentes (`h-*/w-*`).

## Deploy
- Gerar build e publicar no Firebase Hosting.

Posso aplicar agora e fazer o deploy?