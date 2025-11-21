const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'crm.db'));

console.log('📞 Adicionando campo telefone ao banco...');

db.serialize(() => {
  db.run('ALTER TABLE negocios ADD COLUMN telefone TEXT', (err) => {
    if (err && err.message.includes('duplicate column name')) {
      console.log('⚠️  Campo telefone já existe!');
    } else if (err) {
      console.error('❌ Erro:', err.message);
    } else {
      console.log('✓ Campo telefone adicionado com sucesso!');
    }
    db.close();
  });
});
