# Guia do Administrador - FonteNews

## Sistema de Autenticação Implementado

O sistema FonteNews agora utiliza **Firebase Authentication** para login seguro com as seguintes opções:

### 🔐 Métodos de Login Disponíveis

1. **Login com Google** - Autenticação via conta Google
2. **Login com E-mail/Senha** - Autenticação tradicional

### 👥 Administradores Autorizados

Os seguintes e-mails estão configurados como administradores do sistema:

- `secretaria.adfdevidalaranjeiras@gmail.com`
- `fontedevidalaranjeiras@gmail.com`

### 🚀 Como Acessar o Sistema

#### Para Administradores (Primeira Vez):

1. **Acesse**: https://news.fontedevida.org
2. **Escolha uma opção**:
   
   **Opção A - Login com Google:**
   - Clique em "Continuar com Google"
   - Use uma das contas de e-mail autorizadas acima
   - O sistema reconhecerá automaticamente sua autorização
   
   **Opção B - Login com E-mail/Senha:**
   - Clique em "Criar conta" (se for a primeira vez)
   - Use um dos e-mails autorizados acima
   - Crie uma senha segura
   - O sistema reconhecerá automaticamente sua autorização

### 🔄 Fluxo de Autorização para Novos Usuários

Quando um usuário não autorizado tenta acessar o sistema:

1. **Tentativa de Login**: Usuário tenta fazer login
2. **Verificação**: Sistema verifica se o e-mail está na lista de autorizados
3. **Redirecionamento**: Se não autorizado, é direcionado para "Solicitar Acesso"
4. **Formulário**: Usuário preenche dados (nome, e-mail, telefone, ministério)
5. **Notificação**: Solicitação é enviada para os administradores
6. **Aprovação**: Administradores podem aprovar/rejeitar no painel admin

### 🛠️ Funcionalidades do Sistema

- **Dashboard**: Visão geral das atividades
- **Anúncios**: Criar e gerenciar comunicados
- **Cultos**: Programação de cultos e eventos
- **Roteiros**: Scripts para apresentações
- **Agenda**: Calendário de eventos
- **Administração**: Gerenciar usuários e solicitações

### 🔧 URLs Importantes

- **Aplicação Principal**: https://news.fontedevida.org
- **Console Firebase**: https://console.firebase.google.com/project/fontenews-877a3/overview
- **Servidor Local (Dev)**: http://localhost:5173/

### 📱 Recursos de Segurança

- ✅ Autenticação Firebase (Google + E-mail/Senha)
- ✅ Lista de usuários autorizados
- ✅ Sistema de solicitação de acesso
- ✅ Controle de status (ativo/bloqueado/inativo)
- ✅ Proteção de rotas administrativas
- ✅ Monitoramento de usuários online

### 🆘 Suporte

Para questões técnicas ou problemas de acesso:
- E-mail: fontedevidalaranjeiras@gmail.com
- Verificar console Firebase para logs de autenticação

---

**Nota**: Este sistema mantém total compatibilidade com o fluxo de autorização existente, apenas substituindo a autenticação simulada por autenticação real do Firebase.