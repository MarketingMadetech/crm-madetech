const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔄 Normalizando valores de Status e Etapa...\n');

const dbPath = path.join(__dirname, '..', 'crm.db');
const backupDir = path.join(__dirname, '..', 'backups');
const backupPath = path.join(backupDir, `crm_backup_antes_normalizar_${Date.now()}.db`);

// Criar backup
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

console.log('💾 Criando backup...');
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ Backup criado: ${path.basename(backupPath)}\n`);

const db = new sqlite3.Database(dbPath);

// Mapeamento de normalização
const normalizacaoStatus = {
  'Suspenso': 'SUSPENSO',
  'Proposta Enviada': 'Proposta enviada',
  'Cancelado': 'CANCELADO'
};

const normalizacaoEtapa = {
  'Cliente contatado': 'Cliente Contatado'
};

console.log('📝 Normalizando STATUS...\n');

let totalAtualizacoesStatus = 0;
let totalAtualizacoesEtapa = 0;

// Normalizar Status
Object.entries(normalizacaoStatus).forEach(([de, para]) => {
  db.run('UPDATE negocios SET status = ? WHERE status = ?', [para, de], function(err) {
    if (err) {
      console.error(`❌ Erro ao atualizar "${de}":`, err.message);
    } else if (this.changes > 0) {
      console.log(`✅ "${de}" → "${para}" (${this.changes} registros)`);
      totalAtualizacoesStatus += this.changes;
    }
  });
});

// Aguardar um pouco e normalizar Etapa
setTimeout(() => {
  console.log('\n📝 Normalizando ETAPA...\n');
  
  Object.entries(normalizacaoEtapa).forEach(([de, para]) => {
    db.run('UPDATE negocios SET etapa = ? WHERE etapa = ?', [para, de], function(err) {
      if (err) {
        console.error(`❌ Erro ao atualizar "${de}":`, err.message);
      } else if (this.changes > 0) {
        console.log(`✅ "${de}" → "${para}" (${this.changes} registros)`);
        totalAtualizacoesEtapa += this.changes;
      }
    });
  });
  
  // Verificar resultado final
  setTimeout(() => {
    console.log('\n\n📊 Verificando valores únicos após normalização...\n');
    
    db.all(`
      SELECT status, COUNT(*) as quantidade
      FROM negocios
      WHERE status IS NOT NULL AND status != ''
      GROUP BY status
      ORDER BY quantidade DESC
    `, [], (err, rows) => {
      if (!err) {
        console.log('STATUS únicos:');
        rows.forEach((row, index) => {
          console.log(`   ${index + 1}. "${row.status}" - ${row.quantidade} registros`);
        });
      }
      
      db.all(`
        SELECT etapa, COUNT(*) as quantidade
        FROM negocios
        WHERE etapa IS NOT NULL AND etapa != ''
        GROUP BY etapa
        ORDER BY quantidade DESC
      `, [], (err2, rows2) => {
        if (!err2) {
          console.log('\nETAPA únicos:');
          rows2.forEach((row, index) => {
            console.log(`   ${index + 1}. "${row.etapa}" - ${row.quantidade} registros`);
          });
        }
        
        console.log(`\n✅ Normalização concluída!`);
        console.log(`💾 Backup: backups/${path.basename(backupPath)}`);
        db.close();
      });
    });
  }, 500);
}, 500);
