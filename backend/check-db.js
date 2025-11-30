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
    const despesas = await pool.query('SELECT COUNT(*) as total FROM despesas_condominio');
    const gas = await pool.query('SELECT COUNT(*) as total FROM leituras_gas');
    const banco = await pool.query('SELECT COUNT(*) as total FROM banco_transacoes');

    console.log('=== VERIFICAÇÃO DO BANCO DE DADOS ===');
    console.log('Despesas:', despesas.rows[0].total, 'registros');
    console.log('Leituras de Gás:', gas.rows[0].total, 'registros');
    console.log('Transações Bancárias:', banco.rows[0].total, 'registros');

    pool.end();
  } catch (err) {
    console.error('Erro:', err.message);
    pool.end();
  }
}

check();
