## O que você pode fazer agora (no chat)

* Coloque um bloco no início das suas mensagens intitulado `Project Rules` ou `App Guardrails`.

* Esse bloco funciona como memória de alto nível: eu lerei e seguirei sempre que estiver presente.

* Mantenha itens curtos e acionáveis: invariantes, nomes, IDs, comportamentos que **não podem mudar**.

## Formato sugerido do bloco

* Nome do projeto: FonteNews

* Ambientes: Produção, Homologação (se houver)

* Invariantes: “Manter modo manutenção com header image sobre o overlay”, “Não expor segredos”, “Firebase Hosting: fontenews-877a3”

* URLs/IDs públicos: Hosting URL, Project ID, Storage bucket (apenas públicos)

* UX obrigatória: “Logo sempre acima do título”, “Z-index do header image ≥ overlay”

* Regras: “Qualquer mudança visual deve manter legibilidade”, “Redirecionamento externo só quando ativo”

## Exemplo pronto para colar

```
<Project Rules>
Nome do projeto: FonteNews
Ambiente: Produção
Hosting: https://fontenews-877a3.web.app
Invariantes:
- Header image sempre renderizado para todos (overlay + página)
- Z-index: header image 9999; overlay 9998; blur 9997
- Não remover título/descrição do modo manutenção
- Não expor segredos; apenas configs públicas do Firebase
- Redirecionamento externo só se `useRedirect` estiver verdadeiro
</Project Rules>
```

## Opcional: guardrails no código (após sua confirmação)

* Criar `src/config/appGuardrails.ts` exportando constantes e invariantes (sem comentários) para uso interno.

* Adicionar checagens leves no `AppProvider`/`MaintenanceProvider` para validar invariantes em tempo de execução e emitir logs quando algo violar as regras.

* Centralizar z-index e flags de renderização em constantes para evitar divergências entre `MaintenancePage` e `MaintenanceOverlay`.

## Opcional: testes de proteção

* Adicionar um teste simples que falha se invariantes críticos forem quebrados (ex.: header image não renderiza quando `headerImageUrl` existe).

* Rodar em CI/local para prevenir regressões.

## Próximo passo

* Me confirme se deseja que eu implemente a camada opcional no código e testes.

* Enquanto isso, cole o bloco `Project Rules` no início de suas próximas mensagens; eu seguirei como fonte de verdade.

