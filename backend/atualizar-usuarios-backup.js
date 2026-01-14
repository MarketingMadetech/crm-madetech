const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('crm_backup_analise.db');

console.log('\n📊 Analisando usuários no backup...\n');

db.all('SELECT id, username, nome, email, role FROM usuarios', [], async (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err.message);
        db.close();
        return;
    }

    console.log('═'.repeat(70));
    rows.forEach(u => {
        console.log(`ID: ${u.id} | Username: ${u.username} | Nome: ${u.nome} | Role: ${u.role}`);
    });
    console.log('═'.repeat(70));
    console.log(`\nTotal: ${rows.length} usuário(s)\n`);

    // Agora vamos atualizar para as novas credenciais
    console.log('🔄 Atualizando senhas para as novas configurações...\n');

    const usuarios = [
        { username: 'admin', senha: 'admin123', nome: 'Administrador', role: 'admin' },
        { username: 'Reinaldo', senha: 'RCPSP01', nome: 'Reinaldo', role: 'user' },
        { username: 'thiago.costa', senha: 'thiago123', nome: 'Thiago Costa', role: 'user' }
    ];

    let updated = 0;
    for (const user of usuarios) {
        const hash = await bcrypt.hash(user.senha, 10);
        
        db.run(
            'UPDATE usuarios SET senha = ?, nome = ?, role = ? WHERE username = ?',
            [hash, user.nome, user.role, user.username],
            function(err) {
                if (err) {
                    console.error(`❌ Erro ao atualizar ${user.username}:`, err.message);
                } else if (this.changes > 0) {
                    console.log(`✅ ${user.username} atualizado (senha: ${user.senha})`);
                    updated++;
                } else {
                    console.log(`⚠️  ${user.username} não encontrado, será criado no deploy`);
                }
                
                if (updated + 1 === usuarios.length || updated === usuarios.length) {
                    console.log('\n✅ Atualização concluída!');
                    console.log('📁 Backup atualizado: crm_backup_analise.db\n');
                    db.close();
                }
            }
        );
    }
});
