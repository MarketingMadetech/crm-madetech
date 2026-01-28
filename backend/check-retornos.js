const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db');

// Verificar tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  console.log('📋 Tabelas existentes:', rows.map(r => r.name));
  
  // Verificar estrutura da tabela retornos
  db.all("PRAGMA table_info(retornos)", (err, cols) => {
    if (err) {
      console.log('❌ Tabela retornos NÃO existe!');
      console.log('Criando tabela...');
      
      db.run(`CREATE TABLE IF NOT EXISTS retornos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        negocio_id INTEGER NOT NULL,
        data_agendada DATE NOT NULL,
        descricao TEXT,
        realizado INTEGER DEFAULT 0,
        data_realizado DATETIME,
        observacao_retorno TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.log('❌ Erro ao criar tabela:', err.message);
        } else {
          console.log('✅ Tabela retornos criada com sucesso!');
        }
        db.close();
      });
    } else {
      console.log('✅ Tabela retornos existe. Colunas:', cols.map(c => c.name));
      db.close();
    }
  });
});
