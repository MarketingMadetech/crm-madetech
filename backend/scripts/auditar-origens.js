const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 AUDITORIA DE ORIGENS DA NEGOCIAÇÃO\n');

// Busca todas as origens com suas contagens
db.all(
  `SELECT origem, COUNT(*) as count 
   FROM negocios 
   WHERE origem IS NOT NULL AND origem != ''
   GROUP BY origem
   ORDER BY origem`,
  [],
  (err, rows) => {
    if (err) {
      console.error('❌ Erro ao consultar origens:', err.message);
      db.close();
      return;
    }

    console.log(`📊 Total de origens únicas: ${rows.length}\n`);

    // Agrupa por lowercase para identificar duplicatas
    const grupos = {};
    rows.forEach(row => {
      const key = row.origem.toLowerCase().trim();
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push({
        original: row.origem,
        count: row.count
      });
    });

    // Identifica grupos com mais de uma variação
    const duplicatas = Object.entries(grupos).filter(([key, values]) => values.length > 1);

    if (duplicatas.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada! Todas as origens já estão normalizadas.\n');
    } else {
      console.log('⚠️  ORIGENS COM VARIAÇÕES DE CAPITALIZAÇÃO:\n');
      
      duplicatas.forEach(([key, values]) => {
        const total = values.reduce((sum, v) => sum + v.count, 0);
        console.log(`📦 "${key}" (${total} negócios total):`);
        values.forEach(v => {
          console.log(`   - "${v.original}" → ${v.count} negócio(s)`);
        });
        console.log('');
      });

      console.log('============================================================');
      console.log('📊 RESUMO:');
      console.log(`   Total de origens: ${rows.length}`);
      console.log(`   Grupos com duplicatas: ${duplicatas.length}`);
      console.log(`   Economia após normalização: ${duplicatas.length} origens`);
      console.log('============================================================\n');
      console.log('💡 Execute: node scripts/normalizar-origens.js para corrigir\n');
    }

    // Lista top 30 origens mais usadas
    console.log('📋 TOP 30 ORIGENS MAIS USADAS:\n');
    const sorted = rows.sort((a, b) => b.count - a.count).slice(0, 30);
    sorted.forEach((row, index) => {
      const num = String(index + 1).padStart(2, ' ');
      const origem = row.origem.padEnd(45, ' ');
      console.log(`${num}. ${origem} (${row.count} negócios)`);
    });

    db.close();
  }
);
