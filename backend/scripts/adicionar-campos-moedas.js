const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Adicionando campos de moedas estrangeiras...\n');

// Adicionar colunas para valores em USD e EUR
const alteracoes = [
  { campo: 'valor_produto_usd', tipo: 'REAL' },
  { campo: 'valor_oferta_usd', tipo: 'REAL' },
  { campo: 'valor_fabrica_usd', tipo: 'REAL' },
  { campo: 'valor_brasil_usd', tipo: 'REAL' },
  { campo: 'valor_produto_eur', tipo: 'REAL' },
  { campo: 'valor_oferta_eur', tipo: 'REAL' },
  { campo: 'valor_fabrica_eur', tipo: 'REAL' },
  { campo: 'valor_brasil_eur', tipo: 'REAL' }
];

let contador = 0;

function adicionarColuna(index) {
  if (index >= alteracoes.length) {
    console.log(`\n✅ ${contador} colunas adicionadas com sucesso!`);
    console.log('\n📊 Estrutura atualizada:');
    
    db.all(`PRAGMA table_info(negocios)`, (err, columns) => {
      if (err) {
        console.error('❌ Erro ao verificar estrutura:', err.message);
      } else {
        const moedaCols = columns.filter(col => col.name.includes('_usd') || col.name.includes('_eur'));
        moedaCols.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });
      }
      db.close();
    });
    return;
  }

  const { campo, tipo } = alteracoes[index];
  
  db.run(`ALTER TABLE negocios ADD COLUMN ${campo} ${tipo}`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`⚠️  Coluna ${campo} já existe, pulando...`);
      } else {
        console.error(`❌ Erro ao adicionar ${campo}:`, err.message);
      }
    } else {
      contador++;
      console.log(`✅ Coluna ${campo} adicionada`);
    }
    
    adicionarColuna(index + 1);
  });
}

// Iniciar processo
adicionarColuna(0);
