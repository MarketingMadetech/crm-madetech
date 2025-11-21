const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const transporter = require('./config/email');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'crm.db'));

// ========== ROTAS DE NEGÓCIOS ==========

// Listar todos os negócios com filtros
app.get('/api/negocios', (req, res) => {
  const { status, etapa, origem, search } = req.query;
  
  let query = 'SELECT * FROM negocios WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (etapa) {
    query += ' AND etapa = ?';
    params.push(etapa);
  }
  
  if (origem) {
    query += ' AND origem = ?';
    params.push(origem);
  }
  
  if (search) {
    query += ' AND (empresa LIKE ? OR pessoa_contato LIKE ? OR equipamento LIKE ? OR telefone LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY data_criacao DESC';
  
  db.all(query, params, (err, negocios) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(negocios);
  });
});

// Buscar negócio por ID
app.get('/api/negocios/:id', (req, res) => {
  db.get('SELECT * FROM negocios WHERE id = ?', [req.params.id], (err, negocio) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!negocio) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    res.json(negocio);
  });
});

// Criar novo negócio
app.post('/api/negocios', (req, res) => {
  const {
    empresa, pessoa_contato, telefone, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao
  } = req.body;
  
  const query = `
    INSERT INTO negocios (
      empresa, pessoa_contato, telefone, equipamento, tipo_maquina, tipo_negociacao,
      valor_produto, valor_oferta, valor_fabrica, valor_brasil,
      data_criacao, data_fechamento, etapa, status, origem, observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    empresa, pessoa_contato, telefone, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Negócio criado com sucesso' });
  });
});

// Atualizar negócio
app.put('/api/negocios/:id', (req, res) => {
  const {
    empresa, pessoa_contato, telefone, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao
  } = req.body;
  
  const query = `
    UPDATE negocios SET
      empresa = ?, pessoa_contato = ?, telefone = ?, equipamento = ?, tipo_maquina = ?, tipo_negociacao = ?,
      valor_produto = ?, valor_oferta = ?, valor_fabrica = ?, valor_brasil = ?,
      data_criacao = ?, data_fechamento = ?, etapa = ?, status = ?, origem = ?, observacao = ?
    WHERE id = ?
  `;
  
  db.run(query, [
    empresa, pessoa_contato, telefone, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao,
    req.params.id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    res.json({ message: 'Negócio atualizado com sucesso' });
  });
});

// Deletar negócio
app.delete('/api/negocios/:id', (req, res) => {
  db.run('DELETE FROM negocios WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    res.json({ message: 'Negócio deletado com sucesso' });
  });
});

// ========== ESTATÍSTICAS E DASHBOARDS ==========

// Dashboard - estatísticas gerais
app.get('/api/dashboard/stats', (req, res) => {
  const { periodo = '30d' } = req.query;
  
  // Calcula data de início baseada no período
  let dataInicio = new Date();
  switch(periodo) {
    case '7d':
      dataInicio.setDate(dataInicio.getDate() - 7);
      break;
    case '30d':
      dataInicio.setDate(dataInicio.getDate() - 30);
      break;
    case '90d':
      dataInicio.setDate(dataInicio.getDate() - 90);
      break;
    case 'anual':
      dataInicio.setMonth(0, 1);
      break;
  }
  
  const stats = {};
  let queryCount = 0;
  const expectedQueries = 7;
  
  // Helper para executar callback quando todas as queries terminarem
  const checkComplete = () => {
    queryCount++;
    if (queryCount === expectedQueries) {
      res.json(stats);
    }
  };
  
  // Total de negócios
  db.get('SELECT COUNT(*) as count FROM negocios', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.total = row.count;
    checkComplete();
  });
  
  // Status dos negócios
  db.all('SELECT status, COUNT(*) as count FROM negocios GROUP BY status', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.por_status = rows;
    checkComplete();
  });
  
  // Etapas
  db.all('SELECT etapa, COUNT(*) as count FROM negocios GROUP BY etapa', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.por_etapa = rows;
    checkComplete();
  });
  
  // Top 10 origens
  db.all('SELECT origem, COUNT(*) as count FROM negocios GROUP BY origem ORDER BY count DESC LIMIT 10', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.por_origem = rows;
    checkComplete();
  });
  
  // Valor total em ofertas
  db.get('SELECT SUM(valor_oferta) as total FROM negocios WHERE valor_oferta IS NOT NULL', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.valor_total_ofertas = row.total || 0;
    checkComplete();
  });
  
  // Negócios em Risco (parados há 30+ dias)
  db.get(`
    SELECT 
      COUNT(*) as count,
      SUM(valor_oferta) as valor_total
    FROM negocios 
    WHERE status != 'VENDA CONFIRMADA' 
      AND status != 'Perdido'
      AND etapa NOT IN ('Cliente contatado', 'Proposta enviada')
  `, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.negocios_em_risco = row || { count: 0, valor_total: 0 };
    checkComplete();
  });
  
  // Taxa de conversão e oportunidades
  db.all(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'VENDA CONFIRMADA' THEN 1 ELSE 0 END) as fechados,
      SUM(CASE WHEN status = 'Proposta enviada' THEN 1 ELSE 0 END) as propostas,
      SUM(CASE WHEN status = 'Proposta enviada' THEN valor_oferta ELSE 0 END) as valor_propostas
    FROM negocios
  `, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.negoccios_fechados = row.fechados || 0;
    stats.taxa_conversao = row.total > 0 ? Math.round((row.fechados / row.total) * 100) : 0;
    stats.oportunidades = {
      count: row.propostas || 0,
      valor_total: row.valor_propostas || 0
    };
    
    // Inicializa trends como 0 (será calculado se houver dados de período anterior)
    stats.trend_total = 0;
    stats.trend_valor = 0;
    
    checkComplete();
  });
});

