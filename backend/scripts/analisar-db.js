const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'C:\\Users\\madet\\OneDrive\\Desktop\\Marketing Madetech\\Planilhas CRM\\CRM MArketing\\backend\\backups\\crm_mais_recente.db';

console.log('📊 Analisando banco de dados: crm_mais_recente.db\n');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err.message);
    return;
  }
  
  console.log('✅ Banco aberto com sucesso!\n');
  
  // Listar tabelas
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      db.close();
      return;
    }
    
    console.log('📋 Tabelas encontradas:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name}`);
    });
    
    // Analisar tabela negocios
    console.log('\n📊 Tabela NEGOCIOS:\n');
    
    db.get('SELECT COUNT(*) as total FROM negocios', [], (err, result) => {
      if (err) {
        console.error('❌ Erro:', err.message);
      } else {
        console.log(`   Total de registros: ${result.total}`);
      }
      
      // Mostrar alguns registros
      db.all('SELECT * FROM negocios LIMIT 5', [], (err, rows) => {
        if (err) {
          console.error('❌ Erro:', err.message);
        } else {
          console.log('\n📝 Primeiros 5 registros:\n');
          rows.forEach((row, index) => {
            console.log(`--- Registro ${index + 1} (ID: ${row.id}) ---`);
            console.log(`Empresa: ${row.empresa || '-'}`);
            console.log(`Pessoa Contato: ${row.pessoa_contato || '-'}`);
            console.log(`Equipamento: ${row.equipamento || '-'}`);
            console.log(`Valor Produto: ${row.valor_produto || 0}`);
            console.log(`Status: ${row.status || '-'}`);
            console.log(`Etapa: ${row.etapa || '-'}`);
            console.log(`Data Criação: ${row.data_criacao || '-'}`);
            console.log('');
          });
        }
        
        // Estatísticas
        console.log('\n📈 Estatísticas:\n');
        
        db.all(`
          SELECT status, COUNT(*) as quantidade
          FROM negocios
          WHERE status IS NOT NULL AND status != ''
          GROUP BY status
          ORDER BY quantidade DESC
          LIMIT 10
        `, [], (err, statusRows) => {
          if (!err) {
            console.log('Status mais comuns:');
            statusRows.forEach((row, index) => {
              console.log(`   ${index + 1}. ${row.status}: ${row.quantidade} registros`);
            });
          }
          
          db.all(`
            SELECT etapa, COUNT(*) as quantidade
            FROM negocios
            WHERE etapa IS NOT NULL AND etapa != ''
            GROUP BY etapa
            ORDER BY quantidade DESC
          `, [], (err2, etapaRows) => {
            if (!err2) {
              console.log('\nEtapas mais comuns:');
              etapaRows.forEach((row, index) => {
                console.log(`   ${index + 1}. ${row.etapa}: ${row.quantidade} registros`);
              });
            }
            
            db.close();
          });
        });
      });
    });
  });
});
