const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

// Função auxiliar para promisificar db.run com tratamento completo de erros
function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        const statement = db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
        
        // Adicionar handler explícito para eventos de erro do Statement
        // Isso previne crashes por "Unhandled 'error' event"
        if (statement) {
            statement.on('error', (err) => {
                reject(err);
            });
        }
    });
}

// Função auxiliar para promisificar db.get
function dbGet(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function initUsuarios() {
    console.log('\n🔐 Inicializando usuários do sistema...\n');

    try {
        // Criar tabela de usuários se não existir
        await dbRun(`
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
        `);

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

        for (const usuario of usuarios) {
            try {
                // Gerar hash da senha
                const hashedPassword = await bcrypt.hash(usuario.senha, 10);

                // Usar INSERT OR IGNORE para evitar erros de duplicação
                // Se o usuário já existe, o SQLite simplesmente ignora a inserção
                const result = await dbRun(
                    'INSERT OR IGNORE INTO usuarios (username, senha, nome, email, role) VALUES (?, ?, ?, ?, ?)',
                    [usuario.username, hashedPassword, usuario.nome, usuario.email, usuario.role]
                );

                // changes > 0 significa que o INSERT foi bem-sucedido (usuário criado)
                // changes = 0 significa que foi ignorado (usuário já existia)
                if (result.changes > 0) {
                    console.log(`✅ Usuário criado: ${usuario.username} (${usuario.role})`);
                    createdCount++;
                } else {
                    console.log(`ℹ️  Usuário já existe: ${usuario.username}`);
                    skippedCount++;
                }

            } catch (error) {
                // Captura qualquer erro inesperado e apenas loga, sem interromper
                console.error(`⚠️  Erro ao processar usuário ${usuario.username}:`, error.message);
                skippedCount++;
                // Continua para o próximo usuário sem travar
            }
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

    } catch (error) {
        console.error('❌ Erro durante inicialização:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initUsuarios();
}

module.exports = { initUsuarios };
