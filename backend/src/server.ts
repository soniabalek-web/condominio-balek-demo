import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { createTables } from './config/database';
import bcrypt from 'bcryptjs';

// Importar rotas
import authRoutes from './routes/authRoutes';
import despesasRoutes from './routes/despesasRoutes';
import bancoRoutes from './routes/bancoRoutes';
import gasRoutes from './routes/gasRoutes';
import documentosRoutes from './routes/documentosRoutes';
import relatoriosRoutes from './routes/relatoriosRoutes';
import boletoRoutes from './routes/boletoRoutes';
import condominosRoutes from './routes/condominosRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares de Segurança
// CORS configurado para aceitar apenas domínio autorizado
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não autorizado pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proteção contra body parsing muito grande (DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers de segurança adicionais
app.use((req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Política de segurança de conteúdo
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  // HTTPS strict
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/despesas', despesasRoutes);
app.use('/api/banco', bancoRoutes);
app.use('/api/gas', gasRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/boletos', boletoRoutes);
app.use('/api/condominos', condominosRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
});

// Rota temporária para copiar dados do schema public para demo
app.post('/api/copiar-dados-demo', async (req, res) => {
  try {
    const client = await pool.connect();

    try {
      console.log('Iniciando cópia de dados do schema public para demo...');

      // Limpar dados existentes no schema demo
      await client.query('TRUNCATE TABLE demo.parcelas_cobradas CASCADE');
      await client.query('TRUNCATE TABLE demo.despesas_parceladas CASCADE');
      await client.query('TRUNCATE TABLE demo.pagamentos_moradores CASCADE');
      await client.query('TRUNCATE TABLE demo.leituras_gas CASCADE');
      await client.query('TRUNCATE TABLE demo.documentos CASCADE');
      await client.query('TRUNCATE TABLE demo.despesas_condominio CASCADE');
      await client.query('TRUNCATE TABLE demo.banco_transacoes CASCADE');
      await client.query('TRUNCATE TABLE demo.banco_saldo CASCADE');
      await client.query('TRUNCATE TABLE demo.emails_permitidos CASCADE');
      await client.query('TRUNCATE TABLE demo.condominos CASCADE');
      await client.query('TRUNCATE TABLE demo.categorias_despesas CASCADE');
      await client.query('TRUNCATE TABLE demo.configuracoes CASCADE');
      await client.query('TRUNCATE TABLE demo.usuarios CASCADE');

      // Copiar tabelas na ordem correta (respeitando foreign keys)
      await client.query('INSERT INTO demo.usuarios SELECT * FROM public.usuarios');
      await client.query("SELECT setval('demo.usuarios_id_seq', (SELECT MAX(id) FROM demo.usuarios))");

      await client.query('INSERT INTO demo.configuracoes SELECT * FROM public.configuracoes');
      await client.query("SELECT setval('demo.configuracoes_id_seq', (SELECT MAX(id) FROM demo.configuracoes))");

      await client.query('INSERT INTO demo.categorias_despesas SELECT * FROM public.categorias_despesas');
      await client.query("SELECT setval('demo.categorias_despesas_id_seq', (SELECT MAX(id) FROM demo.categorias_despesas))");

      await client.query('INSERT INTO demo.condominos SELECT * FROM public.condominos');
      await client.query("SELECT setval('demo.condominos_id_seq', (SELECT MAX(id) FROM demo.condominos))");

      await client.query('INSERT INTO demo.emails_permitidos SELECT * FROM public.emails_permitidos');
      await client.query("SELECT setval('demo.emails_permitidos_id_seq', (SELECT MAX(id) FROM demo.emails_permitidos))");

      await client.query('INSERT INTO demo.banco_saldo SELECT * FROM public.banco_saldo');
      await client.query("SELECT setval('demo.banco_saldo_id_seq', (SELECT MAX(id) FROM demo.banco_saldo))");

      await client.query('INSERT INTO demo.banco_transacoes SELECT * FROM public.banco_transacoes');
      await client.query("SELECT setval('demo.banco_transacoes_id_seq', (SELECT MAX(id) FROM demo.banco_transacoes))");

      await client.query('INSERT INTO demo.despesas_condominio SELECT * FROM public.despesas_condominio');
      await client.query("SELECT setval('demo.despesas_condominio_id_seq', (SELECT MAX(id) FROM demo.despesas_condominio))");

      await client.query('INSERT INTO demo.documentos SELECT * FROM public.documentos');
      await client.query("SELECT setval('demo.documentos_id_seq', (SELECT MAX(id) FROM demo.documentos))");

      await client.query('INSERT INTO demo.leituras_gas SELECT * FROM public.leituras_gas');
      await client.query("SELECT setval('demo.leituras_gas_id_seq', (SELECT MAX(id) FROM demo.leituras_gas))");

      await client.query('INSERT INTO demo.pagamentos_moradores SELECT * FROM public.pagamentos_moradores');
      await client.query("SELECT setval('demo.pagamentos_moradores_id_seq', (SELECT MAX(id) FROM demo.pagamentos_moradores))");

      await client.query('INSERT INTO demo.despesas_parceladas SELECT * FROM public.despesas_parceladas');
      await client.query("SELECT setval('demo.despesas_parceladas_id_seq', (SELECT MAX(id) FROM demo.despesas_parceladas))");

      await client.query('INSERT INTO demo.parcelas_cobradas SELECT * FROM public.parcelas_cobradas');
      await client.query("SELECT setval('demo.parcelas_cobradas_id_seq', (SELECT MAX(id) FROM demo.parcelas_cobradas))");

      console.log('✓ Dados copiados com sucesso!');

      res.json({
        sucesso: true,
        mensagem: 'Dados copiados do sistema real para o demo com sucesso!'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao copiar dados:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao copiar dados',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    erro: err.message || 'Erro interno do servidor'
  });
});

// Função para criar usuário administrador padrão
const criarAdminPadrao = async () => {
  try {
    console.log('Verificando administrador padrão...');

    // Verificar se já existe um administrador
    const result = await pool.query(
      "SELECT id, email FROM usuarios WHERE tipo = 'administrador' LIMIT 1"
    );

    if (result.rows.length === 0) {
      console.log('Nenhum administrador encontrado, criando...');
      const senhaHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025', 10);

      await pool.query(
        `INSERT INTO usuarios (email, senha, nome, tipo)
         VALUES ($1, $2, $3, 'administrador')`,
        ['admin@residencialbalek.com', senhaHash, 'Administrador']
      );

      console.log('✓ Administrador padrão criado');
      console.log('  Email: admin@residencialbalek.com');
      console.log('  Senha:', process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025');
    } else {
      console.log('✓ Administrador já existe:', result.rows[0].email);
      console.log('Resetando senha do administrador para a senha padrão...');

      const senhaHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025', 10);

      await pool.query(
        `UPDATE usuarios SET senha = $1 WHERE email = $2`,
        [senhaHash, 'admin@residencialbalek.com']
      );

      console.log('✓ Senha do administrador resetada');
      console.log('  Email: admin@residencialbalek.com');
      console.log('  Nova senha:', process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025');
    }
  } catch (error) {
    console.error('Erro ao criar administrador padrão:', error);
  }
};

// Inicialização
const iniciar = async () => {
  try {
    // Testar conexão com banco
    await pool.query('SELECT NOW()');
    console.log('✓ Conectado ao banco de dados PostgreSQL');

    // Criar tabelas
    await createTables();
    console.log('✓ Tabelas do banco de dados verificadas');

    // Criar admin padrão
    await criarAdminPadrao();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

iniciar();

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nEncerrando servidor...');
  await pool.end();
  process.exit(0);
});

export default app;
