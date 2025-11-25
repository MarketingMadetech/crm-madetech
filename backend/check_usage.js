const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./crm.db');

console.log('\n📊 RELATÓRIO DE USO DO CRM\n');
console.log('='.repeat(60));

// Total de negócios
db.get("SELECT COUNT(*) as total FROM negocios", (err, row) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    console.log(`\n📋 Total de Negócios: ${row.total}`);
});

// Negócios dos últimos 3 dias
db.get(`SELECT COUNT(*) as novos FROM negocios 
        WHERE data_criacao >= datetime('now', '-3 days')`, (err, row) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    console.log(`🆕 Novos Negócios (últimos 3 dias): ${row.novos}`);
});

// Negócios do final de semana (sexta a domingo)
db.get(`SELECT COUNT(*) as fim_semana FROM negocios 
        WHERE DATE(data_criacao) >= DATE('now', '-3 days')
        AND strftime('%w', data_criacao) IN ('5', '6', '0')`, (err, row) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    console.log(`🎉 Negócios do Fim de Semana: ${row.fim_semana || 0}`);
});

// Status dos negócios
db.all(`SELECT status, COUNT(*) as qtd FROM negocios 
        GROUP BY status 
        ORDER BY qtd DESC`, (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log('\n📊 Negócios por Status:\n');
    rows.forEach(row => {
        console.log(`   ${row.status}: ${row.qtd}`);
    });
});

// Últimos 5 negócios
db.all(`SELECT empresa, pessoa_contato, equipamento, origem, status, data_criacao 
        FROM negocios 
        ORDER BY data_criacao DESC 
        LIMIT 5`, (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log('\n📝 Últimos 5 Negócios:\n');
    if (rows.length === 0) {
        console.log('   Nenhum negócio registrado ainda.');
    } else {
        rows.forEach((row, index) => {
            const data = new Date(row.data_criacao).toLocaleString('pt-BR');
            console.log(`   ${index + 1}. ${row.empresa || 'N/A'}`);
            console.log(`      👤 Contato: ${row.pessoa_contato || 'N/A'}`);
            console.log(`      🏭 Equipamento: ${row.equipamento || 'N/A'}`);
            console.log(`      🔗 Origem: ${row.origem || 'N/A'}`);
            console.log(`      📊 Status: ${row.status || 'N/A'}`);
            console.log(`      📅 ${data}\n`);
        });
    }
    
    console.log('='.repeat(60));
    db.close();
});
