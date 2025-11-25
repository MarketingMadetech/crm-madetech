const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const transporter = require('./config/email');
const { router: authRouter, authenticateToken } = require('./auth');
const { createBackup, listBackups, restoreBackup, deleteBackup, BACKUP_DIR } = require('./backup');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configurado para produção
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'crm.db'));

// ========== ROTAS DE AUTENTICAÇÃO ==========
app.use('/api/auth', authRouter);

// ========== ROTAS DE NEGÓCIOS ==========

// Listar todos os negócios com filtros
app.get('/api/negocios', authenticateToken, (req, res) => {
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
app.get('/api/negocios/:id', authenticateToken, (req, res) => {
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
app.post('/api/negocios', authenticateToken, (req, res) => {
  const {
    empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao
  } = req.body;
  
  const query = `
    INSERT INTO negocios (
      empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
      valor_produto, valor_oferta, valor_fabrica, valor_brasil,
      data_criacao, data_fechamento, etapa, status, origem, observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const negocioId = this.lastID;
    
    // Registrar criação no histórico
    db.run(
      `INSERT INTO historico (negocio_id, tipo_acao, campo_alterado, valor_novo)
       VALUES (?, ?, ?, ?)`,
      [negocioId, 'criacao', 'negocio', empresa]
    );
    
    res.json({ id: negocioId, message: 'Negócio criado com sucesso' });
  });
});

// Atualizar negócio
app.put('/api/negocios/:id', authenticateToken, (req, res) => {
  const {
    empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
    valor_produto, valor_oferta, valor_fabrica, valor_brasil,
    data_criacao, data_fechamento, etapa, status, origem, observacao
  } = req.body;
  
  // Primeiro, buscar valores antigos para registrar no histórico
  db.get('SELECT * FROM negocios WHERE id = ?', [req.params.id], (err, negocioAntigo) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!negocioAntigo) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    
    const query = `
      UPDATE negocios SET
        empresa = ?, pessoa_contato = ?, telefone = ?, email = ?, equipamento = ?, tipo_maquina = ?, tipo_negociacao = ?,
        valor_produto = ?, valor_oferta = ?, valor_fabrica = ?, valor_brasil = ?,
        data_criacao = ?, data_fechamento = ?, etapa = ?, status = ?, origem = ?, observacao = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(query, [
      empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
      valor_produto, valor_oferta, valor_fabrica, valor_brasil,
      data_criacao, data_fechamento, etapa, status, origem, observacao,
      req.params.id
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Registrar mudanças no histórico
      const campos = {
        etapa, status, valor_oferta, data_fechamento, observacao
      };
      const camposAntigos = {
        etapa: negocioAntigo.etapa,
        status: negocioAntigo.status,
        valor_oferta: negocioAntigo.valor_oferta,
        data_fechamento: negocioAntigo.data_fechamento,
        observacao: negocioAntigo.observacao
      };
      
      Object.keys(campos).forEach(campo => {
        if (campos[campo] !== camposAntigos[campo]) {
          db.run(
            `INSERT INTO historico (negocio_id, tipo_acao, campo_alterado, valor_anterior, valor_novo)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, 'atualizacao', campo, String(camposAntigos[campo] || ''), String(campos[campo] || '')]
          );
        }
      });
      
      res.json({ message: 'Negócio atualizado com sucesso' });
    });
  });
});

// Deletar negócio
app.delete('/api/negocios/:id', authenticateToken, (req, res) => {
  // Buscar dados antes de deletar para o histórico
  db.get('SELECT empresa FROM negocios WHERE id = ?', [req.params.id], (err, negocio) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!negocio) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    
    // Registrar deleção no histórico antes de deletar (vai ser deletado em CASCADE)
    db.run(
      `INSERT INTO historico (negocio_id, tipo_acao, campo_alterado, valor_anterior)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, 'exclusao', 'negocio', negocio.empresa],
      () => {
        // Agora deletar o negócio
        db.run('DELETE FROM negocios WHERE id = ?', [req.params.id], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Negócio deletado com sucesso' });
        });
      }
    );
  });
});

// ========== ESTATÍSTICAS E DASHBOARDS ==========

// Dashboard - estatísticas gerais
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const { periodo = 'todos' } = req.query;
  console.log('📊 Dashboard Stats - Período recebido:', periodo);
  
  // Se for "todos", não filtra por data
  let filtroData = '';
  let params = [];
  
  if (periodo !== 'todos') {
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
    
    // Formata data para SQL (YYYY-MM-DD)
    const dataInicioSQL = dataInicio.toISOString().split('T')[0];
    console.log('📅 Filtrando negócios criados desde:', dataInicioSQL);
    filtroData = 'WHERE data_criacao >= ?';
    params = [dataInicioSQL];
  } else {
    console.log('📅 Mostrando TODOS os negócios');
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
  
  // Total de negócios (filtrado por período)
  db.get(`SELECT COUNT(*) as count FROM negocios ${filtroData}`, params, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.total = row.count;
    console.log('📊 Total de negócios no período:', row.count);
    checkComplete();
  });
  
  // Status dos negócios (filtrado por período)
  db.all(`SELECT status, COUNT(*) as count FROM negocios ${filtroData} GROUP BY status`, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.por_status = rows;
    checkComplete();
  });
  
  // Etapas (filtrado por período)
  db.all(`SELECT etapa, COUNT(*) as count FROM negocios ${filtroData} GROUP BY etapa`, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.por_etapa = rows;
    checkComplete();
  });
  
  // Top 10 origens (filtrado por período)
  db.all(`SELECT origem, COUNT(*) as count FROM negocios ${filtroData} GROUP BY origem ORDER BY count DESC LIMIT 10`, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.por_origem = rows;
    checkComplete();
  });
  
  // Valor total em ofertas (filtrado por período)
  const filtroValor = filtroData ? `${filtroData} AND valor_oferta IS NOT NULL` : 'WHERE valor_oferta IS NOT NULL';
  db.get(`SELECT SUM(valor_oferta) as total FROM negocios ${filtroValor}`, params, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.valor_total_ofertas = row.total || 0;
    checkComplete();
  });
  
  // Negócios em Risco (parados há 30+ dias) - filtrado por período
  const filtroRisco = filtroData 
    ? `WHERE status != 'Venda Confirmada' AND status != 'Perdido' AND etapa NOT IN ('Cliente contatado', 'Proposta enviada') AND data_criacao >= ?`
    : `WHERE status != 'Venda Confirmada' AND status != 'Perdido' AND etapa NOT IN ('Cliente contatado', 'Proposta enviada')`;
  db.get(`
    SELECT 
      COUNT(*) as count,
      SUM(valor_oferta) as valor_total
    FROM negocios 
    ${filtroRisco}
  `, params, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.negocios_em_risco = row || { count: 0, valor_total: 0 };
    checkComplete();
  });
  
  // Taxa de conversão e oportunidades - filtrado por período
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Venda Confirmada' THEN 1 ELSE 0 END) as fechados,
      SUM(CASE WHEN status = 'Proposta enviada' THEN 1 ELSE 0 END) as propostas,
      SUM(CASE WHEN status = 'Proposta enviada' THEN valor_oferta ELSE 0 END) as valor_propostas
    FROM negocios
    ${filtroData}
  `, params, (err, row) => {
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
app.get('/api/dashboard/pipeline', authenticateToken, (req, res) => {
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

// Tendência de criação de negócios (últimos 30 dias)
app.get('/api/dashboard/tendencia', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      DATE(data_criacao) as data,
      COUNT(*) as quantidade
    FROM negocios
    WHERE data_criacao >= date('now', '-30 days')
    GROUP BY DATE(data_criacao)
    ORDER BY data
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Formatar datas para DD/MM
    const resultado = rows.map(row => {
      const [ano, mes, dia] = row.data.split('-');
      return {
        data: `${dia}/${mes}`,
        quantidade: row.quantidade
      };
    });
    
    res.json(resultado);
  });
});

// Filtros disponíveis
app.get('/api/filtros', authenticateToken, (req, res) => {
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
app.post('/api/email/enviar', authenticateToken, async (req, res) => {
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

// ========== ROTAS DE HISTÓRICO ==========

// Buscar histórico de um negócio
app.get('/api/historico/:negocio_id', authenticateToken, (req, res) => {
  const { negocio_id } = req.params;
  
  db.all(
    'SELECT * FROM historico WHERE negocio_id = ? ORDER BY data_hora DESC',
    [negocio_id],
    (err, historico) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(historico);
    }
  );
});

// Registrar evento no histórico
app.post('/api/historico', authenticateToken, (req, res) => {
  const { negocio_id, tipo_acao, campo_alterado, valor_anterior, valor_novo, usuario } = req.body;
  
  db.run(
    `INSERT INTO historico (negocio_id, tipo_acao, campo_alterado, valor_anterior, valor_novo, usuario)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [negocio_id, tipo_acao, campo_alterado, valor_anterior, valor_novo, usuario || 'Sistema'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
// ========== ROTAS DE BACKUP ==========

// Criar backup manual
app.post('/api/backup/create', authenticateToken, async (req, res) => {
  try {
    const backup = await createBackup();
    res.json({ 
      success: true, 
      message: 'Backup criado com sucesso',
      backup 
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar backup',
      error: error.message 
    });
  }
});

// Listar backups disponíveis
app.get('/api/backup/list', authenticateToken, (req, res) => {
  try {
    const backups = listBackups();
    res.json({ 
      success: true, 
      backups 
    });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar backups',
      error: error.message 
    });
  }
});

