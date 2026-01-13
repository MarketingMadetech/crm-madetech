const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'crm.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Ajustando campos de moedas...\n');

// Remover as 8 colunas antigas de moedas
const colunasRemover = [
  'valor_produto_usd', 'valor_oferta_usd', 'valor_fabrica_usd', 'valor_brasil_usd',
  'valor_produto_eur', 'valor_oferta_eur', 'valor_fabrica_eur', 'valor_brasil_eur'
];

// Adicionar 3 novas colunas para armazenar a moeda selecionada
const colunasAdicionar = [
  { campo: 'valor_produto_moeda', tipo: 'TEXT', padrao: 'BRL' },
  { campo: 'valor_fabrica_moeda', tipo: 'TEXT', padrao: 'BRL' },
  { campo: 'valor_brasil_moeda', tipo: 'TEXT', padrao: 'BRL' }
];

console.log('⚠️  Nota: SQLite não suporta DROP COLUMN diretamente.');
console.log('   As colunas antigas permanecerão, mas não serão usadas.\n');

let contador = 0;

function adicionarColuna(index) {
  if (index >= colunasAdicionar.length) {
    console.log(`\n✅ ${contador} colunas adicionadas com sucesso!`);
    console.log('\n📊 Estrutura atualizada:');
    
    db.all(`PRAGMA table_info(negocios)`, (err, columns) => {
      if (err) {
        console.error('❌ Erro ao verificar estrutura:', err.message);
      } else {
        const moedaCols = columns.filter(col => col.name.includes('_moeda'));
        moedaCols.forEach(col => {
          console.log(`   - ${col.name} (${col.type}) default: ${col.dflt_value || 'NULL'}`);
        });
      }
      db.close();
    });
    return;
  }

  const { campo, tipo, padrao } = colunasAdicionar[index];
  
  db.run(`ALTER TABLE negocios ADD COLUMN ${campo} ${tipo} DEFAULT '${padrao}'`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`⚠️  Coluna ${campo} já existe, pulando...`);
      } else {
        console.error(`❌ Erro ao adicionar ${campo}:`, err.message);
      }
    } else {
      contador++;
      console.log(`✅ Coluna ${campo} adicionada (default: ${padrao})`);
    }
    
    adicionarColuna(index + 1);
  });
}

// Iniciar processo
adicionarColuna(0);
