const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔧 NORMALIZAÇÃO DE STATUS E ETAPAS\n');

const dbPath = './crm.db';

// Criar backup antes
const backupDir = path.join(__dirname, '..', 'backups');
const timestamp = Date.now();
const backupPath = path.join(backupDir, `crm_backup_antes_normalizar_status_${timestamp}.db`);

try {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backup criado: crm_backup_antes_normalizar_status_${timestamp}.db\n`);
} catch (error) {
  console.error('❌ Erro ao criar backup:', error.message);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

// Mapeamento de normalizações de STATUS
const statusNormalizacoes = {
  'Venda Confirmada': 'VENDA CONFIRMADA',
  'Cancelado': 'CANCELADO',
  'Suspenso': 'SUSPENSO',
  'Proposta Enviada': 'Proposta enviada'  // Manter padrão atual
};

// Mapeamento de normalizações de ETAPA
const etapaNormalizacoes = {
  // Já estão normalizadas: "Cliente Contatado", "Em andamento", "Proposta Enviada"
};

console.log('📝 Normalizações de STATUS a serem aplicadas:\n');
Object.entries(statusNormalizacoes).forEach(([de, para]) => {
  console.log(`   "${de}" → "${para}"`);
});

db.serialize(() => {
  let totalAtualizados = 0;
  
  // Normalizar cada status
  Object.entries(statusNormalizacoes).forEach(([valorAntigo, valorNovo]) => {
    db.run(
      'UPDATE negocios SET status = ? WHERE status = ?',
      [valorNovo, valorAntigo],
      function(err) {
        if (err) {
          console.error(`❌ Erro ao normalizar "${valorAntigo}":`, err.message);
        } else if (this.changes > 0) {
          console.log(`✅ "${valorAntigo}" → "${valorNovo}": ${this.changes} registro(s)`);
          totalAtualizados += this.changes;
        }
      }
    );
  });
  
  // Aguardar conclusão e mostrar resultado final
  db.all('SELECT status, COUNT(*) as total FROM negocios GROUP BY status ORDER BY total DESC', [], (err, rows) => {
    if (err) {
      console.error('Erro:', err);
    } else {
      console.log('\n📊 Distribuição de STATUS após normalização:\n');
      rows.forEach(r => {
        console.log(`   "${r.status}": ${r.total}`);
      });
      
      // Verificar vendas confirmadas
      const vendas = rows.find(r => r.status === 'VENDA CONFIRMADA');
      if (vendas) {
        console.log(`\n✅ Total de VENDA CONFIRMADA: ${vendas.total}`);
      }
    }
    
    db.close(() => {
      console.log('\n✅ Normalização concluída!\n');
    });
  });
});
