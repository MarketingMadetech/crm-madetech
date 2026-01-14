const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

// Função auxiliar para promisificar db.run
function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
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
    // Usuários são carregados do arquivo crm.db fornecido
    // Não criar usuários automaticamente
    console.log('✅ Sistema de usuários pronto (usando banco de dados existente)');
}

// Executar se chamado diretamente
if (require.main === module) {
    initUsuarios();
}

module.exports = { initUsuarios };
