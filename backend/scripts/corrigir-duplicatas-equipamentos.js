const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db');

// Mapeamento de correções: chave = nome errado, valor = nome correto (padronizado)
const CORRECOES = {
  // Padrão: "Coladeira de Bordos" com B maiúsculo
  "Coladeira de bordos Astra + R": "Coladeira de Bordos Astra + R",
  "Coladeira de bordos Ultimate": "Coladeira de Bordos Ultimate",
  "Coladeira de bordos Vectra": "Coladeira de Bordos Vectra",
  
  // Padrão: "Contour S Line" com L maiúsculo
  "Contour S line": "Contour S Line",
  
  // Outras correções encontradas
  "Centro de Furação  PT6.5": "Centro de Furação PT6.5", // espaço duplo
  "Coladeita de Bordos Prime 4GS": "Coladeira de Bordos Prime 4GS", // typo
  "Nesting3020 Marchiori": "Nesting 3020 Marchiori", // espaço faltando
};

console.log('=== CORREÇÃO DE DUPLICATAS DE EQUIPAMENTOS ===\n');
console.log('Correções a serem aplicadas:\n');

Object.keys(CORRECOES).forEach(errado => {
  console.log(`  "${errado}" → "${CORRECOES[errado]}"`);
});

console.log('\n');

// Aplicar cada correção
let totalCorrigidos = 0;

const aplicarCorrecoes = () => {
  const correcoes = Object.entries(CORRECOES);
  let index = 0;

  const aplicarProxima = () => {
    if (index >= correcoes.length) {
      console.log(`\n✅ Total de registros corrigidos: ${totalCorrigidos}`);
      db.close();
      return;
    }

    const [errado, correto] = correcoes[index];
    
    db.run(
      `UPDATE negocios SET equipamento = ? WHERE equipamento = ?`,
      [correto, errado],
      function(err) {
        if (err) {
          console.error(`❌ Erro ao corrigir "${errado}":`, err.message);
        } else if (this.changes > 0) {
          console.log(`✅ "${errado}" → "${correto}" (${this.changes} registro(s))`);
          totalCorrigidos += this.changes;
        } else {
          console.log(`⚪ "${errado}" - nenhum registro encontrado`);
        }
        
        index++;
        aplicarProxima();
      }
    );
  };

  aplicarProxima();
};

// Confirmar antes de executar
console.log('Iniciando correções...\n');
aplicarCorrecoes();
