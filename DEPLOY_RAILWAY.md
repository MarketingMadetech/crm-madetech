# 🚀 Deploy CRM Madetech no Railway

## Deploy Automático via GitHub

### 1. Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `crm-madetech`
3. Deixe como **público** ou **privado**
4. NÃO marque "Add a README"
5. Clique em **"Create repository"**

### 2. Copiar comandos que aparecem na tela

O GitHub vai mostrar comandos assim:

```bash
git remote add origin https://github.com/SEU_USUARIO/crm-madetech.git
git branch -M main
git push -u origin main
```

**GUARDE ESSES COMANDOS!**

### 3. No Railway

1. Acesse: https://railway.app
2. Clique em **"New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Selecione **"crm-madetech"**
5. Railway vai detectar automaticamente!

### 4. Configurar variáveis de ambiente

No Railway, vá em **"Variables"** e adicione:

```
PORT=3001
NODE_ENV=production
```

### 5. Pronto! 🎉

Seu CRM estará online em:
`https://seu-projeto.up.railway.app`

---

## Como fazer push do código

Abra um novo PowerShell nesta pasta e execute:

```powershell
# Verificar se Git está instalado (fechar e abrir novo terminal)
git --version

# Configurar Git (primeira vez)
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Inicializar repositório
git init
git add .
git commit -m "Deploy inicial CRM Madetech"

# Conectar com GitHub (usar os comandos que você copiou)
git remote add origin https://github.com/SEU_USUARIO/crm-madetech.git
git branch -M main
git push -u origin main
```

Depois disso, o Railway fará deploy automático! ✨
