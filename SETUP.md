# 🚀 Setup do CRM Marketing

## Pré-requisitos
- ✅ Python 3.14 (instalado)
- ✅ Node.js (instalado - reinicie o terminal)

## 📦 Instalação

### 1. Backend (API)
```bash
cd backend
npm install
npm run init-db
npm run dev
```

O servidor vai rodar em: http://localhost:3001

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

O app vai rodar em: http://localhost:3000

## 🗄️ Estrutura do Banco

**Tabela: negocios**
- id, empresa, pessoa_contato, equipamento
- tipo_maquina, tipo_negociacao
- valores (produto, oferta, fabrica, brasil)
- datas (criacao, fechamento)
- etapa, status, origem, observacao

## 🔌 API Endpoints

### Negócios
- `GET /api/negocios` - Listar todos (com filtros)
- `GET /api/negocios/:id` - Buscar por ID
- `POST /api/negocios` - Criar novo
- `PUT /api/negocios/:id` - Atualizar
- `DELETE /api/negocios/:id` - Deletar

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/pipeline` - Pipeline de vendas
- `GET /api/filtros` - Opções de filtros

## 📊 Próximos Passos
1. Testar a API
2. Criar frontend React
3. Implementar dashboard visual
