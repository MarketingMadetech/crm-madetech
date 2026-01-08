const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Analisando registros em branco...\n');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

// Buscar registros onde empresa e equipamento estão vazios ou NULL
db.all(`
  SELECT id, empresa, equipamento, pessoa_contato, telefone, email, status, 
         data_criacao, origem, observacao
  FROM negocios
  WHERE (empresa IS NULL OR TRIM(empresa) = '') 
    AND (equipamento IS NULL OR TRIM(equipamento) = '')
  LIMIT 10
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    db.close();
    return;
  }
  
  console.log(`📊 Total de registros em branco: ${rows.length > 0 ? '(mostrando os primeiros 10)' : '0'}\n`);
  
  if (rows.length > 0) {
    rows.forEach((row, index) => {
      console.log(`\n--- Registro ${index + 1} (ID: ${row.id}) ---`);
      console.log(`Empresa: "${row.empresa || ''}"`);
      console.log(`Equipamento: "${row.equipamento || ''}"`);
      console.log(`Pessoa Contato: "${row.pessoa_contato || ''}"`);
      console.log(`Telefone: "${row.telefone || ''}"`);
      console.log(`Email: "${row.email || ''}"`);
      console.log(`Status: "${row.status || ''}"`);
      console.log(`Data Criação: "${row.data_criacao || ''}"`);
      console.log(`Origem: "${row.origem || ''}"`);
      console.log(`Observação: "${row.observacao ? row.observacao.substring(0, 50) : ''}"`);
    });
    
    // Contar quantos tem pelo menos algum dado útil
    db.get(`
      SELECT COUNT(*) as com_dados
      FROM negocios
      WHERE (empresa IS NULL OR TRIM(empresa) = '') 
        AND (equipamento IS NULL OR TRIM(equipamento) = '')
        AND (
          (pessoa_contato IS NOT NULL AND TRIM(pessoa_contato) != '') OR
          (telefone IS NOT NULL AND TRIM(telefone) != '') OR
          (email IS NOT NULL AND TRIM(email) != '')
        )
    `, [], (err2, result) => {
      if (!err2) {
        console.log(`\n\n📊 Desses registros em branco:`);
        console.log(`   - ${result.com_dados} têm pelo menos pessoa/telefone/email`);
        console.log(`   - Podem estar completamente vazios ou só com outros campos`);
      }
      db.close();
    });
  } else {
    console.log('✅ Não há registros em branco!');
    db.close();
  }
});
