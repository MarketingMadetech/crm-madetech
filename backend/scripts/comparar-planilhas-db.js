const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('🔍 AUDITORIA: Comparando DB com planilhas originais\n');

const dbPath = 'C:\\Users\\madet\\OneDrive\\Desktop\\Marketing Madetech\\Planilhas CRM\\CRM MArketing\\backend\\backups\\crm_mais_recente.db';
const planilhasDir = 'C:\\Users\\madet\\OneDrive\\Desktop\\Marketing Madetech\\Planilhas CRM\\CRM MArketing\\backend\\planilhas_originais';

const planilhas = [
  '30.09_PLANILHA DE CONTROLE NEGÓCIOS EM ANDAMENTO.xlsx',
  'PLANILHA DE CONTROLE NEGÓCIOS EM ANDAMENTO CONSOLIDADO.xlsx',
  'PLANILHA DE CONTROLE NEGÓCIOS EM ANDAMENTO CONSOLIDADO 2.xlsx'
];

// Função para converter data Excel
function excelDateToJS(excelDate) {
  if (!excelDate || excelDate === '') return null;
  
  if (typeof excelDate === 'string' && excelDate.includes('/')) {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Ler banco de dados
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.all('SELECT * FROM negocios ORDER BY empresa', [], (err, negociosDB) => {
  if (err) {
    console.error('❌ Erro ao ler banco:', err.message);
    db.close();
    return;
  }
  
  console.log(`📊 Banco de dados: ${negociosDB.length} registros\n`);
  
  // Criar índice por empresa+equipamento
  const dbIndex = {};
  negociosDB.forEach(neg => {
    const key = `${(neg.empresa || '').toLowerCase().trim()}_${(neg.equipamento || '').toLowerCase().trim()}`;
    if (!dbIndex[key]) {
      dbIndex[key] = [];
    }
    dbIndex[key].push(neg);
  });
  
  // Ler planilhas
  const todosRegistrosExcel = [];
  const discrepancias = [];
  
  planilhas.forEach((planilhaNome, index) => {
    const planilhaPath = path.join(planilhasDir, planilhaNome);
    
    console.log(`📄 Lendo: ${planilhaNome}`);
    
    try {
      const workbook = XLSX.readFile(planilhaPath);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      const validos = data.filter(row => {
        const empresa = (row['Empresa'] || row['EMPRESA'] || '').toString().trim();
        const equipamento = (row['Equipamento'] || row['EQUIPAMENTO'] || '').toString().trim();
        return empresa !== '' || equipamento !== '';
      });
      
      console.log(`   ✅ ${validos.length} registros válidos\n`);
      
      validos.forEach(row => {
        const empresa = (row['Empresa'] || row['EMPRESA'] || '').toString().trim();
        const equipamento = (row['Equipamento'] || row['EQUIPAMENTO'] || '').toString().trim();
        const dataCriacaoExcel = excelDateToJS(row['Data Criação'] || row['DATA CRIAÇÃO'] || row['Data de Criação']);
        
        const registro = {
          planilha: planilhaNome,
          empresa,
          equipamento,
          dataCriacao: dataCriacaoExcel,
          pessoaContato: (row['Pessoa de Contato'] || row['PESSOA DE CONTATO'] || '').toString().trim(),
          status: (row['Status'] || row['STATUS'] || '').toString().trim(),
          etapa: (row['Etapa'] || row['ETAPA'] || '').toString().trim()
        };
        
        todosRegistrosExcel.push(registro);
        
        // Comparar com DB
        const key = `${empresa.toLowerCase()}_${equipamento.toLowerCase()}`;
        const correspondentesDB = dbIndex[key];
        
        if (!correspondentesDB || correspondentesDB.length === 0) {
          discrepancias.push({
            tipo: 'AUSENTE_NO_DB',
            planilha: planilhaNome,
            empresa,
            equipamento,
            dataCriacaoExcel,
            dataCriacaoDB: null
          });
        } else {
          // Verificar datas
          correspondentesDB.forEach(negDB => {
            if (dataCriacaoExcel && negDB.data_criacao !== dataCriacaoExcel) {
              discrepancias.push({
                tipo: 'DATA_DIFERENTE',
                planilha: planilhaNome,
                empresa,
                equipamento,
                dataCriacaoExcel,
                dataCriacaoDB: negDB.data_criacao
              });
            }
          });
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro ao ler ${planilhaNome}:`, error.message);
    }
  });
  
  // Verificar registros no DB que não estão nas planilhas
  negociosDB.forEach(negDB => {
    const key = `${(negDB.empresa || '').toLowerCase().trim()}_${(negDB.equipamento || '').toLowerCase().trim()}`;
    const existeExcel = todosRegistrosExcel.some(excel => 
      excel.empresa.toLowerCase().trim() === (negDB.empresa || '').toLowerCase().trim() &&
      excel.equipamento.toLowerCase().trim() === (negDB.equipamento || '').toLowerCase().trim()
    );
    
    if (!existeExcel && negDB.empresa && negDB.equipamento) {
      discrepancias.push({
        tipo: 'AUSENTE_NAS_PLANILHAS',
        planilha: 'N/A',
        empresa: negDB.empresa,
        equipamento: negDB.equipamento,
        dataCriacaoExcel: null,
        dataCriacaoDB: negDB.data_criacao
      });
    }
  });
  
  // Relatório final
  console.log('\n' + '='.repeat(80));
  console.log('📋 RELATÓRIO DE DISCREPÂNCIAS');
  console.log('='.repeat(80) + '\n');
  
  console.log(`📊 Total de registros Excel: ${todosRegistrosExcel.length}`);
  console.log(`📊 Total de registros DB: ${negociosDB.length}`);
  console.log(`⚠️  Total de discrepâncias: ${discrepancias.length}\n`);
  
  if (discrepancias.length > 0) {
    // Agrupar por tipo
    const porTipo = {};
    discrepancias.forEach(disc => {
      if (!porTipo[disc.tipo]) {
        porTipo[disc.tipo] = [];
      }
      porTipo[disc.tipo].push(disc);
    });
    
    Object.entries(porTipo).forEach(([tipo, lista]) => {
      console.log(`\n🔍 ${tipo}: ${lista.length} casos\n`);
      lista.slice(0, 10).forEach((disc, index) => {
        console.log(`${index + 1}. ${disc.empresa} - ${disc.equipamento}`);
        console.log(`   Planilha: ${disc.planilha}`);
        console.log(`   Data Excel: ${disc.dataCriacaoExcel || 'N/A'}`);
        console.log(`   Data DB: ${disc.dataCriacaoDB || 'N/A'}`);
        console.log('');
      });
      
      if (lista.length > 10) {
        console.log(`   ... e mais ${lista.length - 10} casos\n`);
      }
    });
    
    // Salvar relatório completo
    const relatorioPath = path.join(__dirname, '..', 'relatorio_discrepancias.json');
    fs.writeFileSync(relatorioPath, JSON.stringify({
      dataAuditoria: new Date().toISOString(),
      totalExcel: todosRegistrosExcel.length,
      totalDB: negociosDB.length,
      totalDiscrepancias: discrepancias.length,
      discrepancias
    }, null, 2));
    
    console.log(`\n💾 Relatório completo salvo em: relatorio_discrepancias.json`);
  } else {
    console.log('✅ Nenhuma discrepância encontrada! Dados estão consistentes.');
  }
  
  db.close();
});
