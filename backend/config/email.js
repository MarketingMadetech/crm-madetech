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

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erro na configuração de e-mail:', error.message);
  } else {
    console.log('✅ Servidor de e-mail pronto');
  }
});

module.exports = transporter;
