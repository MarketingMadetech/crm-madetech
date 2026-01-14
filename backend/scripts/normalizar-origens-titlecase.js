const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(dbPath);

// Preposições e artigos que devem ficar em minúsculo (exceto no início)
const preposicoes = [
  'a', 'à', 'ao', 'aos', 'as',
  'com', 'contra',
  'da', 'das', 'de', 'do', 'dos',
  'em', 'e',
  'na', 'nas', 'no', 'nos',
  'o', 'os',
  'para', 'pelo', 'pela', 'pelos', 'pelas', 'por',
  'um', 'uma', 'uns', 'umas'
];

// Função para converter para Title Case respeitando preposições
function toTitleCase(str) {
  const palavras = str.trim().split(/\s+/);
  
  return palavras.map((palavra, index) => {
    const palavraLower = palavra.toLowerCase();
    
    // Primeira palavra sempre com maiúscula, mesmo que seja preposição
    if (index === 0) {
      return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
    }
    
    // Se for preposição, mantém minúscula
    if (preposicoes.includes(palavraLower)) {
      return palavraLower;
    }
    
    // Caso contrário, Title Case
    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
  }).join(' ');
}

console.log('🔧 NORMALIZAÇÃO DE ORIGENS PARA TITLE CASE\n');

// Busca todas as origens únicas
db.all(
  `SELECT DISTINCT origem 
   FROM negocios 
   WHERE origem IS NOT NULL AND origem != ''
   ORDER BY origem`,
  [],
  (err, rows) => {
    if (err) {
      console.error('❌ Erro ao consultar origens:', err.message);
      db.close();
      return;
    }

    // Cria mapeamento de origem antiga → origem nova
    const normalizacoes = {};
    let mudancas = 0;

    rows.forEach(row => {
      const origemOriginal = row.origem;
      const origemNormalizada = toTitleCase(origemOriginal);
      
      if (origemOriginal !== origemNormalizada) {
        normalizacoes[origemOriginal] = origemNormalizada;
        mudancas++;
      }
    });

    if (mudancas === 0) {
      console.log('✅ Todas as origens já estão no formato correto!\n');
      db.close();
      return;
    }

    console.log(`📋 Origens a serem normalizadas: ${mudancas}\n`);

    // Mostra exemplos
    const exemplos = Object.entries(normalizacoes).slice(0, 10);
    console.log('📝 Exemplos de mudanças:\n');
    exemplos.forEach(([antiga, nova]) => {
      console.log(`   "${antiga}"`);
      console.log(`   → "${nova}"\n`);
    });

    if (mudancas > 10) {
      console.log(`   ... e mais ${mudancas - 10} origens\n`);
    }

    // Cria backup antes de modificar
    const backupName = `crm_backup_antes_normalizar_origens_titlecase_${Date.now()}.db`;
    const backupPath = path.join(__dirname, '..', 'backups', backupName);

    console.log(`💾 Criando backup: ${backupName}`);
    const fs = require('fs');
    
    // Garante que a pasta backups existe
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }
    
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ Backup criado!\n');

    // Conta registros que serão afetados
    console.log('📊 Contando registros afetados...\n');
    const promises = [];
    let totalAfetados = 0;

    for (const [origemAntiga, origemNova] of Object.entries(normalizacoes)) {
      const promise = new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as total FROM negocios WHERE origem = ?',
          [origemAntiga],
          (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            if (row.total > 0) {
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

        let atualizados = 0;
        const total = Object.entries(normalizacoes).length;

        for (const [origemAntiga, origemNova] of Object.entries(normalizacoes)) {
          db.run(
            'UPDATE negocios SET origem = ? WHERE origem = ?',
            [origemNova, origemAntiga],
            function(err) {
              if (err) {
                console.error(`❌ Erro ao atualizar "${origemAntiga}":`, err.message);
              } else if (this.changes > 0) {
                atualizados++;
                if (atualizados <= 5 || atualizados === total) {
                  console.log(`✅ "${origemAntiga}" → "${origemNova}" (${this.changes} registro(s))`);
                }
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
            console.log(`💾 Backup salvo em: backups/${backupName}`);
            
            // Verifica resultado
            db.get(
              `SELECT COUNT(DISTINCT origem) as total 
               FROM negocios 
               WHERE origem IS NOT NULL AND origem != ''`,
              (err, row) => {
                if (!err) {
                  console.log(`📊 Total de origens únicas após normalização: ${row.total}`);
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
  }
);