// Download de backup
app.get('/api/backup/download/:fileName', authenticateToken, (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    if (!fileName.startsWith('crm_backup_') || !fileName.endsWith('.db')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome de arquivo inválido' 
      });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Erro ao fazer download:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Erro ao fazer download do backup' 
        });
      }
    });
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao baixar backup',
      error: error.message 
    });
  }
});

// Restaurar backup
app.post('/api/backup/restore/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName.startsWith('crm_backup_') || !fileName.endsWith('.db')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome de arquivo inválido' 
      });
    }

    const result = await restoreBackup(fileName);
    res.json({ 
      success: true, 
      message: 'Backup restaurado com sucesso. Reinicie o servidor para aplicar as mudanças.',
      result 
    });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao restaurar backup',
      error: error.message 
    });
  }
});

// Deletar backup
app.delete('/api/backup/delete/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName.startsWith('crm_backup_') || !fileName.endsWith('.db')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome de arquivo inválido' 
      });
    }

    await deleteBackup(fileName);
    res.json({ 
      success: true, 
      message: 'Backup deletado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar backup',
      error: error.message 
    });
  }
});

// ========== INICIAR SERVIDOR ==========

  console.log(`🚀 Servidor CRM rodando na porta ${PORT}`);
  console.log(`📊 Banco de dados: ${path.join(__dirname, 'crm.db')}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});
