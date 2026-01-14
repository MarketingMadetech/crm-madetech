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
                db.close();
                reject(err);
                return;
            }

            console.log('✅ Tabela de usuários verificada');

            // Verificar quantos usuários existem
            db.get('SELECT COUNT(*) as count FROM usuarios', async (err, result) => {
                if (err) {
                    console.error('❌ Erro ao contar usuários:', err);
                    db.close();
                    reject(err);
                    return;
                }

                if (result.count > 0) {
                    console.log(`ℹ️  ${result.count} usuário(s) já cadastrado(s)`);
                    resolve();
                    return;
                }

                console.log('📝 Criando usuários padrão...\n');

                // Criar usuários padrão
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
                try {
                    for (const usuario of usuarios) {
                        const hashedPassword = await bcrypt.hash(usuario.senha, 10);

                        await new Promise((resolveUser, rejectUser) => {
                            db.run(
                                'INSERT INTO usuarios (username, senha, nome, email, role) VALUES (?, ?, ?, ?, ?)',
                                [usuario.username, hashedPassword, usuario.nome, usuario.email, usuario.role],
                                function(err) {
                                    if (err) {
                                        console.error(`❌ Erro ao criar usuário ${usuario.username}:`, err);
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

                    console.log(`\n✅ ${createdCount} usuário(s) criado(s) com sucesso!\n`);
                    console.log('📋 CREDENCIAIS DE ACESSO:');
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
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    initUsuarios();
}

module.exports = { initUsuarios };
