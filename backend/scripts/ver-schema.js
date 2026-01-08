const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Verificando estrutura da tabela negocios...\n');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(negocios)", [], (err, columns) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    db.close();
    return;
  }
  
  console.log('📊 Colunas da tabela negocios:\n');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  db.close();
});
