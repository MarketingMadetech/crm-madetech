const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const db = new sqlite3.Database(path.join(__dirname, '..', 'crm.db'));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function listarUsuarios() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, username, nome, email, role, ativo, ultimo_acesso FROM usuarios', (err, users) => {
            if (err) reject(err);
            else resolve(users);
        });
    });
}

async function criarUsuario() {
    console.log('\n📝 Criar Novo Usuário\n');
    
    const username = await question('Username: ');
    const nome = await question('Nome completo: ');
    const email = await question('Email: ');
    const password = await question('Senha: ');
    const role = await question('Função (user/admin) [user]: ') || 'user';

    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO usuarios (username, senha, nome, email, role) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, nome, email, role],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao criar usuário:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ Usuário criado com ID: ${this.lastID}`);
                    resolve();
                }
            }
        );
    });
}

async function alterarSenha() {
    console.log('\n🔑 Alterar Senha de Usuário\n');
    
    const users = await listarUsuarios();
    console.log('Usuários disponíveis:');
    users.forEach(u => console.log(`  ${u.id} - ${u.username} (${u.nome})`));
    
    const userId = await question('\nID do usuário: ');
    const newPassword = await question('Nova senha: ');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE usuarios SET senha = ? WHERE id = ?',
            [hashedPassword, userId],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao alterar senha:', err.message);
                    reject(err);
                } else if (this.changes === 0) {
                    console.log('❌ Usuário não encontrado');
                    resolve();
                } else {
                    console.log('✅ Senha alterada com sucesso!');
                    resolve();
                }
            }
        );
    });
}

async function desativarUsuario() {
    console.log('\n🚫 Desativar Usuário\n');
    
    const users = await listarUsuarios();
    console.log('Usuários disponíveis:');
    users.forEach(u => console.log(`  ${u.id} - ${u.username} (${u.nome}) - ${u.ativo ? 'Ativo' : 'Inativo'}`));
    
    const userId = await question('\nID do usuário: ');
    const ativo = await question('Ativar ou Desativar? (1/0): ');

    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE usuarios SET ativo = ? WHERE id = ?',
            [parseInt(ativo), userId],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao atualizar usuário:', err.message);
                    reject(err);
                } else if (this.changes === 0) {
                    console.log('❌ Usuário não encontrado');
                    resolve();
                } else {
                    console.log(`✅ Usuário ${ativo === '1' ? 'ativado' : 'desativado'} com sucesso!`);
                    resolve();
                }
            }
        );
    });
}

async function menuPrincipal() {
    console.log('\n' + '═'.repeat(50));
    console.log('🔐 Gerenciador de Usuários - CRM Madetech');
    console.log('═'.repeat(50));
    console.log('\n1. Listar usuários');
    console.log('2. Criar novo usuário');
    console.log('3. Alterar senha');
    console.log('4. Ativar/Desativar usuário');
    console.log('5. Sair\n');

    const opcao = await question('Escolha uma opção: ');

    try {
        switch(opcao) {
            case '1':
                const users = await listarUsuarios();
                console.log('\n📋 Usuários Cadastrados:\n');
                console.log('ID | Username       | Nome                 | Email              | Role  | Ativo');
                console.log('-'.repeat(90));
                users.forEach(u => {
                    console.log(
                        `${u.id.toString().padEnd(2)} | ${u.username.padEnd(14)} | ${(u.nome || '').padEnd(20)} | ${(u.email || '').padEnd(18)} | ${u.role.padEnd(5)} | ${u.ativo ? '✅' : '❌'}`
                    );
                });
                await menuPrincipal();
                break;
            
            case '2':
                await criarUsuario();
                await menuPrincipal();
                break;
            
            case '3':
                await alterarSenha();
                await menuPrincipal();
                break;
            
            case '4':
                await desativarUsuario();
                await menuPrincipal();
                break;
            
            case '5':
                console.log('\n👋 Até logo!\n');
                rl.close();
                db.close();
                break;
            
            default:
                console.log('❌ Opção inválida');
                await menuPrincipal();
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await menuPrincipal();
    }
}

// Iniciar
menuPrincipal();
