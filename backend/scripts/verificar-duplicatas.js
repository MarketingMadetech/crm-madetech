const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Verificando duplicatas no banco de dados...\n');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

// Verificar duplicatas por empresa + equipamento
console.log('📊 Verificando duplicatas por Empresa + Equipamento:\n');

db.all(`
  SELECT empresa, equipamento, COUNT(*) as quantidade
  FROM negocios
  GROUP BY LOWER(empresa), LOWER(equipamento)
  HAVING COUNT(*) > 1
  ORDER BY quantidade DESC
  LIMIT 20
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    return;
  }
  
  if (rows.length === 0) {
    console.log('✅ Nenhuma duplicata encontrada por Empresa + Equipamento!\n');
  } else {
    console.log(`⚠️  Encontradas ${rows.length} combinações duplicadas:\n`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.empresa} - ${row.equipamento} (${row.quantidade}x)`);
    });
  }
  
  // Verificar duplicatas exatas (todos os campos principais)
  console.log('\n📊 Verificando duplicatas exatas (Empresa + Equipamento + Data):\n');
  
  db.all(`
    SELECT empresa, equipamento, data_criacao, COUNT(*) as quantidade
    FROM negocios
    GROUP BY LOWER(empresa), LOWER(equipamento), data_criacao
    HAVING COUNT(*) > 1
    ORDER BY quantidade DESC
    LIMIT 20
  `, [], (err2, rows2) => {
    if (err2) {
      console.error('❌ Erro:', err2.message);
      db.close();
      return;
    }
    
    if (rows2.length === 0) {
      console.log('✅ Nenhuma duplicata exata encontrada!\n');
    } else {
      console.log(`⚠️  Encontradas ${rows2.length} duplicatas exatas:\n`);
      rows2.forEach((row, index) => {
        console.log(`${index + 1}. ${row.empresa} - ${row.equipamento} - ${row.data_criacao || 'Sem data'} (${row.quantidade}x)`);
      });
    }
    
    // Contar total de registros
    db.get('SELECT COUNT(*) as total FROM negocios', [], (err3, result) => {
      if (err3) {
        console.error('❌ Erro:', err3.message);
      } else {
        console.log(`\n📊 Total de registros no banco: ${result.total}`);
      }
      db.close();
    });
  });
});
