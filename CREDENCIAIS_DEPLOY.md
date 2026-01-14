# 🔐 Credenciais e Deploy - CRM Madetech

## ✅ PROBLEMA RESOLVIDO

O sistema agora **cria automaticamente os usuários** quando o servidor inicia pela primeira vez, resolvendo o problema do banco de dados não ser enviado para o deploy.

## 📋 Usuários Criados Automaticamente

Quando o backend iniciar pela primeira vez (no deploy ou localmente), os seguintes usuários serão criados automaticamente:

### 1. **Administrador**
- **Username:** `admin`
- **Senha:** `admin123`
- **Perfil:** Administrador
- **Email:** admin@madetech.com

### 2. **Reinaldo**
- **Username:** `Reinaldo`
- **Senha:** `RCPSP01`
- **Perfil:** Usuário
- **Email:** reinaldo@crm.com

### 3. **Thiago Costa**
- **Username:** `thiago.costa`
- **Senha:** `thiago123`
- **Perfil:** Usuário
- **Email:** thiago@madetech.com

## 🚀 Como Funciona o Deploy

### 1. Código no GitHub
✅ **Commit mais recente:** `4dfd6ec` - "feat: Adiciona inicialização automática de usuários no deploy"

### 2. O que acontece no deploy:
1. O servidor inicia
2. O arquivo `init-usuarios.js` é executado automaticamente
3. Se não existirem usuários no banco, os 3 usuários acima são criados
4. Se já existirem usuários, nada é feito (mantém os dados existentes)

### 3. Deploy em Railway/Render/Heroku:
Basta conectar o repositório GitHub e o deploy será automático. Os usuários serão criados no primeiro start.

## 🔧 Testar Localmente

Para testar se está funcionando:

```powershell
# 1. Deletar banco de dados local (para simular deploy limpo)
cd "C:\Users\madet\OneDrive\Desktop\Marketing Madetech\Planilhas CRM\CRM MArketing\backend"
Remove-Item crm.db -Force

# 2. Iniciar o servidor
npm start

# 3. Verificar logs - deve mostrar:
# 🔐 Inicializando usuários do sistema...
# ✅ Tabela de usuários verificada
# 📝 Criando usuários padrão...
# ✅ Usuário criado: admin (admin)
# ✅ Usuário criado: Reinaldo (user)
# ✅ Usuário criado: thiago.costa (user)
```

## 📝 Arquivos Modificados

1. **[backend/init-usuarios.js](backend/init-usuarios.js)** - Novo arquivo com lógica de inicialização
2. **[backend/server.js](backend/server.js)** - Modificado para chamar `initUsuarios()` ao iniciar
3. **[backend/atualizar-reinaldo.js](backend/atualizar-reinaldo.js)** - Script auxiliar para reset de senha
4. **[backend/verificar-senha-reinaldo.js](backend/verificar-senha-reinaldo.js)** - Script de debug

## ⚠️ IMPORTANTE

- As senhas estão no código APENAS para o primeiro deploy
- **Altere todas as senhas** após o primeiro login em produção
- Use o script `manage-users.js` para gerenciar usuários e senhas

## 🔄 Próximos Passos

1. ✅ Código já está no GitHub
2. ⏭️ Faça o deploy em sua plataforma (Railway, Render, etc.)
3. ⏭️ Acesse a URL do deploy e faça login com as credenciais acima
4. ⚠️ **Altere as senhas padrão imediatamente**

---

**Última atualização:** 14/01/2026  
**Commit:** 4dfd6ec
