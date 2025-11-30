# FonteNews — Notas de Release (Android)

Versão: 1.1 (code 2)
Data: ${DATE}

Principais mudanças
- Ajuste de login Google no Android usando redirect (Firebase Auth), sem alterar comportamento web.
- Build e sincronização dos assets web mais recentes.
- Configuração e assinatura de release com keystore local.

Observações
- Se ativar Assinatura pela Play Store, adicione os certificados SHA‑1/SHA‑256 do “App signing” no Firebase para o Google Login funcionar em produção.
- O app continua suportando login por e-mail/senha e Google.

Checklist interno
- [x] `versionCode`/`versionName` atualizados em `android/app/build.gradle`.
- [x] `app-release.aab` gerado.
- [x] `app-release.apk` gerado para testes locais.

Arquivos relevantes
- `android/app/build.gradle`
- `android/keystore.properties`
- `src/contexts/AuthContext.tsx`