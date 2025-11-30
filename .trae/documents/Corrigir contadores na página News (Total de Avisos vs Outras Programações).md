## Causa
- O campo `type` vem das taxonomias com nomes possivelmente capitalizados/variantes (ex.: `Aviso`, `AVISO`), enquanto o contador compara `=== 'aviso'` (case-sensitive).
- Resultado: itens do tipo "Aviso" não passam na comparação e são contabilizados em "Outras Programações".

## Alteração Proposta
- Em `src/pages/Home.tsx` na seção dos contadores (por volta de `404–415`):
  - Normalizar `type` antes de comparar: `const t = (a.type || '').trim().toLowerCase()`.
  - "Total de Avisos": `filter(a => t === 'aviso')`.
  - "Outras Programações": `filter(a => t !== 'aviso')`.
- Não alterar dados persistidos; apenas lógica de contagem no cliente.

## Validação
- Criar/adaptar um item com `type` = `Aviso` (capitalizado) e outro com `type` != `Aviso`.
- Verificar que o primeiro entra em "Total de Avisos" e o segundo em "Outras Programações".
- Build e deploy após confirmação.

Posso aplicar essa correção agora?