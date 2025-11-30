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
    const result = await pool.query('SELECT email, nome, tipo FROM usuarios WHERE tipo = $1', ['administrador']);

    console.log('=== USUÁRIOS ADMINISTRADORES ===');
    if (result.rows.length === 0) {
      console.log('NENHUM administrador encontrado!');
    } else {
      result.rows.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Nome: ${user.nome}`);
        console.log(`Tipo: ${user.tipo}`);
        console.log('---');
      });
    }

    pool.end();
  } catch (err) {
    console.error('Erro:', err.message);
    pool.end();
  }
}

check();
