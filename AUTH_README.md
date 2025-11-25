# 🔐 Sistema de Autenticação - CRM Madetech

Sistema completo de autenticação com login, controle de acesso e gerenciamento de usuários.

## 📋 Instalação

### 1. Instalar Dependências

No diretório `backend`:

```bash
npm install
```

Isso instalará as novas dependências:
- `bcrypt` - Para criptografia de senhas
- `jsonwebtoken` - Para geração de tokens JWT

### 2. Inicializar Sistema de Autenticação

```bash
node init-auth.js
```

Isso criará:
- Tabela de usuários no banco de dados
- Usuário admin padrão

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha padrão após o primeiro login!

### 3. Iniciar o Servidor

```bash
npm start
```

## 🚀 Como Usar

### Acessar o Sistema

1. Abra o navegador em `http://localhost:3000` (ou seu domínio)
2. Você será redirecionado para a tela de login
3. Entre com as credenciais padrão
4. Após o login, você terá acesso ao CRM

### Gerenciar Usuários

Use o script interativo para gerenciar usuários:

```bash
node scripts/manage-users.js
```

**Opções disponíveis:**
1. Listar usuários
2. Criar novo usuário
3. Alterar senha
4. Ativar/Desativar usuário

## 👥 Tipos de Usuário

### Usuário (user)
- Acesso completo ao CRM
- Pode criar, editar e visualizar negócios
- Pode enviar emails
- Pode ver dashboard e relatórios

### Administrador (admin)
- Todos os acessos de usuário
- Pode gerenciar outros usuários
- Acesso às rotas administrativas

## 🔑 Funcionalidades de Autenticação

### Tela de Login
- Campo de usuário e senha
- Opção "Lembrar-me" (salva username)
- Botão para mostrar/ocultar senha
- Mensagens de erro amigáveis
- Design responsivo e moderno

### Segurança
- Senhas criptografadas com bcrypt (10 rounds)
- Tokens JWT com expiração de 24 horas
- Proteção de todas as rotas da API
- Logout automático em caso de token inválido
- Sessão mantida no localStorage

### Controle de Acesso
- Todas as rotas do CRM protegidas
- Verificação automática de autenticação
- Redirecionamento para login se não autenticado
- Informações do usuário no header

## 📂 Estrutura de Arquivos

```
backend/
├── auth.js                    # Rotas e lógica de autenticação
├── init-auth.js              # Script de inicialização
├── server.js                 # Servidor com rotas protegidas
└── scripts/
    └── manage-users.js       # Gerenciador de usuários

frontend/
├── login.html                # Tela de login
└── src/
    ├── auth.js               # Utilitários de autenticação React
    ├── App.jsx               # App com verificação de auth
    └── components/
        └── Layout.jsx        # Layout com menu de usuário
```

## 🗄️ Banco de Dados

### Tabela `usuarios`

```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'user',
    ativo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso DATETIME
);
```

## 🔧 Configuração

### JWT Secret
Por padrão, usa: `madetech-crm-secret-key-2025`

Em produção, configure como variável de ambiente:
```bash
export JWT_SECRET="sua-chave-secreta-super-segura"
```

### Tempo de Expiração do Token
Padrão: 24 horas

Altere em `auth.js`:
```javascript
const TOKEN_EXPIRATION = '24h'; // ou '7d', '1h', etc
```

## 📱 Endpoints da API

### Autenticação

#### POST /api/auth/login
Login de usuário
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### GET /api/auth/verify
Verificar se token é válido (requer token no header)

#### POST /api/auth/logout
Fazer logout (requer token no header)

### Gerenciamento de Usuários (apenas admin)

#### GET /api/auth/users
Listar todos os usuários

#### POST /api/auth/users
Criar novo usuário
```json
{
  "username": "joao",
  "password": "senha123",
  "nome": "João Silva",
  "email": "joao@email.com",
  "role": "user"
}
```

#### PUT /api/auth/users/:id
Atualizar usuário

#### DELETE /api/auth/users/:id
Deletar usuário

#### PUT /api/auth/change-password
Alterar própria senha
```json
{
  "currentPassword": "senhaAtual",
  "newPassword": "senhaNova"
}
```

## 🛡️ Boas Práticas

1. **Sempre altere a senha padrão do admin**
2. **Use senhas fortes** (mínimo 6 caracteres)
3. **Desative usuários** em vez de deletá-los
4. **Revise regularmente** os usuários ativos
5. **Em produção**, use HTTPS sempre
6. **Backup regular** do banco de dados

## 🐛 Troubleshooting

### "Token inválido ou expirado"
- Faça login novamente
- Verifique se o servidor está rodando
- Limpe o localStorage do navegador

### "Usuário ou senha inválidos"
- Verifique se o usuário está ativo
- Confirme se a senha está correta
- Use o script manage-users.js para resetar senha

### "Erro ao conectar com o servidor"
- Verifique se o backend está rodando na porta 3001
- Confirme as configurações de CORS
- Verifique o console do navegador para erros

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de TI.

---

**Desenvolvido para Madetech** 🔧
