const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

async function verificarSenha() {
    const username = 'Reinaldo';
    const senhaDigitada = 'RCPSP01';

    db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('❌ Erro ao buscar usuário:', err);
            db.close();
            return;
        }

        if (!user) {
            console.log('❌ Usuário não encontrado');
            db.close();
            return;
        }

        console.log('\n📋 Dados do usuário:');
        console.log('  ID:', user.id);
        console.log('  Username:', user.username);
        console.log('  Nome:', user.nome);
        console.log('  Email:', user.email);
        console.log('  Ativo:', user.ativo);
        console.log('  Hash da senha:', user.senha);
        console.log('');

        // Testar a senha
        const senhaValida = await bcrypt.compare(senhaDigitada, user.senha);
        
        if (senhaValida) {
            console.log('✅ SENHA CORRETA! A senha "' + senhaDigitada + '" está válida.');
        } else {
            console.log('❌ SENHA INCORRETA! A senha "' + senhaDigitada + '" não corresponde ao hash.');
        }

        db.close();
    });
}

verificarSenha();
