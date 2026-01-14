const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'madetech.marketing@outlook.com',
    pass: process.env.SMTP_PASS || 'COLOQUE_A_SENHA_AQUI'
  }
});

// Verificação desabilitada para não causar crash em produção
// transporter.verify será feito apenas quando enviar email
if (process.env.SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.log('⚠️  Aviso: Configuração de e-mail com problema:', error.message);
    } else {
      console.log('✅ Servidor de e-mail pronto');
    }
  });
} else {
  console.log('ℹ️  Email não configurado (opcional)');
}

module.exports = transporter;
