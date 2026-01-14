const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

async function initUsuarios() {
    return new Promise((resolve, reject) => {
        console.log('\n🔐 Inicializando usuários do sistema...\n');

        // Criar tabela de usuários se não existir
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
                resolve(); // Não falhar o servidor
                return;
            }

            console.log('✅ Tabela de usuários verificada');

            // Criar usuários padrão (verifica cada um individualmente)
            console.log('📝 Verificando usuários padrão...\n');

            const usuarios = [
                {
                    username: 'admin',
                    senha: 'admin123',
                    nome: 'Administrador',
                    email: 'admin@madetech.com',
                    role: 'admin'
                },
                {
                    username: 'Reinaldo',
                    senha: 'RCPSP01',
                    nome: 'Reinaldo',
                    email: 'reinaldo@crm.com',
                    role: 'user'
                },
                {
                    username: 'thiago.costa',
                    senha: 'thiago123',
                    nome: 'Thiago Costa',
                    email: 'thiago@madetech.com',
                    role: 'user'
                }
            ];

            let createdCount = 0;
            let skippedCount = 0;

            try {
                for (const usuario of usuarios) {
                    // Verificar se o usuário já existe
                    const exists = await new Promise((resolveCheck, rejectCheck) => {
                        db.get('SELECT id FROM usuarios WHERE username = ?', [usuario.username], (err, row) => {
                            if (err) rejectCheck(err);
                            else resolveCheck(!!row);
                        });
                    });

                    if (exists) {
                        console.log(`ℹ️  Usuário já existe: ${usuario.username}`);
                        skippedCount++;
                        continue;
                    }

                    // Criar usuário
                    const hashedPassword = await bcrypt.hash(usuario.senha, 10);

                    await new Promise((resolveUser, rejectUser) => {
                        db.run(
                            'INSERT INTO usuarios (username, senha, nome, email, role) VALUES (?, ?, ?, ?, ?)',
                            [usuario.username, hashedPassword, usuario.nome, usuario.email, usuario.role],
                            function(err) {
                                if (err) {
                                    console.error(`❌ Erro ao criar usuário ${usuario.username}:`, err.message);
                                    rejectUser(err);
                                } else {
                                    console.log(`✅ Usuário criado: ${usuario.username} (${usuario.role})`);
                                    createdCount++;
                                    resolveUser();
                                }
                            }
                        );
                    });
                }

                console.log(`\n📊 Resumo: ${createdCount} criado(s), ${skippedCount} já existente(s)\n`);
                
                if (createdCount > 0) {
                    console.log('📋 CREDENCIAIS DOS NOVOS USUÁRIOS:');
                    console.log('═'.repeat(50));
                    usuarios.forEach(u => {
                        console.log(`   ${u.nome}:`);
                        console.log(`   - Username: ${u.username}`);
                        console.log(`   - Senha: ${u.senha}`);
                        console.log(`   - Perfil: ${u.role}`);
                        console.log('');
                    });
                    console.log('═'.repeat(50));
                    console.log('\n⚠️  IMPORTANTE: Altere as senhas após o primeiro login!\n');
                }
                
                resolve();
            } catch (error) {
                console.error('❌ Erro durante inicialização:', error.message);
                resolve(); // Não falhar o servidor por erro aqui
            }
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    initUsuarios();
}

module.exports = { initUsuarios };
