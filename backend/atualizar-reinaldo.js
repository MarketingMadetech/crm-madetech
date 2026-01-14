const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

async function atualizarReinaldo() {
    console.log('\n🔄 Atualizando usuário Reinaldo...\n');

    const novoUsername = 'Reinaldo';
    const novaSenha = 'RCPSP01';

    try {
        // Criptografar a nova senha
        const hashedPassword = await bcrypt.hash(novaSenha, 10);

        // Atualizar username e senha
        db.run(
            'UPDATE usuarios SET username = ?, senha = ? WHERE id = 3',
            [novoUsername, hashedPassword],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao atualizar usuário:', err);
                    db.close();
                    return;
                }

                if (this.changes === 0) {
                    console.log('❌ Usuário não encontrado');
                } else {
                    console.log('✅ Usuário atualizado com sucesso!');
                    console.log('\n📋 NOVAS CREDENCIAIS:');
                    console.log('═'.repeat(40));
                    console.log(`   Username: ${novoUsername}`);
                    console.log(`   Senha: ${novaSenha}`);
                    console.log('═'.repeat(40));
                    console.log('');
                }

                db.close();
            }
        );
    } catch (error) {
        console.error('❌ Erro:', error);
        db.close();
    }
}

atualizarReinaldo();
