## O que será alterado
- Remover o efeito de gradiente do subtítulo "Nome da Igreja" e voltar para texto branco.
- Aplicar o efeito `gradient-x` no título "Fonte News" com cores configuráveis via Configurações.

## Onde editar
- `src/pages/Home.tsx`:
  - Subtítulo em `322–324`: restaurar classes para `text-white` (sem gradiente).
  - Título em `316–318`: aplicar `bg-clip-text text-transparent bg-gradient-to-r animate-gradient-x` usando cores vindas de `settings`.
- `src/components/Admin/SettingsTab.tsx`:
  - Adicionar controles na seção Identidade Visual para configurar as cores do gradiente do título: `from`, `via`, `to` e um toggle `enabled`.
- `src/types/index.ts`:
  - Estender `ChurchSettings` com um bloco `titleGradient: { enabled: boolean; from: string; via: string; to: string; durationSec?: number }`.
- `src/contexts/AppContext.tsx`:
  - Incluir valores padrão para `titleGradient` e carregar do Firestore.
- `src/services/firestoreService.ts`:
  - Garantir salvar/ler `titleGradient` em `settings/church-settings`.

## Comportamento
- Se `titleGradient.enabled` for true, o título usa gradiente com as cores selecionadas.
- Se for false ou sem configuração, o título permanece em `text-white`.
- Mantém a animação `gradient-x` existente no Tailwind (`animation: gradient-x 6s ease infinite`).

## Validação
- Build sem erros e verificação visual na Home.
- Ajuste de cores no painel de Configurações com preview imediato no título.

Confirma que devo aplicar essas alterações agora?