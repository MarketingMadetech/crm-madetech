const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar o banco de dados do Desktop
const dbPath = 'C:\\Users\\madet\\OneDrive\\Desktop\\crm.db';
const db = new sqlite3.Database(dbPath);

console.log(`📊 Verificando e atualizando: ${dbPath}\n`);

db.serialize(() => {
  // Verificar colunas existentes
  db.all("PRAGMA table_info(negocios)", (err, rows) => {
    if (err) {
      console.error('❌ Erro ao verificar tabela:', err.message);
      db.close();
      return;
    }

    const colunas = rows.map(r => r.name);
    console.log('✅ Colunas existentes:', colunas.length);
    
    // Verificar quais faltam
    const faltam = [];
    const colunasNecessarias = ['valor_produto_moeda', 'valor_fabrica_moeda', 'valor_brasil_moeda'];
    
    colunasNecessarias.forEach(col => {
      if (!colunas.includes(col)) {
        faltam.push(col);
      }
    });

    if (faltam.length === 0) {
      console.log('✅ TODAS as colunas de moeda já existem!\n');
      db.close();
      return;
    }

    console.log(`⚠️ Faltam adicionar: ${faltam.join(', ')}\n`);
    
    // Adicionar colunas
    let addedCount = 0;
    
    faltam.forEach(coluna => {
      db.run(`ALTER TABLE negocios ADD COLUMN ${coluna} TEXT DEFAULT 'BRL'`, (err) => {
        if (err && !err.message.includes('duplicate')) {
          console.log(`❌ Erro ao adicionar ${coluna}:`, err.message);
        } else {
          console.log(`✅ ${coluna} adicionada com sucesso`);
          addedCount++;
        }
        
        if (addedCount === faltam.length) {
          // Atualizar registros
          console.log('\n📝 Atualizando registros existentes...\n');
          
          let updateCount = 0;
          faltam.forEach(coluna => {
            db.run(`UPDATE negocios SET ${coluna} = 'BRL' WHERE ${coluna} IS NULL`, function(err) {
              if (!err) {
                console.log(`✅ ${coluna}: ${this.changes} registros atualizados`);
              }
              updateCount++;
              
              if (updateCount === faltam.length) {
                console.log('\n✨ BANCO DE DADOS ATUALIZADO COM SUCESSO!');
                db.close();
              }
            });
          });
        }
      });
    });
  });
});
