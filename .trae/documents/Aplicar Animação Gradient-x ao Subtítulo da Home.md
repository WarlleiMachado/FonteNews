## Local do Texto
- O subtítulo “Nome da Igreja (Subtítulo da Home)” é renderizado em `src/pages/Home.tsx` na linha `316–324`: `<p className="text-xl md:text-2xl font-semibold text-white opacity-95 mb-8">{settings.churchName}</p>`.
- O valor vem de `settings.churchName` (Firestore em `settings/church-settings`), carregado pelo `AppContext`.

## Estratégia de Estilo
- Usar Tailwind para um gradiente animado no texto, com `bg-clip-text` + `text-transparent` e keyframes `gradient-x`.
- Cores de exemplo: `from-purple-400 via-pink-500 to-red-500` (podemos ajustar depois).

## Alterações Técnicas
1. Tailwind Config (`tailwind.config.js`)
   - Em `theme.extend`, adicionar:
     - `keyframes.gradient-x`: 0%/100% `background-position: 0% 50%`; 50% `background-position: 100% 50%`.
     - `animation['gradient-x']`: `gradient-x 6s ease infinite`.
2. CSS utilitário (opcional, se preferir)
   - Em `src/index.css`, adicionar `@keyframes gradient-x` e `.animate-gradient-x { animation: gradient-x 6s ease infinite; background-size: 200% 200%; }`.
3. Aplicar no JSX (`src/pages/Home.tsx`)
   - Substituir classes do `<p>` por:
     - `bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-gradient-x tracking-tight font-bold`
     - Manter responsivos: `text-5xl md:text-7xl lg:text-8xl` (ou adequar à hierarquia atual).
   - Garantir `background-size: 200% 200%` (via utilitário CSS ou classe JIT `bg-[length:200%_200%]`).

## Validação
- Verificar que o texto apenas muda de estilo (sem alterar conteúdo e origem em Firestore).
- Checar em desktop/mobile se o gradiente e tamanho estão corretos.
- Build e deploy após confirmação.

## Observações
- Sem impacto em z-index ou lógica; alteração puramente visual.
- Podemos ajustar paleta/velocidade após ver em produção.

Confirma que devo aplicar essas alterações agora?