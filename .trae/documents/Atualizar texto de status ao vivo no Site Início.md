## Onde alterar
- `src/pages/Site/SiteHome.tsx:483` — substituir "Aguardando a próxima programação..." por "Fonte Live...".
- `src/components/Common/YouTubeLiveIndicator.tsx:224` — atualizar o texto de status offline no ternário: de "Aguardando a próxima programação…" para "Fonte Live...".

## Motivo
- Garantir consistência: o título/área da transmissão ao vivo e o indicador comum exibem o mesmo texto.

## Como validar
- Executar build e acessar a Home do Site para verificar que o novo texto aparece quando não há transmissão ativa.

Posso aplicar essas alterações agora?