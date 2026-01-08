const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('📊 Iniciando conversão de Excel para CSV...\n');

// Caminho do arquivo Excel
const excelPath = 'C:\\Users\\madet\\OneDrive\\Desktop\\CRM PLANILHA COMPILADA 2025 (1).xlsx';
const csvPath = path.join(__dirname, '..', 'CRM_ATUALIZADO_2025.csv');

try {
  // Ler o arquivo Excel
  console.log('📖 Lendo arquivo Excel...');
  const workbook = XLSX.readFile(excelPath);
  
  // Pegar a primeira planilha
  const sheetName = workbook.SheetNames[0];
  console.log(`📄 Planilha encontrada: ${sheetName}`);
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para CSV
  console.log('🔄 Convertendo para CSV...');
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Salvar arquivo CSV
  fs.writeFileSync(csvPath, csv, 'utf8');
  
  console.log(`✅ CSV criado com sucesso: ${csvPath}`);
  
  // Contar linhas
  const lines = csv.split('\n').filter(line => line.trim());
  console.log(`📊 Total de linhas: ${lines.length} (${lines.length - 1} registros + cabeçalho)`);
  
  // Mostrar cabeçalho
  console.log('\n📋 Cabeçalho do CSV:');
  console.log(lines[0]);
  
  // Mostrar primeiro registro
  console.log('\n📝 Exemplo de primeiro registro:');
  console.log(lines[1]);
  
} catch (error) {
  console.error('❌ Erro ao converter arquivo:', error.message);
  process.exit(1);
}
