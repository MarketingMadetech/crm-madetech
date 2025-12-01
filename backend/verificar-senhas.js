const bcrypt = require('bcrypt');

const senhas = [
  { username: 'thiago.costa', senha: '301190', hash: '$2b$10$dsAv5cjM6iIsWr4szgWJFeRHWgtLV8I7/8Cd.zNVKeB7YTWzzLuKe' },
  { username: 'RCPGrs', senha: '241289', hash: '$2b$10$44mWeMTUfpGev.0gG6HgFehcPUB0z1dh3QJm6gGKyRVW3m/XBtzpy' }
];

(async () => {
  for (const { username, senha, hash } of senhas) {
    const match = await bcrypt.compare(senha, hash);
    console.log(`Usuário: ${username} | Senha: ${senha} | Confere: ${match ? 'SIM' : 'NÃO'}`);
  }
})();
