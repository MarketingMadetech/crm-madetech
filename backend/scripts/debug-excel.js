const XLSX = require('xlsx');

const wb = XLSX.readFile('./planilhas_originais/30.09_PLANILHA DE CONTROLE NEGÓCIOS EM ANDAMENTO.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Primeiros 10 registros da planilha original:\n');
data.slice(0, 10).forEach((r, i) => {
  const empresa = r['Negócio - Empresa'] || r['﻿Negócio - Empresa'] || '';
  const equipamento = r.Equipamento || '';
  const dataCriacao = r['Negócio criado em'] || '';
  console.log(`${i+1}. Empresa: "${empresa}"`);
  console.log(`   Equipamento: "${equipamento}"`);
  console.log(`   Data: ${dataCriacao}\n`);
});
