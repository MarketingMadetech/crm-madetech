const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const JWT_SECRET = 'madetech-crm-secret-key-2025'; // Em produção, usar variável de ambiente
const TOKEN_EXPIRATION = '24h';

const db = new sqlite3.Database(path.join(__dirname, 'crm.db'));

// Middleware para verificar token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado' });
        }
        req.user = user;
        next();
    });
}

// Middleware para verificar se é admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }
    next();
}

// LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }

    db.get('SELECT * FROM usuarios WHERE username = ? AND ativo = 1', [username], async (err, user) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos' });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.senha);
        if (!validPassword) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                nome: user.nome
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        // Atualizar último acesso
        db.run('UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        // Retornar dados do usuário (sem a senha)
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });
    });
});

// VERIFICAR TOKEN (para manter usuário logado)
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// LOGOUT
router.post('/logout', authenticateToken, (req, res) => {
    // No JWT, o logout é feito no frontend removendo o token
    res.json({ message: 'Logout realizado com sucesso' });
});

// LISTAR USUÁRIOS (apenas admin)
router.get('/users', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT id, username, nome, email, role, ativo, created_at, ultimo_acesso FROM usuarios ORDER BY created_at DESC', 
        (err, users) => {
            if (err) {
                console.error('Erro ao buscar usuários:', err);
                return res.status(500).json({ message: 'Erro ao buscar usuários' });
            }
            res.json(users);
        }
    );
});

// CRIAR USUÁRIO (apenas admin)
router.post('/users', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, nome, email, role } = req.body;

    if (!username || !password || !nome) {
        return res.status(400).json({ message: 'Username, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    db.get('SELECT id FROM usuarios WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Erro ao verificar usuário:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        if (user) {
            return res.status(400).json({ message: 'Nome de usuário já existe' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir usuário
        db.run(
            'INSERT INTO usuarios (username, senha, nome, email, role) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, nome, email || null, role || 'user'],
            function(err) {
                if (err) {
                    console.error('Erro ao criar usuário:', err);
                    return res.status(500).json({ message: 'Erro ao criar usuário' });
                }

                res.status(201).json({
                    id: this.lastID,
                    username,
                    nome,
                    email,
                    role: role || 'user',
                    message: 'Usuário criado com sucesso'
                });
            }
        );
    });
});

// ATUALIZAR USUÁRIO (apenas admin)
router.put('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nome, email, role, ativo, password } = req.body;

    let query = 'UPDATE usuarios SET ';
    const params = [];
    const updates = [];

    if (nome !== undefined) {
        updates.push('nome = ?');
        params.push(nome);
    }
    if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
    }
    if (role !== undefined) {
        updates.push('role = ?');
        params.push(role);
    }
    if (ativo !== undefined) {
        updates.push('ativo = ?');
        params.push(ativo ? 1 : 0);
    }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('senha = ?');
        params.push(hashedPassword);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            console.error('Erro ao atualizar usuário:', err);
            return res.status(500).json({ message: 'Erro ao atualizar usuário' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário atualizado com sucesso' });
    });
});

// DELETAR USUÁRIO (apenas admin)
router.delete('/users/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;

    // Não permitir deletar o próprio usuário admin
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: 'Você não pode deletar seu próprio usuário' });
    }

    db.run('DELETE FROM usuarios WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Erro ao deletar usuário:', err);
            return res.status(500).json({ message: 'Erro ao deletar usuário' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário deletado com sucesso' });
    });
});

// ALTERAR PRÓPRIA SENHA
router.put('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres' });
    }

    db.get('SELECT senha FROM usuarios WHERE id = ?', [req.user.id], async (err, user) => {
        if (err || !user) {
            return res.status(500).json({ message: 'Erro ao buscar usuário' });
        }

        // Verificar senha atual
        const validPassword = await bcrypt.compare(currentPassword, user.senha);
        if (!validPassword) {
            return res.status(401).json({ message: 'Senha atual incorreta' });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha
        db.run('UPDATE usuarios SET senha = ? WHERE id = ?', [hashedPassword, req.user.id], (err) => {
            if (err) {
                console.error('Erro ao atualizar senha:', err);
                return res.status(500).json({ message: 'Erro ao atualizar senha' });
            }

            res.json({ message: 'Senha alterada com sucesso' });
        });
    });
});

module.exports = { router, authenticateToken, isAdmin };
