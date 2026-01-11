const XLSX = require('xlsx');
const path = require('path');

console.log('📊 Analisando novo arquivo Excel...\n');

const excelPath = 'C:\\Users\\madet\\OneDrive\\Desktop\\CRM PLANILHA COMPILADA 2025 (1).xlsx';

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  console.log(`📄 Planilha: ${sheetName}\n`);
  
  // Converter para JSON
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`📊 Total de linhas: ${data.length}\n`);
  
  // Mostrar colunas
  if (data.length > 0) {
    console.log('📋 Colunas encontradas:');
    Object.keys(data[0]).forEach((col, index) => {
      console.log(`   ${index + 1}. ${col}`);
    });
    
    // Contar linhas não vazias (que têm empresa OU equipamento)
    const linhasValidas = data.filter(row => {
      const empresa = row['EMPRESA'] || row['Empresa'] || '';
      const equipamento = row['EQUIPAMENTO'] || row['Equipamento'] || '';
      return empresa.toString().trim() !== '' || equipamento.toString().trim() !== '';
    });
    
    console.log(`\n✅ Linhas válidas (com dados): ${linhasValidas.length}`);
    console.log(`❌ Linhas vazias: ${data.length - linhasValidas.length}`);
    
    // Mostrar alguns exemplos
    console.log('\n📝 Primeiros 3 registros válidos:\n');
    linhasValidas.slice(0, 3).forEach((row, index) => {
      console.log(`--- Registro ${index + 1} ---`);
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value !== null && value !== undefined && value !== '') {
          console.log(`${key}: ${value}`);
        }
      });
      console.log('');
    });
  } else {
    console.log('⚠️  Nenhuma linha encontrada!');
  }
  
} catch (error) {
  console.error('❌ Erro ao ler o arquivo:', error.message);
}
