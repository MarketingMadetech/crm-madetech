const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

console.log('\n📋 Usuários e hashes de senha:\n');
db.all('SELECT username, nome, senha FROM usuarios', (err, rows) => {
    if (err) {
        console.error('Erro ao consultar usuários:', err);
        db.close();
        process.exit(1);
    }
    if (rows.length === 0) {
        console.log('Nenhum usuário encontrado.');
    } else {
        rows.forEach((user, idx) => {
            console.log(`Usuário #${idx + 1}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Nome:     ${user.nome}`);
            console.log(`  Hash da senha: ${user.senha}`);
            console.log('-----------------------------');
        });
    }
    db.close();
});
