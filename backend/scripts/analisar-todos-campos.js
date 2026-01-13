const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db', sqlite3.OPEN_READONLY);

console.log('🔍 ANÁLISE COMPLETA DE CAMPOS CATEGÓRICOS DO CRM\n');
console.log('Buscando duplicatas causadas por variações de maiúsculas/minúsculas...\n');
console.log('='.repeat(100) + '\n');

// Função para detectar duplicatas por case
function analisarCampo(campo, callback) {
  db.all(`SELECT ${campo}, COUNT(*) as total FROM negocios GROUP BY ${campo} ORDER BY total DESC`, [], (err, rows) => {
    if (err) {
      console.error(`Erro ao analisar ${campo}:`, err);
      callback();
      return;
    }
    
    // Criar mapa normalizado para detectar duplicatas por case
    const mapa = new Map();
    rows.forEach(row => {
      const valor = row[campo] || '';
      const valorNorm = valor.toString().toLowerCase().trim();
      
      if (!mapa.has(valorNorm)) {
        mapa.set(valorNorm, []);
      }
      mapa.get(valorNorm).push({
        original: valor,
        total: row.total
      });
    });
    
    // Identificar grupos com variações de case
    const duplicatas = [];
    mapa.forEach((variantes, valorNorm) => {
      if (variantes.length > 1) {
        const totalGrupo = variantes.reduce((sum, v) => sum + v.total, 0);
        duplicatas.push({
          valorNormalizado: valorNorm,
          variantes: variantes,
          totalGrupo: totalGrupo
        });
      }
    });
    
    // Relatório do campo
    console.log(`📊 ${campo.toUpperCase()}`);
    console.log('-'.repeat(100));
    
    if (duplicatas.length === 0) {
      console.log('✅ Nenhuma duplicata por case encontrada\n');
    } else {
      console.log(`⚠️  ${duplicatas.length} grupo(s) com variações de case:\n`);
      
      duplicatas.sort((a, b) => b.totalGrupo - a.totalGrupo);
      
      duplicatas.forEach((dup, index) => {
        console.log(`${index + 1}. "${dup.valorNormalizado}" (${dup.totalGrupo} registros total):`);
        dup.variantes.forEach(v => {
          console.log(`   → "${v.original}": ${v.total}`);
        });
        console.log('');
      });
    }
    
    // Mostrar top 10 valores mais comuns
    console.log('📈 Top 10 valores mais comuns:');
    rows.slice(0, 10).forEach((r, i) => {
      const valor = r[campo] || '(vazio)';
      console.log(`   ${i + 1}. "${valor}": ${r.total}`);
    });
    console.log('\n' + '='.repeat(100) + '\n');
    
    callback();
  });
}

// Analisar todos os campos categóricos
const campos = ['status', 'etapa', 'origem', 'tipo_maquina', 'tipo_negociacao'];
let index = 0;

function analisarProximo() {
  if (index >= campos.length) {
    // Resumo final
    console.log('\n📋 RESUMO DA ANÁLISE\n');
    console.log('Campos analisados:');
    campos.forEach(c => console.log(`  • ${c}`));
    
    console.log('\n💡 RECOMENDAÇÕES:\n');
    console.log('1. Normalizar valores duplicados por case');
    console.log('2. Implementar validação no frontend para evitar novas variações');
    console.log('3. Usar dropdowns com valores pré-definidos onde possível');
    console.log('4. Considerar função UPPER() ou LOWER() em queries de agregação\n');
    
    db.close();
    return;
  }
  
  analisarCampo(campos[index], () => {
    index++;
    analisarProximo();
  });
}

analisarProximo();
