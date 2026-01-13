const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');

console.log('🔍 VERIFICAÇÃO PRECISA: DATAS NO BANCO vs PLANILHAS EXCEL\n');
console.log('='.repeat(100) + '\n');

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
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
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

// Normalizar para comparação (case-insensitive, trim, espaços)
function normalizar(str) {
  return (str || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

// Ler todas as planilhas
console.log('📖 Lendo planilhas Excel...\n');
const todosRegistrosExcel = [];

planilhas.forEach(planilhaNome => {
  const planilhaPath = path.join(planilhasDir, planilhaNome);
  
  try {
    const workbook = XLSX.readFile(planilhaPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    data.forEach(row => {
      const empresa = (row['Negócio - Empresa'] || row['﻿Negócio - Empresa'] || '').toString().trim();
      const equipamento = (row['Equipamento'] || '').toString().trim();
      
      if (empresa && equipamento) {
        const dataCriacaoRaw = row['Negócio criado em'] || row['Data Criação'] || row['DATA CRIAÇÃO'];
        const dataCriacaoISO = excelDateToJS(dataCriacaoRaw);
        
        todosRegistrosExcel.push({
          planilha: planilhaNome,
          empresa: empresa,
          equipamento: equipamento,
          empresaNorm: normalizar(empresa),
          equipamentoNorm: normalizar(equipamento),
          dataCriacaoRaw: dataCriacaoRaw,
          dataCriacaoISO: dataCriacaoISO
        });
      }
    });
    
    console.log(`   ✅ ${planilhaNome}`);
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
  }
});

console.log(`\n📊 Total lido das planilhas: ${todosRegistrosExcel.length} registros\n`);
console.log('='.repeat(100) + '\n');

// Ler banco de dados
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.all('SELECT * FROM negocios ORDER BY id LIMIT 50', [], (err, negociosDB) => {
  if (err) {
    console.error('❌ Erro ao ler banco:', err.message);
    db.close();
    return;
  }
  
  console.log(`📊 Analisando primeiros 50 negócios do banco...\n`);
  console.log('='.repeat(100) + '\n');
  
  let datasCorretas = 0;
  let datasDiferentes = 0;
  let naoEncontrados = 0;
  
  const exemplosCorretos = [];
  const exemplosDiferentes = [];
  const exemplosNaoEncontrados = [];
  
  negociosDB.forEach((negDB, index) => {
    const empresaNorm = normalizar(negDB.empresa);
    const equipamentoNorm = normalizar(negDB.equipamento);
    const dataCriacaoDB = negDB.data_criacao;
    
    // Buscar nas planilhas
    const correspondencias = todosRegistrosExcel.filter(excel => 
      excel.empresaNorm === empresaNorm && 
      excel.equipamentoNorm === equipamentoNorm
    );
    
    if (correspondencias.length === 0) {
      naoEncontrados++;
      if (exemplosNaoEncontrados.length < 5) {
        exemplosNaoEncontrados.push({
          id: negDB.id,
          empresa: negDB.empresa,
          equipamento: negDB.equipamento,
          dataCriacaoDB: dataCriacaoDB
        });
      }
    } else {
      // Verificar se alguma correspondência tem a mesma data
      const matchExato = correspondencias.find(c => c.dataCriacaoISO === dataCriacaoDB);
      
      if (matchExato) {
        datasCorretas++;
        if (exemplosCorretos.length < 5) {
          exemplosCorretos.push({
            id: negDB.id,
            empresa: negDB.empresa,
            equipamento: negDB.equipamento,
            dataCriacaoDB: dataCriacaoDB,
            planilha: matchExato.planilha,
            status: '✅ MATCH PERFEITO'
          });
        }
      } else {
        datasDiferentes++;
        if (exemplosDiferentes.length < 5) {
          exemplosDiferentes.push({
            id: negDB.id,
            empresa: negDB.empresa,
            equipamento: negDB.equipamento,
            dataCriacaoDB: dataCriacaoDB,
            datasExcel: correspondencias.map(c => ({
              data: c.dataCriacaoISO,
              dataRaw: c.dataCriacaoRaw,
              planilha: c.planilha
            }))
          });
        }
      }
    }
  });
  
  // Relatório
  console.log('📊 RESULTADO (primeiros 50 registros):');
  console.log('='.repeat(100) + '\n');
  
  console.log(`✅ Datas CORRETAS: ${datasCorretas}`);
  console.log(`⚠️  Datas DIFERENTES: ${datasDiferentes}`);
  console.log(`❌ Não encontrados: ${naoEncontrados}`);
  
  const percentCorreto = ((datasCorretas / negociosDB.length) * 100).toFixed(1);
  console.log(`\n🎯 Taxa de sucesso: ${percentCorreto}%\n`);
  
  if (exemplosCorretos.length > 0) {
    console.log('\n✅ EXEMPLOS DE DATAS CORRETAS:\n');
    exemplosCorretos.forEach((ex, i) => {
      console.log(`${i + 1}. [ID ${ex.id}] ${ex.empresa} - ${ex.equipamento}`);
      console.log(`   Data no DB: ${ex.dataCriacaoDB} ✅`);
      console.log(`   Encontrado em: ${ex.planilha}\n`);
    });
  }
  
  if (exemplosDiferentes.length > 0) {
    console.log('\n⚠️  EXEMPLOS DE DATAS DIFERENTES:\n');
    exemplosDiferentes.forEach((ex, i) => {
      console.log(`${i + 1}. [ID ${ex.id}] ${ex.empresa} - ${ex.equipamento}`);
      console.log(`   Data no DB: ${ex.dataCriacaoDB}`);
      ex.datasExcel.forEach(d => {
        console.log(`   Data na ${d.planilha}: ${d.data} (raw: ${d.dataRaw})`);
      });
      console.log('');
    });
  }
  
  if (exemplosNaoEncontrados.length > 0) {
    console.log('\n❌ EXEMPLOS NÃO ENCONTRADOS:\n');
    exemplosNaoEncontrados.forEach((ex, i) => {
      console.log(`${i + 1}. [ID ${ex.id}] ${ex.empresa} - ${ex.equipamento}`);
      console.log(`   Data no DB: ${ex.dataCriacaoDB}\n`);
    });
  }
  
  // Teste final com todos os registros
  console.log('='.repeat(100));
  console.log('🔍 VERIFICANDO TODOS OS REGISTROS DO BANCO...\n');
  
  db.all('SELECT COUNT(*) as total FROM negocios', [], (err, result) => {
    if (err) {
      console.error('Erro:', err.message);
      db.close();
      return;
    }
    
    const totalDB = result[0].total;
    
    db.all('SELECT empresa, equipamento, data_criacao FROM negocios', [], (err, todos) => {
      if (err) {
        console.error('Erro:', err.message);
        db.close();
        return;
      }
      
      let todasDatasCorretas = 0;
      let todasDatasDiferentes = 0;
      let todosNaoEncontrados = 0;
      
      todos.forEach(negDB => {
        const empresaNorm = normalizar(negDB.empresa);
        const equipamentoNorm = normalizar(negDB.equipamento);
        const dataCriacaoDB = negDB.data_criacao;
        
        const correspondencias = todosRegistrosExcel.filter(excel => 
          excel.empresaNorm === empresaNorm && 
          excel.equipamentoNorm === equipamentoNorm
        );
        
        if (correspondencias.length === 0) {
          todosNaoEncontrados++;
        } else {
          const matchExato = correspondencias.find(c => c.dataCriacaoISO === dataCriacaoDB);
          if (matchExato) {
            todasDatasCorretas++;
          } else {
            todasDatasDiferentes++;
          }
        }
      });
      
      console.log(`📊 RESULTADO FINAL (${totalDB} registros):\n`);
      console.log(`✅ Datas CORRETAS: ${todasDatasCorretas}`);
      console.log(`⚠️  Datas DIFERENTES: ${todasDatasDiferentes}`);
      console.log(`❌ Não encontrados: ${todosNaoEncontrados}`);
      
      const percentFinal = ((todasDatasCorretas / totalDB) * 100).toFixed(1);
      console.log(`\n🎯 Taxa de sucesso TOTAL: ${percentFinal}%`);
      
      if (percentFinal >= 95) {
        console.log('\n🎉 SUCESSO! As datas estão batendo corretamente!');
      } else if (percentFinal >= 80) {
        console.log('\n⚠️  ATENÇÃO! Maioria das datas está correta, mas há divergências.');
      } else {
        console.log('\n❌ PROBLEMA! Muitas datas não estão batendo!');
      }
      
      db.close();
    });
  });
});
