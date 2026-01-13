const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('🚀 REIMPORTAÇÃO COMPLETA DAS 3 PLANILHAS ORIGINAIS\n');
console.log('Regras aplicadas:');
console.log('  1. Unicidade: empresa + equipamento + data_criacao');
console.log('  2. DESCARTAR registros com empresa OU equipamento vazios');
console.log('  3. Duplicatas com mesma data: manter o mais recente (última planilha)\n');
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
  
  // Formato DD/MM/YYYY
  if (typeof excelDate === 'string' && excelDate.includes('/')) {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  // Número serial do Excel
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Limpar valor monetário
function limparValor(valor) {
  if (!valor || valor === '' || valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return valor;
  
  const valorStr = valor.toString().trim();
  if (valorStr === '$-' || valorStr === '-' || valorStr === 'R$-') return 0;
  
  const cleaned = valorStr
    .replace(/[R$€\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Normalizar string para comparação
function normalizar(str) {
  return (str || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

// Estatísticas
const stats = {
  totalLido: 0,
  descartadosCamposVazios: 0,
  duplicatasEncontradas: 0,
  registrosUnicos: 0,
  porPlanilha: {}
};

const registrosDescartados = [];
const duplicatasDetalhadas = [];

// Ler e processar todas as planilhas
console.log('📖 Lendo planilhas originais...\n');

const todosRegistros = [];
const mapaUnicos = new Map(); // chave_unica -> registro

planilhas.forEach((planilhaNome, indexPlanilha) => {
  const planilhaPath = path.join(planilhasDir, planilhaNome);
  
  stats.porPlanilha[planilhaNome] = {
    totalLinhas: 0,
    lidos: 0,
    descartados: 0
  };
  
  try {
    const workbook = XLSX.readFile(planilhaPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    stats.porPlanilha[planilhaNome].totalLinhas = data.length;
    
    console.log(`📄 ${planilhaNome}`);
    console.log(`   Total de linhas: ${data.length}`);
    
    data.forEach((row, rowIndex) => {
      stats.totalLido++;
      
      // Extrair campos com variações de nomes
      const empresa = (
        row['Negócio - Empresa'] || 
        row['﻿Negócio - Empresa'] || 
        row['Empresa'] || 
        row['EMPRESA'] || 
        ''
      ).toString().trim();
      
      const equipamento = (
        row['Equipamento'] || 
        row['EQUIPAMENTO'] || 
        ''
      ).toString().trim();
      
      // REGRA 2: Descartar se empresa OU equipamento vazios
      if (!empresa || !equipamento) {
        stats.descartadosCamposVazios++;
        stats.porPlanilha[planilhaNome].descartados++;
        
        registrosDescartados.push({
          planilha: planilhaNome,
          linha: rowIndex + 2,
          motivo: 'Campo vazio',
          empresa: empresa || '(vazio)',
          equipamento: equipamento || '(vazio)'
        });
        
        return;
      }
      
      // Extrair demais campos
      const dataCriacao = excelDateToJS(
        row['Negócio criado em'] || 
        row['Data Criação'] || 
        row['DATA CRIAÇÃO']
      );
      
      const registro = {
        empresa,
        pessoa_contato: (row['Pessoa de contato'] || row['Pessoa'] || '').toString().trim(),
        telefone: (row['Telefone'] || row['TELEFONE'] || '').toString().trim(),
        email: (row['Email'] || row['E-mail'] || row['EMAIL'] || '').toString().trim(),
        equipamento,
        tipo_maquina: (row['Tipo da Máquina'] || row['Tipo Máquina'] || '').toString().trim(),
        tipo_negociacao: (row['Tipo Negociação'] || row['Tipo'] || '').toString().trim(),
        valor_produto: limparValor(row['Valor do Produto']),
        valor_oferta: limparValor(row['Valor da Oferta']),
        valor_fabrica: limparValor(row['Valor Fábrica']),
        valor_brasil: limparValor(row['Valor Brasil']),
        data_criacao: dataCriacao,
        data_fechamento: excelDateToJS(row['Data de fechamento esperada'] || row['Data Fechamento']),
        etapa: (row['Negócio - Etapa'] || row['Etapa'] || '').toString().trim(),
        status: (row['Negócio - Status'] || row['Status'] || '').toString().trim(),
        origem: (row['Origem da negociação'] || row['Origem'] || '').toString().trim(),
        observacao: (row['Observação'] || row['OBS'] || '').toString().trim(),
        
        // Metadados
        _origem: planilhaNome,
        _indice_planilha: indexPlanilha,
        _linha_excel: rowIndex + 2
      };
      
      // REGRA 1: Criar chave única
      const empresaNorm = normalizar(empresa);
      const equipamentoNorm = normalizar(equipamento);
      const chaveUnica = `${empresaNorm}|${equipamentoNorm}|${dataCriacao || 'sem-data'}`;
      
      // Verificar duplicação
      if (mapaUnicos.has(chaveUnica)) {
        stats.duplicatasEncontradas++;
        stats.porPlanilha[planilhaNome].descartados++;
        
        const registroExistente = mapaUnicos.get(chaveUnica);
        
        // REGRA 3: Se mesma data_criacao, manter o mais recente (última planilha)
        // Última planilha = índice maior
        if (indexPlanilha > registroExistente._indice_planilha) {
          // Substituir pelo mais recente
          mapaUnicos.set(chaveUnica, registro);
          
          duplicatasDetalhadas.push({
            empresa,
            equipamento,
            dataCriacao,
            acao: 'Substituído',
            anterior: registroExistente._origem,
            novo: planilhaNome
          });
        } else {
          duplicatasDetalhadas.push({
            empresa,
            equipamento,
            dataCriacao,
            acao: 'Ignorado',
            mantido: registroExistente._origem,
            descartado: planilhaNome
          });
        }
      } else {
        // Registro único
        mapaUnicos.set(chaveUnica, registro);
        stats.porPlanilha[planilhaNome].lidos++;
      }
    });
    
    console.log(`   ✅ Processados: ${stats.porPlanilha[planilhaNome].lidos} únicos, ${stats.porPlanilha[planilhaNome].descartados} descartados\n`);
    
  } catch (error) {
    console.error(`   ❌ Erro ao processar: ${error.message}\n`);
  }
});

// Converter mapa para array
const registrosFinais = Array.from(mapaUnicos.values());
stats.registrosUnicos = registrosFinais.length;

// Relatório estatístico
console.log('='.repeat(100));
console.log('📊 ESTATÍSTICAS DO PROCESSAMENTO');
console.log('='.repeat(100) + '\n');

console.log(`Total lido das 3 planilhas: ${stats.totalLido}`);
console.log(`❌ Descartados (campos vazios): ${stats.descartadosCamposVazios}`);
console.log(`🔄 Duplicatas encontradas: ${stats.duplicatasEncontradas}`);
console.log(`✅ Registros únicos finais: ${stats.registrosUnicos}\n`);

console.log('Por planilha:');
planilhas.forEach(nome => {
  const p = stats.porPlanilha[nome];
  console.log(`  ${nome}:`);
  console.log(`    Total: ${p.totalLinhas} | Únicos: ${p.lidos} | Descartados: ${p.descartados}`);
});

// Criar backup
console.log('\n' + '='.repeat(100));
console.log('💾 Criando backup do banco de dados...');

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = Date.now();
const backupPath = path.join(backupDir, `crm_backup_antes_reimportacao_${timestamp}.db`);

try {
  fs.copyFileSync(dbPath, backupPath);
  const backupSize = fs.statSync(backupPath).size;
  console.log(`✅ Backup criado: crm_backup_antes_reimportacao_${timestamp}.db (${(backupSize / 1024).toFixed(2)} KB)\n`);
} catch (error) {
  console.error(`❌ Erro ao criar backup: ${error.message}`);
  process.exit(1);
}

// Inserir no banco de dados
console.log('='.repeat(100));
console.log('💾 Inserindo dados no banco...\n');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Limpar tabela
  db.run('DELETE FROM negocios', (err) => {
    if (err) {
      console.error('❌ Erro ao limpar tabela:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('✅ Tabela negocios limpa');
  });
  
  // Preparar statement de inserção
  const stmt = db.prepare(`
    INSERT INTO negocios (
      empresa, pessoa_contato, telefone, email, equipamento,
      tipo_maquina, tipo_negociacao,
      valor_produto, valor_oferta, valor_fabrica, valor_brasil,
      data_criacao, data_fechamento,
      etapa, status, origem, observacao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let inseridos = 0;
  let erros = 0;
  
  registrosFinais.forEach((reg, index) => {
    stmt.run(
      reg.empresa,
      reg.pessoa_contato || '',
      reg.telefone || '',
      reg.email || '',
      reg.equipamento,
      reg.tipo_maquina || '',
      reg.tipo_negociacao || '',
      reg.valor_produto,
      reg.valor_oferta,
      reg.valor_fabrica,
      reg.valor_brasil,
      reg.data_criacao,
      reg.data_fechamento,
      reg.etapa || '',
      reg.status || '',
      reg.origem || '',
      reg.observacao || '',
      (err) => {
        if (err) {
          erros++;
          console.error(`❌ Erro ao inserir registro ${index + 1}:`, err.message);
        } else {
          inseridos++;
        }
        
        // Progresso
        if ((inseridos + erros) % 100 === 0) {
          console.log(`   Processados: ${inseridos + erros}/${registrosFinais.length}...`);
        }
        
        // Finalizar
        if (inseridos + erros === registrosFinais.length) {
          stmt.finalize();
          
          console.log(`\n✅ Inserção concluída: ${inseridos} registros`);
          if (erros > 0) {
            console.log(`⚠️  Erros: ${erros}`);
          }
          
          // Verificar contagem final
          db.get('SELECT COUNT(*) as total FROM negocios', [], (err, row) => {
            if (err) {
              console.error('❌ Erro ao verificar contagem:', err.message);
            } else {
              console.log(`\n📊 Total no banco: ${row.total} registros`);
              
              if (row.total === stats.registrosUnicos) {
                console.log('✅ Contagem OK!');
              } else {
                console.log(`⚠️  Divergência: esperado ${stats.registrosUnicos}, encontrado ${row.total}`);
              }
            }
            
            // Salvar relatório completo
            salvarRelatorio();
            
            db.close(() => {
              console.log('\n✅ Reimportação concluída com sucesso!\n');
            });
          });
        }
      }
    );
  });
});

function salvarRelatorio() {
  const relatorioPath = path.join(__dirname, '..', 'relatorio_reimportacao.json');
  
  const relatorio = {
    dataReimportacao: new Date().toISOString(),
    estatisticas: stats,
    registrosDescartados: registrosDescartados.slice(0, 100), // Primeiros 100
    totalDescartados: registrosDescartados.length,
    duplicatasDetalhadas: duplicatasDetalhadas.slice(0, 100), // Primeiros 100
    totalDuplicatas: duplicatasDetalhadas.length,
    amostraRegistrosFinais: registrosFinais.slice(0, 10).map(r => ({
      empresa: r.empresa,
      equipamento: r.equipamento,
      data_criacao: r.data_criacao,
      origem: r._origem
    }))
  };
  
  fs.writeFileSync(relatorioPath, JSON.stringify(relatorio, null, 2));
  console.log(`\n💾 Relatório salvo em: relatorio_reimportacao.json`);
}
