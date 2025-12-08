const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Iniciando correção de valores no banco de dados...\n');

db.serialize(() => {
  // Buscar todos os negócios com valores
  db.all('SELECT id, empresa, valor_produto, valor_oferta, valor_fabrica, valor_brasil FROM negocios WHERE valor_produto > 0 OR valor_oferta > 0 OR valor_fabrica > 0 OR valor_brasil > 0', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar negócios:', err);
      db.close();
      return;
    }
    
    console.log(`📊 Encontrados ${rows.length} negócios com valores para corrigir\n`);
    
    if (rows.length === 0) {
      console.log('✅ Nenhum valor para corrigir!');
      db.close();
      return;
    }
    
    const stmt = db.prepare('UPDATE negocios SET valor_produto = ?, valor_oferta = ?, valor_fabrica = ?, valor_brasil = ? WHERE id = ?');
    
    let corrigidos = 0;
    
    db.run('BEGIN TRANSACTION');
    
    rows.forEach(row => {
      // Corrigir dividindo por 100 (removendo os 2 zeros extras)
      const valor_produto_corrigido = row.valor_produto ? row.valor_produto / 100 : null;
      const valor_oferta_corrigido = row.valor_oferta ? row.valor_oferta / 100 : null;
      const valor_fabrica_corrigido = row.valor_fabrica ? row.valor_fabrica / 100 : null;
      const valor_brasil_corrigido = row.valor_brasil ? row.valor_brasil / 100 : null;
      
      stmt.run(valor_produto_corrigido, valor_oferta_corrigido, valor_fabrica_corrigido, valor_brasil_corrigido, row.id);
      
      if (corrigidos < 5) { // Mostrar apenas os primeiros 5 para não poluir
        console.log(`✓ ID ${row.id} - ${row.empresa}`);
        console.log(`  Produto: ${row.valor_produto?.toFixed(2)} → ${valor_produto_corrigido?.toFixed(2)}`);
        console.log(`  Oferta: ${row.valor_oferta?.toFixed(2)} → ${valor_oferta_corrigido?.toFixed(2)}\n`);
      }
      
      corrigidos++;
    });
    
    if (corrigidos > 5) {
      console.log(`... e mais ${corrigidos - 5} negócios\n`);
    }
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('❌ Erro ao commitar:', err);
        db.run('ROLLBACK');
      } else {
        console.log(`\n✅ ${corrigidos} negócios corrigidos com sucesso!`);
        console.log('\n📌 Próximos passos:');
        console.log('   1. Reinicie o servidor backend (npm run dev)');
        console.log('   2. Atualize o frontend (F5)');
        console.log('   3. Verifique os valores no dashboard\n');
      }
      
      stmt.finalize();
      db.close();
    });
  });
});
