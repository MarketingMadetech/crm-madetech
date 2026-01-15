const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('crm.db');

console.log('📊 ETAPA 1: Adicionando colunas de moeda no banco...\n');

db.serialize(() => {
  // Adicionar colunas
  db.run("ALTER TABLE negocios ADD COLUMN valor_produto_moeda TEXT DEFAULT 'BRL'", (err) => {
    if (err && !err.message.includes('duplicate')) console.log('valor_produto_moeda:', err.message);
    else console.log('✅ valor_produto_moeda criada ou já existe');
  });
  
  db.run("ALTER TABLE negocios ADD COLUMN valor_fabrica_moeda TEXT DEFAULT 'BRL'", (err) => {
    if (err && !err.message.includes('duplicate')) console.log('valor_fabrica_moeda:', err.message);
    else console.log('✅ valor_fabrica_moeda criada ou já existe');
  });
  
  db.run("ALTER TABLE negocios ADD COLUMN valor_brasil_moeda TEXT DEFAULT 'BRL'", (err) => {
    if (err && !err.message.includes('duplicate')) console.log('valor_brasil_moeda:', err.message);
    else console.log('✅ valor_brasil_moeda criada ou já existe');
  });
  
  // Atualizar registros existentes para BRL
  db.run("UPDATE negocios SET valor_produto_moeda = 'BRL' WHERE valor_produto_moeda IS NULL", function(err) {
    if (!err) console.log('✅ Atualizados', this.changes, 'registros para valor_produto_moeda = BRL');
  });
  
  db.run("UPDATE negocios SET valor_fabrica_moeda = 'BRL' WHERE valor_fabrica_moeda IS NULL", function(err) {
    if (!err) console.log('✅ Atualizados', this.changes, 'registros para valor_fabrica_moeda = BRL');
  });
  
  db.run("UPDATE negocios SET valor_brasil_moeda = 'BRL' WHERE valor_brasil_moeda IS NULL", function(err) {
    if (!err) console.log('✅ Atualizados', this.changes, 'registros para valor_brasil_moeda = BRL');
    console.log('\n✨ ETAPA 1 CONCLUÍDA!');
    db.close();
  });
});
