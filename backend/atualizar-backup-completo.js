const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('crm_backup_analise.db');

async function atualizarTudo() {
    console.log('\n🔄 ATUALIZANDO BACKUP PARA NOVAS CREDENCIAIS\n');
    console.log('═'.repeat(70));

    // 1. Renomear RCPGrs para Reinaldo
    await new Promise((resolve) => {
        db.run(
            'UPDATE usuarios SET username = ? WHERE username = ?',
            ['Reinaldo', 'RCPGrs'],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao renomear:', err.message);
                } else if (this.changes > 0) {
                    console.log('✅ Username atualizado: RCPGrs → Reinaldo');
                } else {
                    console.log('ℹ️  RCPGrs não encontrado (já era Reinaldo)');
                }
                resolve();
            }
        );
    });

    // 2. Atualizar todas as senhas e informações
    const usuarios = [
        { username: 'admin', senha: 'admin123', nome: 'Administrador', email: 'admin@crm.com', role: 'admin' },
        { username: 'Reinaldo', senha: 'RCPSP01', nome: 'Reinaldo', email: 'reinaldo@crm.com', role: 'user' },
        { username: 'thiago.costa', senha: 'thiago123', nome: 'Thiago Costa', email: 'thiago@madetech.com', role: 'user' }
    ];

    for (const user of usuarios) {
        const hash = await bcrypt.hash(user.senha, 10);
        
        await new Promise((resolve) => {
            db.run(
                'UPDATE usuarios SET senha = ?, nome = ?, email = ?, role = ? WHERE username = ?',
                [hash, user.nome, user.email, user.role, user.username],
                function(err) {
                    if (err) {
                        console.error(`❌ Erro ao atualizar ${user.username}:`, err.message);
                    } else if (this.changes > 0) {
                        console.log(`✅ ${user.username} → senha: ${user.senha} | role: ${user.role}`);
                    } else {
                        console.log(`⚠️  ${user.username} não encontrado`);
                    }
                    resolve();
                }
            );
        });
    }

    console.log('\n═'.repeat(70));
    console.log('✅ BACKUP ATUALIZADO COM SUCESSO!');
    console.log('📁 Arquivo: crm_backup_analise.db');
    console.log('\n💾 Agora copie este arquivo de volta para o Desktop:\n');
    console.log('   Copy-Item crm_backup_analise.db -Destination "C:\\Users\\madet\\OneDrive\\Desktop\\crm.db" -Force\n');

    db.close();
}

atualizarTudo();
