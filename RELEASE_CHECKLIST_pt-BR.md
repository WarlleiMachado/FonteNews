# Checklist de Publicação — FonteNews (Android)

Itens obrigatórios
- Preparar artefato: `android/app/build/outputs/bundle/release/app-release.aab`.
- Atualizar `versionCode` e `versionName` em `android/app/build.gradle`.
- Conferir pacote: `applicationId` = `com.fontenews.app`.
- Política de Privacidade: publicar URL válida (ex.: `https://news.fontedevida.org/politica-privacidade`).
- Classificação de conteúdo: preencher questionário na Play Console.
- Alvo de API: `targetSdkVersion` = 35 (conforme `variables.gradle`).

Google Sign‑In (Firebase)
- Antes de produção: adicionar SHA‑1/SHA‑256 do keystore de upload no Firebase (Projeto: `fontenews-877a3`).
- Após ativar “Assinatura pela Play Store”: adicionar também os SHA‑1/SHA‑256 do “App signing certificate”.
- Domínios autorizados: `fontenews-877a3.firebaseapp.com`, `fontenews-877a3.web.app`, `news.fontedevida.org`.

Testes recomendados
- Login por e-mail/senha e por Google (Android 10+).
- Fluxo de logout e re-login.
- Navegação entre páginas protegidas após autenticação.
- Verificar que não abre navegador externo indevido durante login.

Pós-publicação
- Monitorar crashes/ANRs (Play Console > Android vitals).
- Acompanhar autenticações no Firebase Auth e registros de erro.
- Planejar próxima versão: incrementar `versionCode` e atualizar `versionName`.