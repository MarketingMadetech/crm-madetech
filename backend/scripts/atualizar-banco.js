const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('🔄 Iniciando atualização do banco de dados...\n');

const excelPath = 'C:\\Users\\madet\\OneDrive\\Desktop\\CRM PLANILHA COMPILADA 2025 (1).xlsx';
const dbPath = path.join(__dirname, '..', 'crm.db');
const backupDir = path.join(__dirname, '..', 'backups');
const backupPath = path.join(backupDir, `crm_backup_antes_atualizacao_${Date.now()}.db`);

// Criar diretório de backup se não existir
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Fazer backup
console.log('💾 Criando backup do banco atual...');
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ Backup criado: ${path.basename(backupPath)}\n`);

// Função para converter data Excel para formato YYYY-MM-DD
function excelDateToJS(excelDate) {
  if (!excelDate || excelDate === '') return null;
  
  // Se já estiver em formato de data, retornar como está
  if (typeof excelDate === 'string' && excelDate.includes('/')) {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  // Converter número Excel para data
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Função para limpar valores monetários
function limparValor(valor) {
  if (!valor || valor === '' || valor === null) return 0;
  if (typeof valor === 'number') return valor;
  return parseFloat(valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}

try {
  // Ler Excel
  console.log('📖 Lendo arquivo Excel...');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`✅ ${data.length} linhas lidas\n`);
  
  // Filtrar linhas válidas
  const linhasValidas = data.filter(row => {
    const empresa = (row['Empresa'] || '').toString().trim();
    const equipamento = (row['Equipamento'] || '').toString().trim();
    return empresa !== '' || equipamento !== '';
  });
  
  console.log(`✅ ${linhasValidas.length} registros válidos (ignorando vazios)\n`);
  
  // Conectar ao banco
  const db = new sqlite3.Database(dbPath);
  
  // Limpar tabela negocios
  console.log('🗑️  Limpando dados antigos...');
  db.run('DELETE FROM negocios', (err) => {
    if (err) {
      console.error('❌ Erro ao limpar tabela:', err.message);
      db.close();
      return;
    }
    
    console.log('✅ Dados antigos removidos\n');
    console.log('📝 Importando novos dados...\n');
    
    let importados = 0;
    let erros = 0;
    
    const stmt = db.prepare(`
      INSERT INTO negocios (
        empresa, pessoa_contato, telefone, email, equipamento, 
        tipo_maquina, tipo_negociacao, valor_produto, valor_oferta, 
        valor_fabrica, valor_brasil, data_criacao, data_fechamento,
        etapa, status, origem, observacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    linhasValidas.forEach((row, index) => {
      try {
        stmt.run(
          (row['Empresa'] || '').toString().trim(),
          (row['Pessoa de Contato'] || '').toString().trim(),
          '', // telefone (não está na planilha)
          '', // email (não está na planilha)
          (row['Equipamento'] || '').toString().trim(),
          (row['Tipo da Máquina'] || '').toString().trim(),
          (row['Tipo Negociação'] || '').toString().trim(),
          limparValor(row['Valor Produto']),
          limparValor(row['Valor Oferta']),
          limparValor(row['Valor Fábrica']),
          limparValor(row['Valor Brasil']),
          excelDateToJS(row['Data Criação']),
          excelDateToJS(row['Data Fechamento']),
          (row['Etapa'] || '').toString().trim(),
          (row['Status'] || '').toString().trim(),
          (row['Origem'] || '').toString().trim(),
          (row['Observações'] || '').toString().trim() // Mapeando Observações → observacao
        );
        
        importados++;
        
        if ((index + 1) % 100 === 0) {
          console.log(`   ⏳ ${index + 1}/${linhasValidas.length} registros...`);
        }
      } catch (error) {
        erros++;
        console.error(`❌ Erro na linha ${index + 1}:`, error.message);
      }
    });
    
    stmt.finalize(() => {
      db.close(() => {
        console.log('\n✅ Importação concluída!');
        console.log(`📊 Total importados: ${importados}`);
        console.log(`❌ Total de erros: ${erros}`);
        console.log(`💾 Backup: backups/${path.basename(backupPath)}`);
      });
    });
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
