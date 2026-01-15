const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('crm.db');

db.all(
  `SELECT DISTINCT origem FROM negocios WHERE LOWER(origem) LIKE '%whatsapp%' OR LOWER(origem) LIKE '%whtasapp%'`,
  (err, rows) => {
    console.log('Variações de WhatsApp encontradas:');
    rows.forEach(r => console.log('  -', JSON.stringify(r.origem)));
    db.close();
  }
);