// Pipeline de vendas
app.get('/api/dashboard/pipeline', (req, res) => {
  const query = `
    SELECT 
      etapa,
      COUNT(*) as quantidade,
      SUM(valor_oferta) as valor_total,
      AVG(valor_oferta) as valor_medio
    FROM negocios
    WHERE status IN ('Em andamento', 'Proposta enviada', 'Cliente contatado', 'Contato inicial')
    GROUP BY etapa
    ORDER BY quantidade DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Filtros disponíveis
app.get('/api/filtros', (req, res) => {
  const filtros = {};
  
  db.all('SELECT DISTINCT status FROM negocios WHERE status IS NOT NULL ORDER BY status', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    filtros.status = rows.map(r => r.status);
    
    db.all('SELECT DISTINCT etapa FROM negocios WHERE etapa IS NOT NULL ORDER BY etapa', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      filtros.etapas = rows.map(r => r.etapa);
      
      db.all('SELECT DISTINCT origem FROM negocios WHERE origem IS NOT NULL ORDER BY origem', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        filtros.origens = rows.map(r => r.origem);
        res.json(filtros);
      });
    });
  });
});

// ========== ROTA DE E-MAIL ==========
app.post('/api/email/enviar', async (req, res) => {
  const { negocioId, destinatario, assunto, mensagem } = req.body;

  if (!destinatario || !assunto || !mensagem) {
    return res.status(400).json({ error: 'Destinatário, assunto e mensagem são obrigatórios' });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || 'seu-email@gmail.com',
      to: destinatario,
      subject: assunto,
      text: mensagem,
      html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${mensagem}</pre>`
    });

    // Opcional: registrar envio no banco de dados
    if (negocioId) {
      db.get('SELECT observacao FROM negocios WHERE id = ?', [negocioId], (err, negocio) => {
        if (!err && negocio) {
          const novaObs = (negocio.observacao || '') + `\n[${new Date().toLocaleString('pt-BR')}] E-mail enviado para ${destinatario}`;
          db.run('UPDATE negocios SET observacao = ? WHERE id = ?', [novaObs, negocioId]);
        }
      });
    }

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Erro ao enviar e-mail: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
