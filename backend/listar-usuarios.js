const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

console.log('\n📋 Lista de usuários cadastrados no sistema:\n');
db.all('SELECT username, nome, email, role, ativo FROM usuarios', (err, rows) => {
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
            console.log(`  Email:    ${user.email}`);
            console.log(`  Perfil:   ${user.role}`);
            console.log(`  Ativo:    ${user.ativo ? 'Sim' : 'Não'}`);
            console.log('-----------------------------');
        });
    }
    db.close();
});
