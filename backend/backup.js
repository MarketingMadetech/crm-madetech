const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Diretório de backups
const BACKUP_DIR = path.join(__dirname, 'backups');
const DB_PATH = path.join(__dirname, 'crm.db');

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Função para criar backup
function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `crm_backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    return new Promise((resolve, reject) => {
        // Copiar arquivo do banco de dados
        fs.copyFile(DB_PATH, backupPath, (err) => {
            if (err) {
                console.error('❌ Erro ao criar backup:', err);
                reject(err);
            } else {
                console.log(`✅ Backup criado com sucesso: ${backupFileName}`);
                
                // Limpar backups antigos (manter apenas os últimos 30)
                cleanOldBackups();
                
                resolve({
                    fileName: backupFileName,
                    path: backupPath,
                    size: fs.statSync(backupPath).size,
                    date: new Date()
                });
            }
        });
    });
}

// Função para limpar backups antigos
function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('crm_backup_') && file.endsWith('.db'))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_DIR, file),
                time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Manter apenas os últimos 30 backups
        if (files.length > 30) {
            const filesToDelete = files.slice(30);
            filesToDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`🗑️  Backup antigo removido: ${file.name}`);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao limpar backups antigos:', error);
    }
}

// Função para listar backups
function listBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('crm_backup_') && file.endsWith('.db'))
            .map(file => {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    fileName: file,
                    path: filePath,
                    size: stats.size,
                    date: stats.mtime
                };
            })
            .sort((a, b) => b.date - a.date);

        return files;
    } catch (error) {
        console.error('❌ Erro ao listar backups:', error);
        return [];
    }
}

// Função para restaurar backup
function restoreBackup(backupFileName) {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    return new Promise((resolve, reject) => {
        // Verificar se o backup existe
        if (!fs.existsSync(backupPath)) {
            reject(new Error('Arquivo de backup não encontrado'));
            return;
        }

        // Criar backup do estado atual antes de restaurar
        const currentBackupName = `crm_backup_before_restore_${Date.now()}.db`;
        const currentBackupPath = path.join(BACKUP_DIR, currentBackupName);

        fs.copyFile(DB_PATH, currentBackupPath, (err) => {
            if (err) {
                console.error('❌ Erro ao criar backup do estado atual:', err);
            }

            // Restaurar o backup selecionado
            fs.copyFile(backupPath, DB_PATH, (err) => {
                if (err) {
                    console.error('❌ Erro ao restaurar backup:', err);
                    reject(err);
                } else {
                    console.log(`✅ Backup restaurado com sucesso: ${backupFileName}`);
                    resolve({
                        fileName: backupFileName,
                        restored: true
                    });
                }
            });
        });
    });
}

// Função para deletar backup
function deleteBackup(backupFileName) {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(backupPath)) {
            reject(new Error('Arquivo de backup não encontrado'));
            return;
        }

        fs.unlink(backupPath, (err) => {
            if (err) {
                console.error('❌ Erro ao deletar backup:', err);
                reject(err);
            } else {
                console.log(`✅ Backup deletado: ${backupFileName}`);
                resolve({ deleted: true });
            }
        });
    });
}

// Agendar backup automático diário (às 3h da manhã)
function scheduleAutomaticBackup() {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(3, 0, 0, 0); // 3:00 AM

    // Se já passou das 3h hoje, agendar para amanhã
    if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilBackup = scheduledTime - now;

    console.log(`⏰ Próximo backup automático agendado para: ${scheduledTime.toLocaleString('pt-BR')}`);

    setTimeout(() => {
        createBackup()
            .then(() => {
                console.log('✅ Backup automático concluído');
                // Agendar o próximo backup (24 horas depois)
                scheduleAutomaticBackup();
            })
            .catch(err => {
                console.error('❌ Erro no backup automático:', err);
                // Mesmo com erro, agendar o próximo backup
                scheduleAutomaticBackup();
            });
    }, timeUntilBackup);
}

// Iniciar agendamento de backup automático
scheduleAutomaticBackup();

// Criar backup inicial ao iniciar o servidor
createBackup()
    .then(() => console.log('✅ Backup inicial criado'))
    .catch(err => console.error('❌ Erro ao criar backup inicial:', err));

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    deleteBackup,
    BACKUP_DIR
};
