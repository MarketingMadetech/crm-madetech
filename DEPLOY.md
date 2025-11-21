# 🚀 GUIA DE DEPLOY - CRM MADETECH

## 📋 ÍNDICE
1. [Preparação](#preparação)
2. [Opções de Hospedagem](#opções-de-hospedagem)
3. [Deploy no Railway](#deploy-no-railway)
4. [Deploy na Vercel](#deploy-na-vercel)
5. [Checklist Final](#checklist-final)

---

## Preparação

### 1.1 Clonar Repositório GitHub (se necessário)

```powershell
# Criar repositório local
cd "C:\Users\madet\OneDrive\Desktop\Marketing Madetech\Planilhas CRM\CRM MArketing"
git init
git add .
git commit -m "CRM completo - versão funcional"
git branch -M main
```

### 1.2 Gerar Build de Produção

```powershell
# Frontend
cd frontend
npm run build
# Resultado: pasta 'dist/' com arquivos otimizados

# Backend - verificar npm start
cd ../backend
npm start
```

---

## Opções de Hospedagem

### Comparação de Plataformas

| Plataforma | Frontend | Backend | Banco | Preço | Facilidade |
|-----------|----------|---------|-------|-------|-----------|
| **Railway** ⭐ | ✅ | ✅ | ✅ | Grátis-$5/mês | ⭐⭐⭐⭐⭐ |
| **Vercel + Railway** | ✅ | ✅ | ✅ | Grátis | ⭐⭐⭐⭐ |
| **Render** | ✅ | ✅ | ✅ | Grátis | ⭐⭐⭐⭐ |
| **Heroku** | ✅ | ✅ | ✅ | Pago | ⭐⭐⭐ |
| **VPS (HostGator)** | ✅ | ✅ | ✅ | ~R$50/mês | ⭐⭐ |

---

## 🚂 Deploy no Railway (RECOMENDADO)

### Passo 1: Criar Conta no Railway
1. Acesse: https://railway.app
2. Clique em "Sign Up"
3. Conecte com GitHub (ou crie conta)

### Passo 2: Preparar Repositório GitHub

```powershell
# 1. Criar repositório no GitHub
#    Acesse: https://github.com/new

# 2. Push do código
cd "C:\Users\madet\OneDrive\Desktop\Marketing Madetech\Planilhas CRM\CRM MArketing"
git remote add origin https://github.com/SEU_USUARIO/crm-madetech.git
git push -u origin main
```

### Passo 3: Configurar Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Escolha o repositório `crm-madetech`

### Passo 4: Configurar Variáveis de Ambiente

No dashboard do Railway, em "Variables":

**Para o Backend:**
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.railway.app
DATABASE_URL=sqlite:./crm.db
```

**Para o Frontend (vite.config.js):**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://seu-backend.railway.app',
        changeOrigin: true
      }
    }
  }
})
```

### Passo 5: Deploy Automático

Railway fará deploy automático a cada push no GitHub:

```powershell
# Fazer mudança e enviar
git add .
git commit -m "Atualização para produção"
git push origin main
```

---

## 🔗 Deploy na Vercel (Apenas Frontend)

### Passo 1: Conectar GitHub à Vercel
1. Acesse: https://vercel.com
2. Clique em "Sign Up"
3. Conecte com GitHub

### Passo 2: Importar Projeto
1. Clique em "New Project"
2. Selecione repositório `crm-madetech`
3. Vercel detecta Vite automaticamente

### Passo 3: Configurar Build
- **Build Command:** `cd frontend && npm run build`
- **Output Directory:** `frontend/dist`
- **Environment Variables:**
  ```
  VITE_API_URL=https://seu-backend.railway.app
  ```

### Passo 4: Deploy
Vercel fará deploy automático após cada push no GitHub

---

## 📦 Estrutura para Deploy

Arquivo `.gitignore` (verificar se existe):
```
node_modules/
dist/
.env.local
*.log
.DS_Store
```

Arquivo `Procfile` (para Railway, criar na raiz):
```
web: cd backend && npm start
```

Arquivo `package.json` (raiz, criar se não existir):
```json
{
  "name": "crm-madetech",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm -C backend start\" \"npm -C frontend run dev\"",
    "build": "npm -C frontend run build",
    "start": "npm -C backend start"
  }
}
```

---

## 🔐 Configurações de Segurança

### 1. Variáveis de Ambiente
Criar arquivo `.env` (não versionar):
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://seu-dominio.railway.app
DATABASE_PATH=./crm.db
```

### 2. CORS Atualizado (backend/server.js)
```javascript
app.use(cors({
  origin: [
    'https://seu-frontend.vercel.app',
    'https://seu-backend.railway.app',
    'http://localhost:5173' // desenvolvimento
  ],
  credentials: true
}))
```

### 3. Conexão Segura (HTTPS)
- Railway: automático ✅
- Vercel: automático ✅
- Render: automático ✅

---

## 📊 Banco de Dados em Produção

### Opção 1: SQLite (Atual - Não recomendado para produção)
```
⚠️ Problemas:
- Sem backup automático
- Sem acesso remoto
- Sem replicação
```

### Opção 2: PostgreSQL Gratuito (Recomendado)

**Usar Supabase (PostgreSQL grátis):**

1. Acesse: https://supabase.com
2. Sign Up
3. Criar novo projeto
4. Copiar connection string
5. Atualizar código para usar PostgreSQL

**Migração no Railway:**
1. Railway oferece PostgreSQL grátis
2. Ir em "Database" → "Create PostgreSQL"
3. Automático!

---

## 🚀 Checklist de Deploy

- [ ] Repositório GitHub criado
- [ ] Código commitado e pusheado
- [ ] Variáveis de ambiente configuradas
- [ ] Build de produção testado localmente
- [ ] CORS configurado corretamente
- [ ] Banco de dados acessível
- [ ] Frontend se conecta ao backend
- [ ] Todas as funcionalidades testadas
- [ ] Dark mode funciona
- [ ] Exportação Excel funciona
- [ ] Notificações funcionam
- [ ] WhatsApp/Email integrados funcionam
- [ ] Performance aceitável
- [ ] SSL/HTTPS ativo
- [ ] Domínio customizado (opcional)

---

## 🌐 URLs Finais

Após deploy:

```
Frontend: https://seu-crm.railway.app
Backend: https://seu-api.railway.app
Ou (se Vercel + Railway):
Frontend: https://seu-crm.vercel.app
Backend: https://seu-api.railway.app
```

---

## 📞 Suporte & Troubleshooting

### Erro: "CORS error"
```javascript
// Verificar origin no backend
console.log(req.origin)
// Adicionar ao whitelist
```

### Erro: "Cannot find module"
```powershell
# Reinstalar dependências
npm install
```

### Banco não conecta
```powershell
# Verificar DATABASE_URL
echo $env:DATABASE_URL
```

### Build falha
```powershell
# Testar build localmente
npm run build
```

---

## 📚 Referências

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Render Deploy Guide](https://render.com/docs)

---

**Tempo estimado de deploy: 5-10 minutos** ⏱️

Sucesso! 🚀
