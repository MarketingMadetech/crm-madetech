const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

async function initAuth() {
    console.log('\n🔐 Inicializando sistema de autenticação...\n');

    // Criar tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            nome TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'user',
            ativo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ultimo_acesso DATETIME
        )
    `, async (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela de usuários:', err);
            db.close();
            return;
        }

        console.log('✅ Tabela de usuários criada/verificada');

        // Verificar se já existe usuário admin
        db.get('SELECT id FROM usuarios WHERE username = ?', ['admin'], async (err, user) => {
            if (err) {
                console.error('❌ Erro ao verificar usuário admin:', err);
                db.close();
                return;
            }

            if (user) {
                console.log('ℹ️  Usuário admin já existe');
                console.log('\n✅ Sistema de autenticação pronto!\n');
                db.close();
                return;
            }

            // Criar usuário admin padrão
            const defaultPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            db.run(
                'INSERT INTO usuarios (username, senha, nome, email, role) VALUES (?, ?, ?, ?, ?)',
                ['admin', hashedPassword, 'Administrador', 'admin@madetech.com', 'admin'],
                function(err) {
                    if (err) {
                        console.error('❌ Erro ao criar usuário admin:', err);
                        db.close();
                        return;
                    }

                    console.log('\n✅ Usuário admin criado com sucesso!');
                    console.log('\n📋 CREDENCIAIS DE ACESSO:');
                    console.log('═'.repeat(50));
                    console.log(`   Usuário: admin`);
                    console.log(`   Senha: ${defaultPassword}`);
                    console.log('═'.repeat(50));
                    console.log('\n⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!\n');
                    console.log('✅ Sistema de autenticação pronto!\n');
                    
                    db.close();
                }
            );
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    initAuth();
}

module.exports = { initAuth };
