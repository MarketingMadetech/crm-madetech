const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('C:/Users/madet/Desktop/crm_backup_2026-02-04_12-42-05.db');

db.all(
  `SELECT DISTINCT equipamento FROM negocios 
   WHERE equipamento IS NOT NULL AND equipamento != '' 
   ORDER BY equipamento`,
  (err, rows) => {
    if (err) {
      console.error(err);
      db.close();
      return;
    }

    let txt = '===========================================\n';
    txt += '  LISTA DE EQUIPAMENTOS - CRM MADETECH\n';
    txt += '  Atualizado em: 04/02/2026\n';
    txt += '===========================================\n\n';
    txt += 'EQUIPAMENTOS CADASTRADOS NO BANCO DE DADOS:\n';
    txt += '(Total: ' + rows.length + ' equipamentos únicos)\n\n';

    rows.forEach((r, i) => {
      txt += (i + 1).toString().padStart(3, ' ') + '. ' + r.equipamento + '\n';
    });

    txt += '\n\n===========================================\n';
    txt += '  PADRÃO DE CADASTRO\n';
    txt += '===========================================\n\n';
    txt += '• Use Primeira Letra Maiúscula em cada palavra\n';
    txt += '• Exemplo: "Centro de Furação M6.5 Automático"\n';
    txt += '• Evite abreviações: escreva "Coladeira de Bordos", não "Col. Bordos"\n';
    txt += '• Inclua o modelo completo: "Nesting CNC 3020 ATC"\n';

    fs.writeFileSync('C:/Users/madet/Desktop/LISTA_EQUIPAMENTOS_CRM.txt', txt, 'utf8');
    console.log('✅ Arquivo salvo: C:/Users/madet/Desktop/LISTA_EQUIPAMENTOS_CRM.txt');
    console.log('📊 Total de equipamentos: ' + rows.length);

    db.close();
  }
);
