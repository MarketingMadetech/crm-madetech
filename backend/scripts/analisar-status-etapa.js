const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Analisando valores de Status e Etapa...\n');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

// Analisar Status
console.log('📊 Valores de STATUS:\n');
db.all(`
  SELECT status, COUNT(*) as quantidade
  FROM negocios
  WHERE status IS NOT NULL AND status != ''
  GROUP BY status
  ORDER BY quantidade DESC
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    return;
  }
  
  rows.forEach((row, index) => {
    console.log(`${index + 1}. "${row.status}" - ${row.quantidade} registros`);
  });
  
  // Analisar Etapa
  console.log('\n\n📊 Valores de ETAPA:\n');
  db.all(`
    SELECT etapa, COUNT(*) as quantidade
    FROM negocios
    WHERE etapa IS NOT NULL AND etapa != ''
    GROUP BY etapa
    ORDER BY quantidade DESC
  `, [], (err2, rows2) => {
    if (err2) {
      console.error('❌ Erro:', err2.message);
      db.close();
      return;
    }
    
    rows2.forEach((row, index) => {
      console.log(`${index + 1}. "${row.etapa}" - ${row.quantidade} registros`);
    });
    
    // Verificar duplicatas (case-insensitive)
    console.log('\n\n🔍 Verificando duplicatas (ignorando maiúsculas/minúsculas):\n');
    
    const statusLowerCase = {};
    rows.forEach(row => {
      const lower = row.status.toLowerCase();
      if (!statusLowerCase[lower]) {
        statusLowerCase[lower] = [];
      }
      statusLowerCase[lower].push(row.status);
    });
    
    const statusDuplicados = Object.entries(statusLowerCase).filter(([key, values]) => values.length > 1);
    
    if (statusDuplicados.length > 0) {
      console.log('⚠️  Duplicatas em STATUS:');
      statusDuplicados.forEach(([key, values]) => {
        console.log(`   "${key}" aparece como: ${values.map(v => `"${v}"`).join(', ')}`);
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada em STATUS');
    }
    
    const etapaLowerCase = {};
    rows2.forEach(row => {
      const lower = row.etapa.toLowerCase();
      if (!etapaLowerCase[lower]) {
        etapaLowerCase[lower] = [];
      }
      etapaLowerCase[lower].push(row.etapa);
    });
    
    const etapaDuplicados = Object.entries(etapaLowerCase).filter(([key, values]) => values.length > 1);
    
    if (etapaDuplicados.length > 0) {
      console.log('\n⚠️  Duplicatas em ETAPA:');
      etapaDuplicados.forEach(([key, values]) => {
        console.log(`   "${key}" aparece como: ${values.map(v => `"${v}"`).join(', ')}`);
      });
    } else {
      console.log('\n✅ Nenhuma duplicata encontrada em ETAPA');
    }
    
    db.close();
  });
});
