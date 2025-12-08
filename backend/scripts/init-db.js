const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const db = new sqlite3.Database(path.join(__dirname, '..', 'crm.db'));

console.log('🗄️  Criando schema do banco de dados...');

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS negocios');
  db.run('DROP TABLE IF EXISTS historico');
  
  db.run(`
    CREATE TABLE negocios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa TEXT NOT NULL,
      pessoa_contato TEXT,
      telefone TEXT,
      email TEXT,
      equipamento TEXT,
      tipo_maquina TEXT,
      tipo_negociacao TEXT,
      valor_produto REAL,
      valor_oferta REAL,
      valor_fabrica REAL,
      valor_brasil REAL,
      data_criacao TEXT,
      data_fechamento TEXT,
      etapa TEXT,
      status TEXT,
      origem TEXT,
      observacao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negocio_id INTEGER NOT NULL,
      tipo_acao TEXT NOT NULL,
      campo_alterado TEXT,
      valor_anterior TEXT,
      valor_novo TEXT,
      usuario TEXT DEFAULT 'Sistema',
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
    )
  `);
  
  db.run('CREATE INDEX idx_empresa ON negocios(empresa)');
  db.run('CREATE INDEX idx_status ON negocios(status)');
  db.run('CREATE INDEX idx_etapa ON negocios(etapa)');
  db.run('CREATE INDEX idx_origem ON negocios(origem)');
  db.run('CREATE INDEX idx_historico_negocio ON historico(negocio_id)');
  db.run('CREATE INDEX idx_historico_data ON historico(data_hora)');
  
  console.log('✓ Schema criado com sucesso!');
});

const csvPath = path.join(__dirname, '..', '..', 'CRM_CONSOLIDADO_FINAL.csv');

if (!fs.existsSync(csvPath)) {
  console.error('❌ Arquivo CRM_CONSOLIDADO_FINAL.csv não encontrado!');
  console.log('   Caminho esperado:', csvPath);
  process.exit(1);
}

console.log('📥 Importando dados do CSV...');

const parseValue = (value) => {
  if (!value || value.trim() === '') return null;
  
  // Remove R$, €, espaços e $
  let cleaned = value.replace(/[R$€\s$]/g, '');
  
  // Remove traços que representam valores zerados
  if (cleaned === '-' || cleaned === '') return null;
  
  // Identifica se usa ponto como separador de milhar e vírgula como decimal (padrão brasileiro)
  // Exemplo: 340.120,00 → remove pontos de milhar, troca vírgula por ponto
  if (cleaned.includes(',')) {
    // Remove pontos (separadores de milhar) e troca vírgula por ponto (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  // Se não tem vírgula, assume que já está no formato correto (ex: 340120.00)
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const negocios = [];

fs.createReadStream(csvPath, { encoding: 'utf8' })
  .pipe(csv({ separator: ';', skipEmptyLines: true }))
  .on('data', (row) => {
    const empresa = row['Negócio - Empresa'] || row['﻿Negócio - Empresa'] || '';
    const cleanText = (text) => text ? text.trim() : null;
    
    const normalizeStatus = (status) => {
      if (!status) return null;
      const s = status.trim();
      
      // Normalizar para maiúscula inicial
      const normalized = s.toLowerCase();
      
      if (normalized === 'cancelado' || normalized === 'canceled') return 'Cancelado';
      if (normalized === 'perdido') return 'Perdido';
      if (normalized === 'suspenso') return 'Suspenso';
      if (normalized === 'venda confirmada') return 'Venda Confirmada';
      if (normalized === 'proposta enviada') return 'Proposta enviada';
      if (normalized === 'em andamento') return 'Em andamento';
      if (normalized === 'em aberto') return 'Em aberto';
      if (normalized === 'parado') return 'Parado';
      if (normalized === 'encerrado') return 'Encerrado';
      if (normalized === 'prospecção') return 'Prospecção';
      
      // Se não encontrar, retornar com primeira letra maiúscula
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };
    
    const normalizeEtapa = (etapa) => {
      if (!etapa) return null;
      const e = etapa.trim();
      
      // Normalizar para maiúscula inicial
      const normalized = e.toLowerCase();
      
      if (normalized === 'cancelado') return 'Cancelado';
      if (normalized === 'contato inicial') return 'Contato inicial';
      if (normalized === 'suspenso') return 'Suspenso';
      if (normalized === 'parado') return 'Parado';
      if (normalized === 'proposta enviada') return 'Proposta enviada';
      if (normalized === 'cliente contatado') return 'Cliente contatado';
      
      // Se não encontrar, retornar com primeira letra maiúscula
      return e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
    };
    
    negocios.push({
      empresa: empresa.trim(),
      pessoa_contato: cleanText(row['Pessoa de contato']),
      telefone: cleanText(row['Telefone']) || cleanText(row['telefone']),
      email: cleanText(row['Email']) || cleanText(row['email']) || cleanText(row['E-mail']),
      equipamento: cleanText(row['Equipamento']),
      tipo_maquina: cleanText(row['Tipo da Máquina']),
      tipo_negociacao: cleanText(row['Tipo Negociação']),
      valor_produto: parseValue(row['Valor do Produto']),
      valor_oferta: parseValue(row['Valor da Oferta']),
      valor_fabrica: parseValue(row['Valor Fábrica']),
      valor_brasil: parseValue(row['Valor Brasil']),
      data_criacao: cleanText(row['Negócio criado em']),
      data_fechamento: cleanText(row['Data de fechamento esperada']),
      etapa: normalizeEtapa(row['Negócio - Etapa']),
      status: normalizeStatus(row['Negócio - Status']),
      origem: cleanText(row['Origem da negociação']),
      observacao: cleanText(row['Observação'])
    });
  })
  .on('end', () => {
    const stmt = db.prepare(`
      INSERT INTO negocios (
        empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
        valor_produto, valor_oferta, valor_fabrica, valor_brasil,
        data_criacao, data_fechamento, etapa, status, origem, observacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      for (const n of negocios) {
        stmt.run(
          n.empresa, n.pessoa_contato, n.telefone, n.email, n.equipamento, n.tipo_maquina, n.tipo_negociacao,
          n.valor_produto, n.valor_oferta, n.valor_fabrica, n.valor_brasil,
          n.data_criacao, n.data_fechamento, n.etapa, n.status, n.origem, n.observacao
        );
      }
      
      db.run('COMMIT');
      
      console.log(`✓ ${negocios.length} registros importados!`);
      
      db.get('SELECT COUNT(*) as count FROM negocios', (err, row) => {
        if (!err) {
          console.log(`✓ Total de registros no banco: ${row.count}`);
        }
        console.log('\n✅ Banco de dados inicializado com sucesso!');
        db.close();
      });
    });
    
    stmt.finalize();
  });
