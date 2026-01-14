const sqlite3 = require('sqlite3').verbose();

console.log('🔍 AUDITORIA DE EQUIPAMENTOS\n');

const dbPath = './crm.db';
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Buscar todos os equipamentos únicos
  db.all('SELECT DISTINCT equipamento, COUNT(*) as count FROM negocios WHERE equipamento IS NOT NULL AND equipamento != "" GROUP BY equipamento ORDER BY LOWER(equipamento)', (err, rows) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      db.close();
      return;
    }

    console.log(`📊 Total de equipamentos únicos: ${rows.length}\n`);

    // Agrupar por lowercase para identificar duplicatas
    const grupos = {};
    rows.forEach(row => {
      const key = row.equipamento.toLowerCase().trim();
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push({
        original: row.equipamento,
        count: row.count
      });
    });

    // Identificar duplicatas por capitalização
    const duplicatas = Object.entries(grupos).filter(([key, values]) => values.length > 1);

    if (duplicatas.length > 0) {
      console.log('⚠️  EQUIPAMENTOS COM VARIAÇÕES DE CAPITALIZAÇÃO:\n');
      
      duplicatas.forEach(([key, values]) => {
        console.log(`📦 "${key}" (${values.reduce((sum, v) => sum + v.count, 0)} negócios total):`);
        values.forEach(v => {
          console.log(`   - "${v.original}" → ${v.count} negócio(s)`);
        });
        console.log('');
      });

      console.log('='.repeat(60));
      console.log(`📊 RESUMO:`);
      console.log(`   Total de equipamentos: ${rows.length}`);
      console.log(`   Grupos com duplicatas: ${duplicatas.length}`);
      console.log(`   Economia após normalização: ${rows.length - Object.keys(grupos).length} equipamentos`);
      console.log('='.repeat(60));
      console.log('\n💡 Execute: node scripts/normalizar-equipamentos.js para corrigir\n');
    } else {
      console.log('✅ Nenhuma duplicata encontrada! Todos os equipamentos estão normalizados.\n');
    }

    // Listar todos os equipamentos por popularidade
    console.log('\n📋 TOP 20 EQUIPAMENTOS MAIS USADOS:\n');
    rows.slice(0, 20).forEach((row, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${row.equipamento.padEnd(40)} (${row.count} negócios)`);
    });

    db.close();
  });
});
