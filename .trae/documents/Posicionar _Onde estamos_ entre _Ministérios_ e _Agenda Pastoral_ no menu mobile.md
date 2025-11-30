## Objetivo
- No menu mobile do Site, colocar o item "Onde estamos" exatamente entre "Ministérios" e "Agenda Pastoral".

## Situação atual
- Em `src/components/Site/SiteHeader.tsx`, o bloco `<Link to="/site/onde-estamos">` está acima de "Bíblia" e "Ministérios", e há dois blocos de "Agenda Pastoral" (um antes e outro depois).

## Alterações pontuais
1. Localizar o bloco do item "Ministérios" (mobile): `<Link to="/site/ministerios">`.
2. Localizar o bloco do item "Agenda Pastoral" (mobile) que deve ficar por último.
3. Mover o bloco `<Link to="/site/onde-estamos">` para logo após "Ministérios" e antes de "Agenda Pastoral".
4. Manter animações (`motion.div`) e classes de estilo iguais às dos demais itens.
5. Garantir que exista apenas um bloco de "Agenda Pastoral" no menu.

## Validação
- Rebuild e preview local.
- Validar a ordem (apenas essa alteração) em `https://fontenews-877a3.web.app/site` (portrait) com hard refresh.

Confirma que posso aplicar essa mudança específica agora?