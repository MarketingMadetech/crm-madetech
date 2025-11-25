const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
console.log('║          📊 RELATÓRIO COMPLETO DO CRM MADETECH 📊                     ║');
console.log('║                    Análise de Atividades                               ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

const dataAtual = new Date().toLocaleDateString('pt-BR');
console.log(`📅 Data do relatório: ${dataAtual}\n`);

// Data de referência (últimos 7 dias)
const setediasAtras = new Date();
setediasAtras.setDate(setediasAtras.getDate() - 7);
const dataReferencia = setediasAtras.toISOString().split('T')[0];

// 1. RESUMO EXECUTIVO
console.log('═'.repeat(75));
console.log('📊 RESUMO EXECUTIVO');
console.log('═'.repeat(75));

db.get(`
    SELECT 
        COUNT(*) as total_negocios,
        COUNT(CASE WHEN status = 'Venda Confirmada' THEN 1 END) as vendas,
        COUNT(CASE WHEN status = 'Em andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN updated_at >= ? THEN 1 END) as atualizados_7dias
    FROM negocios
`, [dataReferencia], (err, row) => {
    if (err) {
        console.error('Erro ao buscar resumo:', err);
        return;
    }
    
    console.log(`\n📈 Total de negócios no sistema: ${row.total_negocios}`);
    console.log(`💰 Vendas confirmadas: ${row.vendas} (${((row.vendas/row.total_negocios)*100).toFixed(1)}%)`);
    console.log(`🔄 Em andamento: ${row.em_andamento} (${((row.em_andamento/row.total_negocios)*100).toFixed(1)}%)`);
    console.log(`📊 Atualizados nos últimos 7 dias: ${row.atualizados_7dias}`);
});

// 2. ATIVIDADE POR DIA
setTimeout(() => {
    console.log('\n' + '═'.repeat(75));
    console.log('📅 ATIVIDADE DOS ÚLTIMOS 7 DIAS');
    console.log('═'.repeat(75));
    
    db.all(`
        SELECT 
            DATE(updated_at) as data,
            COUNT(*) as total_atividades,
            COUNT(DISTINCT empresa) as empresas_distintas
        FROM negocios 
        WHERE updated_at >= ?
        GROUP BY DATE(updated_at)
        ORDER BY data DESC
    `, [dataReferencia], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar atividades diárias:', err);
            return;
        }
        
        if (rows.length > 0) {
            console.log('');
            rows.forEach(row => {
                const dataFormatada = new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'short', 
                    day: '2-digit', 
                    month: '2-digit' 
                });
                console.log(`📍 ${dataFormatada}: ${row.total_atividades} atividades | ${row.empresas_distintas} empresas`);
            });
        } else {
            console.log('\n❌ Nenhuma atividade nos últimos 7 dias');
        }
    });
}, 100);

// 3. DISTRIBUIÇÃO POR STATUS
setTimeout(() => {
    console.log('\n' + '═'.repeat(75));
    console.log('📊 DISTRIBUIÇÃO POR STATUS');
    console.log('═'.repeat(75) + '\n');
    
    db.all(`
        SELECT 
            status, 
            COUNT(*) as total,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM negocios), 1) as percentual
        FROM negocios 
        GROUP BY status 
        ORDER BY total DESC
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar status:', err);
            return;
        }
        
        if (rows.length > 0) {
            rows.forEach(row => {
                const status = row.status || 'Sem status';
                const barra = '█'.repeat(Math.floor(row.percentual / 2));
                console.log(`${status.padEnd(20)} │ ${row.total.toString().padStart(3)} │ ${row.percentual}% ${barra}`);
            });
        }
    });
}, 200);

// 4. TOP 10 NEGÓCIOS MAIS RECENTES
setTimeout(() => {
    console.log('\n' + '═'.repeat(75));
    console.log('🔥 TOP 10 NEGÓCIOS MAIS RECENTES');
    console.log('═'.repeat(75) + '\n');
    
    db.all(`
        SELECT 
            empresa, 
            pessoa_contato, 
            telefone, 
            email, 
            etapa, 
            status,
            equipamento,
            tipo_maquina,
            tipo_negociacao,
            valor_produto,
            valor_oferta,
            updated_at
        FROM negocios 
        ORDER BY updated_at DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar últimos negócios:', err);
            return;
        }
        
        if (rows.length > 0) {
            rows.forEach((row, index) => {
                const data = new Date(row.updated_at).toLocaleString('pt-BR');
                console.log(`${(index + 1).toString().padStart(2)}. 🏢 ${row.empresa}`);
                console.log(`    👤 Contato: ${row.pessoa_contato || 'N/A'}`);
                console.log(`    📞 Tel: ${row.telefone || 'N/A'}`);
                console.log(`    📧 Email: ${row.email || 'N/A'}`);
                console.log(`    🎯 Etapa: ${row.etapa || 'N/A'}`);
                console.log(`    📊 Status: ${row.status || 'N/A'}`);
                console.log(`    🔧 Equipamento: ${row.equipamento || 'N/A'}`);
                console.log(`    ⚙️  Tipo: ${row.tipo_maquina || 'N/A'}`);
                console.log(`    💼 Negociação: ${row.tipo_negociacao || 'N/A'}`);
                if (row.valor_produto) {
                    console.log(`    💵 Valor Produto: R$ ${parseFloat(row.valor_produto).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
                }
                if (row.valor_oferta) {
                    console.log(`    💰 Valor Oferta: R$ ${parseFloat(row.valor_oferta).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
                }
                console.log(`    🕒 Atualizado: ${data}`);
                console.log('    ' + '─'.repeat(70) + '\n');
            });
        } else {
            console.log('   Nenhum negócio cadastrado ainda\n');
        }
    });
}, 300);

