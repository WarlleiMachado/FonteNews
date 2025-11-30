## Objetivo
- Substituir o ícone atual de “Transborde” (Droplet de `lucide-react`) por `Transborde-icon-01.svg` (em `public`) e adaptá-lo para seguir a cor do tema e da cor principal, como os demais ícones do Site.

## Estratégia Técnica
- Criar um componente React `TransbordeIcon` que renderiza o SVG inline com `fill="currentColor"` e `stroke="currentColor"` (quando aplicável), garantindo que o ícone herde a cor do texto/tema automaticamente.
- Padronizar tamanhos conforme os ícones de menu existentes, usando classes Tailwind (`h-5 w-5` ou ajustes locais, se necessário).

## Arquivos a Atualizar
- Novo: `src/components/Common/TransbordeIcon.tsx` (componente do ícone)
- Menu Desktop: `src/components/Site/SiteHeader.tsx:142–152` (array `siteMenuItems`) — trocar `Droplet` por `TransbordeIcon` no item `'/site/transborde'`
- Menu Mobile: `src/components/Site/SiteHeader.tsx:395–405` — trocar `<Droplet />` por `<TransbordeIcon />`
- Importações: remover `Droplet` de `lucide-react` em `SiteHeader.tsx:3` e importar `TransbordeIcon`.

## Passos de Implementação
1. Converter `public/Transborde-icon-01.svg` para componente React
   - Copiar o conteúdo do SVG para `TransbordeIcon.tsx`.
   - Remover cores fixas e substituir por `fill="currentColor"`/`stroke="currentColor"`.
   - Exportar `TransbordeIcon` como `React.FC<React.SVGProps<SVGSVGElement>>` semelhante ao `MinistryIcon`.
2. Integrar no menu Desktop
   - Em `siteMenuItems`, substituir `{ Icon: Droplet }` por `{ Icon: TransbordeIcon }` no item `Transborde`.
   - Ajustar classes de tamanho se necessário para alinhamento visual (seguir padrão: `h-5 w-5`).
3. Integrar no menu Mobile
   - Trocar `<Droplet size={22} />` por `<TransbordeIcon className="h-5 w-5" />` no bloco “Transborde”.
4. Limpeza
   - Remover `Droplet` do import de `lucide-react`.

## Verificação
- Executar o servidor e validar:
  - Ícone “Transborde” muda de cor conforme o tema (claro/escuro) e cor principal.
  - Ícone aparece corretamente em desktop e mobile, posicionado entre “Ministérios” e “Cursos”.
  - A navegação para `'/site/transborde'` permanece funcional.

## Observações
- Se o SVG tiver traços/gradientes complexos, manter somente atributos compatíveis com `currentColor` para garantir adaptação ao tema.
- Podemos ajustar overrides locais (como feito para outros ícones) caso seja necessário refinar o tamanho/alinhamento visual.