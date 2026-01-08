const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🗑️  Removendo registros vazios...\n');

const dbPath = path.join(__dirname, '..', 'crm.db');
const backupDir = path.join(__dirname, '..', 'backups');
const backupPath = path.join(backupDir, `crm_backup_antes_limpar_vazios_${Date.now()}.db`);

// Criar diretório de backup se não existir
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Fazer backup
console.log('💾 Criando backup...');
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ Backup criado: ${path.basename(backupPath)}\n`);

const db = new sqlite3.Database(dbPath);

// Primeiro, contar quantos serão removidos
db.get(`
  SELECT COUNT(*) as total
  FROM negocios
  WHERE (empresa IS NULL OR TRIM(empresa) = '') 
    AND (equipamento IS NULL OR TRIM(equipamento) = '')
`, [], (err, result) => {
  if (err) {
    console.error('❌ Erro ao contar:', err.message);
    db.close();
    return;
  }
  
  const totalVazios = result.total;
  console.log(`📊 Encontrados ${totalVazios} registros vazios\n`);
  
  if (totalVazios === 0) {
    console.log('✅ Nada para remover!');
    db.close();
    return;
  }
  
  // Remover registros vazios
  console.log('🗑️  Removendo...\n');
  
  db.run(`
    DELETE FROM negocios
    WHERE (empresa IS NULL OR TRIM(empresa) = '') 
      AND (equipamento IS NULL OR TRIM(equipamento) = '')
  `, [], function(err) {
    if (err) {
      console.error('❌ Erro ao remover:', err.message);
      db.close();
      return;
    }
    
    console.log(`✅ ${this.changes} registros removidos com sucesso!\n`);
    
    // Verificar total restante
    db.get('SELECT COUNT(*) as total FROM negocios', [], (err2, result2) => {
      if (!err2) {
        console.log(`📊 Total de registros agora: ${result2.total}`);
        console.log(`📊 Foram removidos: ${totalVazios}`);
        console.log(`📊 Backup salvo em: backups/${path.basename(backupPath)}`);
      }
      db.close();
    });
  });
});
