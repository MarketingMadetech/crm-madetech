# 📧 Configuração de E-mail

## Passo 1: Editar a senha

Abra o arquivo `backend/config/email.js` e substitua:

```javascript
pass: process.env.SMTP_PASS || 'COLOQUE_A_SENHA_AQUI'
```

Por:

```javascript
pass: 'SUA_SENHA_REAL_AQUI'
```

## Passo 2: Reinstalar dependências

No terminal do backend:
```bash
npm install
```

## Passo 3: Reiniciar o backend

```bash
npm start
```

Se aparecer "✅ Servidor de e-mail pronto", está configurado!

## ⚠️ Segurança

**NUNCA** compartilhe o arquivo `config/email.js` com a senha real!

Para produção, use variáveis de ambiente (.env)
