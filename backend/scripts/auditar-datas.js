const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('🔍 AUDITORIA DE DATAS: Verificando cada negócio do DB\n');

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

// Normalizar string para comparação
function normalizar(str) {
  return (str || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

// Ler todas as planilhas primeiro
console.log('📖 Lendo planilhas originais...\n');
const todosRegistrosExcel = [];

planilhas.forEach(planilhaNome => {
  const planilhaPath = path.join(planilhasDir, planilhaNome);
  
  try {
    const workbook = XLSX.readFile(planilhaPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    data.forEach(row => {
      const empresa = (row['Empresa'] || row['EMPRESA'] || '').toString().trim();
      const equipamento = (row['Equipamento'] || row['EQUIPAMENTO'] || '').toString().trim();
      
      if (empresa || equipamento) {
        todosRegistrosExcel.push({
          planilha: planilhaNome,
          empresa,
          equipamento,
          dataCriacao: excelDateToJS(row['Data Criação'] || row['DATA CRIAÇÃO'] || row['Data de Criação']),
          empresaNorm: normalizar(empresa),
          equipamentoNorm: normalizar(equipamento)
        });
      }
    });
    
    console.log(`   ✅ ${planilhaNome}`);
  } catch (error) {
    console.error(`   ❌ Erro: ${planilhaNome}:`, error.message);
  }
});

console.log(`\n📊 Total lido das planilhas: ${todosRegistrosExcel.length} registros\n`);

// Ler banco de dados
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.all('SELECT * FROM negocios ORDER BY id', [], (err, negociosDB) => {
  if (err) {
    console.error('❌ Erro ao ler banco:', err.message);
    db.close();
    return;
  }
  
  console.log(`📊 Analisando ${negociosDB.length} negócios do banco...\n`);
  console.log('='.repeat(100) + '\n');
  
  const resultados = {
    datasCorretas: [],
    datasDiferentes: [],
    naoEncontrados: [],
    semDataNoPlanilha: []
  };
  
  negociosDB.forEach((negDB, index) => {
    const empresaNorm = normalizar(negDB.empresa);
    const equipamentoNorm = normalizar(negDB.equipamento);
    const dataCriacaoDB = negDB.data_criacao;
    
    // Buscar correspondência nas planilhas
    const correspondencias = todosRegistrosExcel.filter(excel => 
      excel.empresaNorm === empresaNorm && 
      excel.equipamentoNorm === equipamentoNorm
    );
    
    if (correspondencias.length === 0) {
      resultados.naoEncontrados.push({
        id: negDB.id,
        empresa: negDB.empresa,
        equipamento: negDB.equipamento,
        dataCriacaoDB
      });
    } else {
      // Verificar se alguma correspondência tem a mesma data
      const matchExato = correspondencias.find(c => c.dataCriacao === dataCriacaoDB);
      
      if (matchExato) {
        resultados.datasCorretas.push({
          id: negDB.id,
          empresa: negDB.empresa,
          equipamento: negDB.equipamento,
          dataCriacaoDB,
          planilha: matchExato.planilha
        });
      } else {
        // Verificar se tem data na planilha
        const comData = correspondencias.filter(c => c.dataCriacao);
        
        if (comData.length === 0) {
          resultados.semDataNoPlanilha.push({
            id: negDB.id,
            empresa: negDB.empresa,
            equipamento: negDB.equipamento,
            dataCriacaoDB,
            planilhas: correspondencias.map(c => c.planilha)
          });
        } else {
          resultados.datasDiferentes.push({
            id: negDB.id,
            empresa: negDB.empresa,
            equipamento: negDB.equipamento,
            dataCriacaoDB,
            datasExcel: comData.map(c => ({
              data: c.dataCriacao,
              planilha: c.planilha
            }))
          });
        }
      }
    }
    
    // Progresso
    if ((index + 1) % 100 === 0) {
      console.log(`⏳ Processados ${index + 1}/${negociosDB.length} negócios...`);
    }
  });
  
  // Relatório final
  console.log('\n' + '='.repeat(100));
  console.log('📊 RESULTADO DA AUDITORIA DE DATAS');
  console.log('='.repeat(100) + '\n');
  
  console.log(`✅ Datas CORRETAS (match perfeito): ${resultados.datasCorretas.length}`);
  console.log(`⚠️  Datas DIFERENTES: ${resultados.datasDiferentes.length}`);
  console.log(`❌ Não encontrados nas planilhas: ${resultados.naoEncontrados.length}`);
  console.log(`⚠️  Sem data na planilha: ${resultados.semDataNoPlanilha.length}`);
  
  // Mostrar detalhes das discrepâncias
  if (resultados.datasDiferentes.length > 0) {
    console.log('\n\n🔍 DATAS DIFERENTES (primeiros 20):\n');
    resultados.datasDiferentes.slice(0, 20).forEach((item, index) => {
      console.log(`${index + 1}. [ID ${item.id}] ${item.empresa} - ${item.equipamento}`);
      console.log(`   Data no DB: ${item.dataCriacaoDB || 'NULL'}`);
      item.datasExcel.forEach(dx => {
        console.log(`   Data na ${dx.planilha}: ${dx.data}`);
      });
      console.log('');
    });
    
    if (resultados.datasDiferentes.length > 20) {
      console.log(`   ... e mais ${resultados.datasDiferentes.length - 20} casos\n`);
    }
  }
  
  if (resultados.naoEncontrados.length > 0) {
    console.log('\n\n❌ NÃO ENCONTRADOS NAS PLANILHAS (primeiros 20):\n');
    resultados.naoEncontrados.slice(0, 20).forEach((item, index) => {
      console.log(`${index + 1}. [ID ${item.id}] ${item.empresa} - ${item.equipamento}`);
      console.log(`   Data no DB: ${item.dataCriacaoDB || 'NULL'}`);
      console.log('');
    });
    
    if (resultados.naoEncontrados.length > 20) {
      console.log(`   ... e mais ${resultados.naoEncontrados.length - 20} casos\n`);
    }
  }
  
  // Salvar relatório completo
  const relatorioPath = path.join(__dirname, '..', 'auditoria_datas.json');
  fs.writeFileSync(relatorioPath, JSON.stringify({
    dataAuditoria: new Date().toISOString(),
    totalNegociosDB: negociosDB.length,
    totalRegistrosExcel: todosRegistrosExcel.length,
    resumo: {
      datasCorretas: resultados.datasCorretas.length,
      datasDiferentes: resultados.datasDiferentes.length,
      naoEncontrados: resultados.naoEncontrados.length,
      semDataNoPlanilha: resultados.semDataNoPlanilha.length
    },
    datasCorretas: resultados.datasCorretas,
    datasDiferentes: resultados.datasDiferentes,
    naoEncontrados: resultados.naoEncontrados,
    semDataNoPlanilha: resultados.semDataNoPlanilha
  }, null, 2));
  
  console.log(`\n💾 Relatório completo salvo em: auditoria_datas.json`);
  
  db.close();
});
