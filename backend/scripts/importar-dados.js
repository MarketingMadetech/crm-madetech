const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando importação de dados...\n');

// Caminhos
const dbPath = path.join(__dirname, '..', 'crm.db');
const csvPath = path.join(__dirname, '..', 'CRM_ATUALIZADO_2025.csv');
const backupPath = path.join(__dirname, '..', 'backups', `crm_backup_antes_importacao_${Date.now()}.db`);

// Criar diretório de backups se não existir
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Fazer backup do banco atual
console.log('💾 Fazendo backup do banco atual...');
try {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backup salvo em: ${backupPath}\n`);
} catch (error) {
  console.error('❌ Erro ao fazer backup:', error.message);
  process.exit(1);
}

// Abrir banco de dados
const db = new sqlite3.Database(dbPath);

// Função para limpar valores monetários
function limparValor(valor) {
  if (!valor || valor === '$-' || valor.trim() === '') return 0;
  // Remove R$, $, espaços e converte vírgulas em pontos
  return parseFloat(valor.replace(/[R$\s]/g, '').replace(',', '') || '0');
}

// Função para formatar data
function formatarData(data) {
  if (!data || data.trim() === '') return null;
  try {
    // Tenta converter diferentes formatos de data
    const d = new Date(data);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  } catch {
    return null;
  }
}

// Ler e processar CSV
console.log('📖 Lendo arquivo CSV...');
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n').filter(line => line.trim());

// Pegar cabeçalho
const header = lines[0].split(',');
console.log(`📊 Total de registros a importar: ${lines.length - 1}\n`);

// Limpar tabela de negócios
console.log('🗑️  Limpando dados antigos...');
db.run('DELETE FROM negocios', (err) => {
  if (err) {
    console.error('❌ Erro ao limpar tabela:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Tabela limpa\n');
  console.log('📥 Iniciando importação...\n');
  
  let importados = 0;
  let erros = 0;
  
  // Preparar statement de inserção
  const stmt = db.prepare(`
    INSERT INTO negocios (
      empresa, pessoa_contato, telefone, email, equipamento, tipo_maquina, tipo_negociacao,
      valor_produto, valor_oferta, valor_fabrica, valor_brasil,
      data_criacao, data_fechamento, etapa, status, origem, observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Processar cada linha
  for (let i = 1; i < lines.length; i++) {
    try {
      // Parse CSV considerando campos entre aspas
      const cols = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current.trim()); // Adicionar último campo
      
      // Extrair dados
      const empresa = cols[0] || '';
      const pessoa_contato = cols[1] || '';
      const equipamento = cols[2] || '';
      const tipo_maquina = cols[3] || '';
      const tipo_negociacao = cols[4] || '';
      const valor_produto = limparValor(cols[5]);
      const valor_oferta = limparValor(cols[6]);
      const valor_fabrica = limparValor(cols[7]);
      const valor_brasil = limparValor(cols[8]);
      const data_criacao = formatarData(cols[9]);
      const data_fechamento = formatarData(cols[10]);
      const etapa = cols[11] || '';
      const status = cols[12] || '';
      const origem = cols[13] || '';
      const observacao = cols[14] || '';
      
      // Inserir no banco
      stmt.run(
        empresa, pessoa_contato, '', '', equipamento, tipo_maquina, tipo_negociacao,
        valor_produto, valor_oferta, valor_fabrica, valor_brasil,
        data_criacao, data_fechamento, etapa, status, origem, observacao,
        (err) => {
          if (err) {
            erros++;
            if (erros <= 5) { // Mostrar apenas os primeiros 5 erros
              console.error(`❌ Erro na linha ${i}:`, err.message);
            }
          }
        }
      );
      
      importados++;
      
      // Mostrar progresso a cada 100 registros
      if (importados % 100 === 0) {
        console.log(`📊 Importados: ${importados}/${lines.length - 1}`);
      }
      
    } catch (error) {
      erros++;
      if (erros <= 5) {
        console.error(`❌ Erro ao processar linha ${i}:`, error.message);
      }
    }
  }
  
  // Finalizar
  stmt.finalize(() => {
    console.log(`\n✅ Importação concluída!`);
    console.log(`📊 Total importados: ${importados}`);
    console.log(`❌ Total de erros: ${erros}`);
    
    db.close();
  });
});
