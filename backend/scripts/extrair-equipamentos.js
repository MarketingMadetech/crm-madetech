const fs = require('fs');
const path = require('path');

console.log('🔍 Analisando equipamentos do CSV...\n');

const csvPath = path.join(__dirname, '..', 'CRM_ATUALIZADO_2025.csv');

try {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').filter(line => line.trim());
  
  // Pegar cabeçalho
  const header = lines[0].split(',');
  const equipamentoIndex = header.indexOf('Equipamento');
  
  console.log(`📊 Total de registros: ${lines.length - 1}`);
  console.log(`📍 Coluna de Equipamento na posição: ${equipamentoIndex}\n`);
  
  // Extrair equipamentos únicos
  const equipamentos = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols[equipamentoIndex] && cols[equipamentoIndex].trim()) {
      equipamentos.add(cols[equipamentoIndex].trim());
    }
  }
  
  // Ordenar alfabeticamente
  const equipamentosOrdenados = Array.from(equipamentos).sort();
  
  console.log(`✅ Encontrados ${equipamentosOrdenados.length} equipamentos únicos:\n`);
  
  equipamentosOrdenados.forEach((eq, index) => {
    console.log(`${index + 1}. ${eq}`);
  });
  
  // Salvar em arquivo JSON para fácil uso
  const outputPath = path.join(__dirname, '..', 'equipamentos_extraidos.json');
  fs.writeFileSync(outputPath, JSON.stringify(equipamentosOrdenados, null, 2), 'utf8');
  
  console.log(`\n💾 Lista salva em: ${outputPath}`);
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