// 5. ANÁLISE POR ETAPA
setTimeout(() => {
    console.log('═'.repeat(75));
    console.log('🎯 DISTRIBUIÇÃO POR ETAPA DO FUNIL');
    console.log('═'.repeat(75) + '\n');
    
    db.all(`
        SELECT 
            etapa, 
            COUNT(*) as total,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM negocios), 1) as percentual
        FROM negocios 
        WHERE etapa IS NOT NULL
        GROUP BY etapa 
        ORDER BY total DESC
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar etapas:', err);
            return;
        }
        
        if (rows.length > 0) {
            rows.forEach(row => {
                const barra = '▓'.repeat(Math.floor(row.percentual / 2));
                console.log(`${row.etapa.padEnd(25)} │ ${row.total.toString().padStart(3)} │ ${row.percentual}% ${barra}`);
            });
        }
    });
}, 400);

// 6. MÁQUINAS MAIS PROCURADAS
setTimeout(() => {
    console.log('\n' + '═'.repeat(75));
    console.log('⚙️  TOP 10 MÁQUINAS MAIS PROCURADAS');
    console.log('═'.repeat(75) + '\n');
    
    db.all(`
        SELECT 
            tipo_maquina,
            COUNT(*) as total
        FROM negocios 
        WHERE tipo_maquina IS NOT NULL AND tipo_maquina != ''
        GROUP BY tipo_maquina 
        ORDER BY total DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar máquinas:', err);
            return;
        }
        
        if (rows.length > 0) {
            rows.forEach((row, index) => {
                console.log(`${(index + 1).toString().padStart(2)}. ${row.tipo_maquina.padEnd(40)} │ ${row.total} negócio(s)`);
            });
        } else {
            console.log('   Nenhum tipo de máquina registrado\n');
        }
    });
}, 500);

// 7. ANÁLISE DE VALORES
setTimeout(() => {
    console.log('\n' + '═'.repeat(75));
    console.log('💰 ANÁLISE DE VALORES DE PROPOSTA');
    console.log('═'.repeat(75));
    
    db.get(`
        SELECT 
            COUNT(*) as total_com_valor,
            SUM(CAST(valor_produto AS REAL)) as valor_total,
            AVG(CAST(valor_produto AS REAL)) as valor_medio,
            MIN(CAST(valor_produto AS REAL)) as valor_minimo,
            MAX(CAST(valor_produto AS REAL)) as valor_maximo
        FROM negocios 
        WHERE valor_produto IS NOT NULL AND valor_produto != '' AND CAST(valor_produto AS REAL) > 0
    `, (err, row) => {
        if (err) {
            console.error('Erro ao buscar valores:', err);
            return;
        }
        
        console.log('');
        if (row.total_com_valor > 0) {
            console.log(`📊 Negócios com valor: ${row.total_com_valor}`);
            console.log(`💵 Valor total em produtos: R$ ${row.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            console.log(`📈 Ticket médio: R$ ${row.valor_medio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            console.log(`⬇️  Menor valor: R$ ${row.valor_minimo.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            console.log(`⬆️  Maior valor: R$ ${row.valor_maximo.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        } else {
            console.log('❌ Nenhum negócio com valor registrado');
        }
    });
}, 600);

// 8. HISTÓRICO DE ATIVIDADES
setTimeout(() => {
    console.log('\n' + '═'.repeat(75));
    console.log('📜 HISTÓRICO DE ATIVIDADES RECENTES');
    console.log('═'.repeat(75) + '\n');
    
    db.all(`
        SELECT 
            h.*,
            n.empresa
        FROM historico h
        LEFT JOIN negocios n ON h.negocio_id = n.id
        ORDER BY h.data_hora DESC
        LIMIT 15
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar histórico:', err);
            db.close();
            return;
        }
        
        if (rows.length > 0) {
            rows.forEach((row, index) => {
                const data = new Date(row.data_hora).toLocaleString('pt-BR');
                console.log(`${(index + 1).toString().padStart(2)}. [${data}]`);
                console.log(`    🏢 ${row.empresa || 'N/A'}`);
                console.log(`    📝 ${row.tipo_acao || 'Atividade'}`);
                if (row.campo_alterado) {
                    console.log(`    🔄 Campo: ${row.campo_alterado}`);
                }
                if (row.valor_anterior && row.valor_novo) {
                    console.log(`    ⬅️  De: "${row.valor_anterior}"`);
                    console.log(`    ➡️  Para: "${row.valor_novo}"`);
                }
                if (row.usuario) {
                    console.log(`    👤 Por: ${row.usuario}`);
                }
                console.log('');
            });
        } else {
            console.log('   Nenhuma atividade no histórico\n');
        }
        
        console.log('╔════════════════════════════════════════════════════════════════════════╗');
        console.log('║                      FIM DO RELATÓRIO                                  ║');
        console.log('╚════════════════════════════════════════════════════════════════════════╝\n');
        
        db.close();
    });
}, 700);
