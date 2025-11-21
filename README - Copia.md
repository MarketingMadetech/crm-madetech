# � CRM Marketing - Madetech

Sistema completo de gestão de relacionamento com clientes (CRM) focado em vendas de equipamentos, com interface moderna em React e backend Node.js.

## ✨ Funcionalidades Principais

### 📊 Dashboard
- Métricas em tempo real
- Gráficos de distribuição por status
- Pipeline de vendas
- Top 10 origens de negócios
- Valor total em ofertas

### 💼 Gestão de Negócios
- Cadastro completo de negociações
- Acompanhamento de propostas
- Gestão de valores (produto, oferta, fábrica, Brasil)
- Status e etapas personalizáveis
- Observações e histórico

### 🎯 Funil de Vendas
- Visualização Kanban das etapas
- Drag & drop para atualização
- Totalizadores por etapa
- Status visual dos negócios
- Acompanhamento de progressão

### 🔔 Sistema de Lembretes
- Alertas de negócios parados
- Previsão de fechamentos
- Negócios sem data definida
- Exportação de follow-ups
- Relatórios personalizados

### ✉️ Sistema de E-mail
- Envio de propostas
- Templates personalizados
- Histórico de comunicações
- Integração com Outlook
- E-mails profissionais

## 🛠️ Tecnologias

### Frontend
- React + Vite
- TailwindCSS para estilização
- Recharts para gráficos
- React Router para navegação
- Axios para requisições
- Modo escuro/claro

### Backend
- Node.js + Express
- SQLite como banco de dados
- Nodemailer para e-mails
- API RESTful
- Importação CSV

## 🔧 Instalação

### Backend

```bash
cd backend
npm install
npm run init-db   # Inicializa o banco de dados
npm run dev       # Inicia o servidor em localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # Inicia o app em localhost:5173
```

## 📋 Estrutura do Projeto

```
CRM Marketing/
├── backend/
│   ├── config/
│   │   └── email.js          # Configuração SMTP
│   ├── scripts/
│   │   ├── init-db.js        # Inicialização do banco
│   │   └── add-telefone.js   # Script de migração
│   └── server.js             # Servidor Express
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── context/         # Contextos (tema)
│   │   └── styles/          # Estilos CSS
│   └── index.html
└── data/
    └── templates/           # Templates de e-mail
```

## 📱 Features da Interface

- Design responsivo
- Tema escuro/claro
- Navegação intuitiva
- Filtros avançados
- Exportação de dados
- Gráficos interativos
- Modal de detalhes
- Formulários otimizados

## � Segurança
- Configuração SMTP segura
- Validação de dados
- Sanitização de inputs
- Proteção contra injeção SQL
- Logs de atividades

## 📊 Relatórios Disponíveis
- Dashboard geral
- Pipeline de vendas
- Follow-ups pendentes
- Análise de valores
- Histórico de negociações

## 🔄 API Endpoints

### Negócios
- `GET /api/negocios` - Lista com filtros
- `GET /api/negocios/:id` - Detalhes
- `POST /api/negocios` - Criar
- `PUT /api/negocios/:id` - Atualizar
- `DELETE /api/negocios/:id` - Remover

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/dashboard/pipeline` - Pipeline
- `GET /api/filtros` - Opções de filtro

### E-mail
- `POST /api/email/enviar` - Envio de e-mails

## 💡 Próximos Passos

- [ ] Histórico de mudanças de etapas
- [ ] Rastreamento de e-mails
- [ ] Previsão de vendas
- [ ] Automação de follow-ups
- [ ] Integração com API externa
- [ ] App mobile

## 🤝 Suporte

Para suporte, entre em contato com a equipe MadeTech através do e-mail suporte@madetech.com.br

---

**Desenvolvido com ❤️ pela MadeTech**
