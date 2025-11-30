const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'residencial_balek',
  user: 'postgres',
  password: 'BD/2918'
});

async function check() {
  try {
    console.log('=== DESPESAS POR MÊS/ANO ===');
    const despesas = await pool.query('SELECT mes, ano, COUNT(*) as total FROM despesas_condominio GROUP BY mes, ano ORDER BY ano, mes');
    despesas.rows.forEach(row => {
      console.log(`${row.mes}/${row.ano}: ${row.total} despesas`);
    });

    console.log('\n=== LEITURAS DE GÁS POR MÊS/ANO ===');
    const gas = await pool.query('SELECT mes, ano, COUNT(*) as total FROM leituras_gas GROUP BY mes, ano ORDER BY ano, mes');
    gas.rows.forEach(row => {
      console.log(`${row.mes}/${row.ano}: ${row.total} leituras`);
    });

    console.log('\n=== TRANSAÇÕES BANCÁRIAS POR MÊS/ANO ===');
    const banco = await pool.query('SELECT mes, ano, COUNT(*) as total FROM banco_transacoes GROUP BY mes, ano ORDER BY ano, mes');
    banco.rows.forEach(row => {
      console.log(`${row.mes}/${row.ano}: ${row.total} transações`);
    });

    pool.end();
  } catch (err) {
    console.error('Erro:', err.message);
    pool.end();
  }
}

check();
