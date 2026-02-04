const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db');

console.log('=== ANÁLISE DE DUPLICATAS DE EQUIPAMENTOS ===\n');

db.all(
  `SELECT equipamento, COUNT(*) as qtd 
   FROM negocios 
   WHERE equipamento IS NOT NULL AND equipamento != '' 
   GROUP BY equipamento 
   ORDER BY LOWER(equipamento)`,
  (err, rows) => {
    if (err) {
      console.error('Erro:', err);
      db.close();
      return;
    }

    // Agrupar por versão lowercase para encontrar duplicatas
    const grupos = {};
    rows.forEach(r => {
      const key = r.equipamento.toLowerCase().trim();
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push({ nome: r.equipamento, qtd: r.qtd });
    });

    // Mostrar apenas grupos com mais de uma variação
    console.log('📋 EQUIPAMENTOS COM VARIAÇÕES (maiúsculas/minúsculas diferentes):\n');
    let totalDuplicatas = 0;

    Object.keys(grupos).sort().forEach(key => {
      if (grupos[key].length > 1) {
        totalDuplicatas++;
        console.log(`🔴 "${key}":`);
        grupos[key].forEach(v => {
          console.log(`   - "${v.nome}" (${v.qtd} negócios)`);
        });
        console.log('');
      }
    });

    if (totalDuplicatas === 0) {
      console.log('✅ Nenhuma duplicata encontrada!\n');
    } else {
      console.log(`\n📊 Total de grupos com duplicatas: ${totalDuplicatas}`);
    }

    // Listar todos os equipamentos únicos para referência
    console.log('\n\n=== LISTA COMPLETA DE EQUIPAMENTOS NO BANCO ===\n');
    rows.forEach(r => {
      console.log(`"${r.equipamento}" - ${r.qtd} negócio(s)`);
    });

    db.close();
  }
);
