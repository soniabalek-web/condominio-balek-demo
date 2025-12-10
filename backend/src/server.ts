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
import atasRoutes from './routes/atasRoutes';
import fornecedoresRoutes from './routes/fornecedoresRoutes';
import maoDeObraRoutes from './routes/maoDeObraRoutes';

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
app.use('/api/atas', atasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/mao-de-obra', maoDeObraRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
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
      const senhaHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin/Balek', 10);

      await pool.query(
        `INSERT INTO usuarios (email, senha, nome, tipo)
         VALUES ($1, $2, $3, 'administrador')`,
        ['admin@residencialbalek.com', senhaHash, 'Administrador']
      );

      console.log('✓ Administrador padrão criado');
      console.log('  Email: admin@residencialbalek.com');
      console.log('  Senha:', process.env.ADMIN_DEFAULT_PASSWORD || 'Admin/Balek');
    } else {
      console.log('✓ Administrador já existe:', result.rows[0].email);
      console.log('Resetando senha do administrador para a senha padrão...');

      const senhaHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin/Balek', 10);

      await pool.query(
        `UPDATE usuarios SET senha = $1 WHERE email = $2`,
        [senhaHash, 'admin@residencialbalek.com']
      );

      console.log('✓ Senha do administrador resetada');
      console.log('  Email: admin@residencialbalek.com');
      console.log('  Nova senha:', process.env.ADMIN_DEFAULT_PASSWORD || 'Admin/Balek');
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
