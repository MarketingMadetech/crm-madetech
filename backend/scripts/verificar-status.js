const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db', sqlite3.OPEN_READONLY);

console.log('\n📊 ANÁLISE DE STATUS NO BANCO DE DADOS\n');

db.all('SELECT status, COUNT(*) as total FROM negocios GROUP BY status ORDER BY total DESC', [], (err, rows) => {
  if (err) {
    console.error('Erro:', err);
    db.close();
    return;
  }
  
  console.log('Distribuição de STATUS:\n');
  rows.forEach(r => {
    console.log(`   "${r.status}": ${r.total}`);
  });
  
  console.log('\n---\n');
  
  // Buscar especificamente vendas confirmadas (com variações)
  db.all(`
    SELECT status, COUNT(*) as total 
    FROM negocios 
    WHERE LOWER(status) LIKE '%venda%confirmada%' 
       OR LOWER(status) LIKE '%confirmad%'
       OR LOWER(status) LIKE '%fechad%'
    GROUP BY status
  `, [], (err2, vendas) => {
    if (err2) {
      console.error('Erro:', err2);
    } else {
      console.log('Status com "VENDA CONFIRMADA" (case-insensitive):');
      if (vendas.length === 0) {
        console.log('   Nenhum encontrado!');
      } else {
        vendas.forEach(v => console.log(`   "${v.status}": ${v.total}`));
      }
    }
    
    db.close();
  });
});
