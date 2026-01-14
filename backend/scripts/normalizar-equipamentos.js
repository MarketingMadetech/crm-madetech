const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

// Mapeamento de variações para o formato padronizado (Title Case)
const normalizacoes = {
  // Coladeira de Bordos Astra + R
  'Coladeira de bordos Astra + R': 'Coladeira de Bordos Astra + R',
  
  // Coladeira de Bordos Ultimate  
  'Coladeira de bordos Ultimate': 'Coladeira de Bordos Ultimate',
  
  // Coladeira de Bordos Vectra
  'Coladeira de bordos Vectra': 'Coladeira de Bordos Vectra',
  
  // Contour S Line
  'Contour S line': 'Contour S Line'
};

console.log('🔧 NORMALIZAÇÃO DE EQUIPAMENTOS\n');
console.log('📋 Equipamentos a serem normalizados:', Object.keys(normalizacoes).length);
console.log('');

// Cria backup antes de modificar
const backupName = `crm_backup_antes_normalizar_equipamentos_${Date.now()}.db`;
const backupPath = path.join(__dirname, '..', backupName);

console.log(`💾 Criando backup: ${backupName}`);
const fs = require('fs');
fs.copyFileSync(dbPath, backupPath);
console.log('✅ Backup criado!\n');

// Conta registros que serão afetados
let totalAfetados = 0;
const promises = [];

for (const [equipamentoAntigo, equipamentoNovo] of Object.entries(normalizacoes)) {
  const promise = new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as total FROM negocios WHERE equipamento = ?',
      [equipamentoAntigo],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (row.total > 0) {
          console.log(`📦 "${equipamentoAntigo}"`);
          console.log(`   → "${equipamentoNovo}"`);
          console.log(`   💼 ${row.total} negócio(s) afetado(s)\n`);
          totalAfetados += row.total;
        }
        resolve();
      }
    );
  });
  promises.push(promise);
}

Promise.all(promises).then(() => {
  console.log(`📊 Total de registros a serem atualizados: ${totalAfetados}\n`);
  console.log('🔄 Iniciando normalização...\n');

  // Executa as atualizações
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    for (const [equipamentoAntigo, equipamentoNovo] of Object.entries(normalizacoes)) {
      db.run(
        'UPDATE negocios SET equipamento = ? WHERE equipamento = ?',
        [equipamentoNovo, equipamentoAntigo],
        function(err) {
          if (err) {
            console.error(`❌ Erro ao atualizar "${equipamentoAntigo}":`, err.message);
          } else if (this.changes > 0) {
            console.log(`✅ Atualizado: "${equipamentoAntigo}" → "${equipamentoNovo}" (${this.changes} registro(s))`);
          }
        }
      );
    }

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('❌ Erro ao finalizar transação:', err.message);
        db.run('ROLLBACK');
      } else {
        console.log('\n✨ Normalização concluída com sucesso!');
        console.log(`💾 Backup salvo em: ${backupName}`);
        
        // Verifica resultado
        db.get(
          `SELECT COUNT(DISTINCT equipamento) as total 
           FROM negocios 
           WHERE equipamento IS NOT NULL AND equipamento != ''`,
          (err, row) => {
            if (!err) {
              console.log(`📊 Total de equipamentos únicos após normalização: ${row.total}`);
            }
            db.close();
          }
        );
      }
    });
  });
}).catch(err => {
  console.error('❌ Erro durante auditoria:', err.message);
  db.close();
});
