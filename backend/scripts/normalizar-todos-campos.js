const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔧 NORMALIZAÇÃO COMPLETA DE TODOS OS CAMPOS\n');

const dbPath = './crm.db';

// Criar backup antes
const backupDir = path.join(__dirname, '..', 'backups');
const timestamp = Date.now();
const backupPath = path.join(backupDir, `crm_backup_antes_normalizar_completo_${timestamp}.db`);

try {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backup criado: crm_backup_antes_normalizar_completo_${timestamp}.db\n`);
} catch (error) {
  console.error('❌ Erro ao criar backup:', error.message);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

// Mapeamentos de normalização
const normalizacoes = {
  etapa: {
    'Contato Inicial': 'Contato inicial'
  },
  origem: {
    'Whatsapp passivo': 'Whatsapp Passivo',
    'Whatsapp ativo': 'Whatsapp Ativo'
  },
  tipo_maquina: {
    'Semi nova': 'Semi Nova'
  },
  tipo_negociacao: {
    'Nacioanlizada': 'Nacionalizada',
    'Nacionalizaa': 'Nacionalizada',
    'Nacioanalizada': 'Nacionalizada',
    'Nacaionalizada': 'Nacionalizada'
  }
};

console.log('📝 Normalizações a serem aplicadas:\n');

db.serialize(() => {
  let totalGeral = 0;
  
  Object.entries(normalizacoes).forEach(([campo, mapa]) => {
    console.log(`\n${campo.toUpperCase()}:`);
    
    Object.entries(mapa).forEach(([de, para]) => {
      db.run(
        `UPDATE negocios SET ${campo} = ? WHERE ${campo} = ?`,
        [para, de],
        function(err) {
          if (err) {
            console.error(`❌ Erro ao normalizar "${de}" em ${campo}:`, err.message);
          } else if (this.changes > 0) {
            console.log(`   ✅ "${de}" → "${para}": ${this.changes} registro(s)`);
            totalGeral += this.changes;
          }
        }
      );
    });
  });
  
  // Aguardar e mostrar resumo final
  setTimeout(() => {
    console.log('\n' + '='.repeat(100));
    console.log('📊 VERIFICAÇÃO PÓS-NORMALIZAÇÃO\n');
    
    // Verificar cada campo
    let index = 0;
    const campos = Object.keys(normalizacoes);
    
    function verificarProximo() {
      if (index >= campos.length) {
        console.log(`\n✅ Normalização completa! ${totalGeral} registros atualizados.\n`);
        db.close();
        return;
      }
      
      const campo = campos[index];
      db.all(`SELECT ${campo}, COUNT(*) as total FROM negocios GROUP BY ${campo} ORDER BY total DESC LIMIT 10`, [], (err, rows) => {
        if (err) {
          console.error(`Erro ao verificar ${campo}:`, err);
        } else {
          console.log(`${campo.toUpperCase()} (top 10):`);
          rows.forEach(r => {
            const valor = r[campo] || '(vazio)';
            console.log(`   "${valor}": ${r.total}`);
          });
          console.log('');
        }
        
        index++;
        verificarProximo();
      });
    }
    
    verificarProximo();
  }, 1000);
});
