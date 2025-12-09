import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { JWTPayload } from '../types';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    console.log('=== DEBUG LOGIN ===');
    console.log('Email recebido:', email);
    console.log('Senha recebida:', senha);
    console.log('Tamanho da senha:', senha ? senha.length : 0);
    console.log('Senha em hex:', senha ? Buffer.from(senha).toString('hex') : 'null');

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios',
        debug: { emailRecebido: !!email, senhaRecebida: !!senha }
      });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado para:', email);
      return res.status(401).json({
        erro: 'Usuário não encontrado',
        debug: { email, emailLength: email.length }
      });
    }

    const usuario = result.rows[0];
    console.log('✓ Usuário encontrado:', usuario.email);
    console.log('Hash no banco (primeiros 30):', usuario.senha.substring(0, 30));

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    console.log('Comparação bcrypt resultado:', senhaValida);

    if (!senhaValida) {
      // Testar com senha do ambiente
      const senhaAmbiente = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin/Balek';
      console.log('Senha esperada (do .env):', senhaAmbiente);
      console.log('Tamanho senha esperada:', senhaAmbiente.length);

      const hashEsperado = await bcrypt.hash(senhaAmbiente, 10);
      const testeComSenhaAmbiente = await bcrypt.compare(senha, hashEsperado);

      return res.status(401).json({
        erro: `Senha incorreta. Você digitou: "${senha}" (${senha.length} caracteres). Senha esperada: "${senhaAmbiente}" (${senhaAmbiente.length} caracteres)`,
        debug: {
          senhaDigitada: senha,
          senhaDigitadaLength: senha.length,
          senhaDigitadaHex: Buffer.from(senha).toString('hex'),
          senhaEsperada: senhaAmbiente,
          senhaEsperadaLength: senhaAmbiente.length,
          senhaEsperadaHex: Buffer.from(senhaAmbiente).toString('hex'),
          comparacaoResult: senhaValida,
          hashNoBanco: usuario.senha.substring(0, 30)
        }
      });
    }

    // Verificar se o email está autorizado (exceto para admin/administrador)
    if (usuario.tipo !== 'admin' && usuario.tipo !== 'administrador') {
      const emailPermitido = await pool.query(
        'SELECT * FROM emails_permitidos WHERE email = $1',
        [email]
      );

      if (emailPermitido.rows.length === 0) {
        return res.status(403).json({ erro: 'Email não autorizado para acesso ao sistema' });
      }
    }

    const payload: JWTPayload = {
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      apartamento: usuario.apartamento
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo,
        apartamento: usuario.apartamento
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
};

export const registrarMorador = async (req: Request, res: Response) => {
  try {
    const { email, senha, nome } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ erro: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se o email está na lista de permitidos
    const emailPermitido = await pool.query(
      'SELECT * FROM emails_permitidos WHERE email = $1 AND usado = false',
      [email]
    );

    if (emailPermitido.rows.length === 0) {
      return res.status(403).json({ erro: 'Email não autorizado para registro' });
    }

    const apartamento = emailPermitido.rows[0].apartamento;

    // Verificar se já existe usuário com esse email
    const usuarioExiste = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (email, senha, nome, tipo, apartamento)
       VALUES ($1, $2, $3, 'morador', $4)
       RETURNING id, email, nome, tipo, apartamento`,
      [email, senhaHash, nome, apartamento]
    );

    // Marcar email como usado
    await pool.query(
      'UPDATE emails_permitidos SET usado = true WHERE email = $1',
      [email]
    );

    const usuario = result.rows[0];

    const payload: JWTPayload = {
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      apartamento: usuario.apartamento
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.status(201).json({
      token,
      usuario
    });
  } catch (error) {
    console.error('Erro ao registrar morador:', error);
    res.status(500).json({ erro: 'Erro ao registrar morador' });
  }
};

export const adicionarEmailPermitido = async (req: Request, res: Response) => {
  try {
    const { email, apartamento } = req.body;

    if (!email || !apartamento) {
      return res.status(400).json({ erro: 'Email e apartamento são obrigatórios' });
    }

    // Validar número do apartamento (01 a 06)
    const aptoNum = parseInt(apartamento);
    if (aptoNum < 1 || aptoNum > 6) {
      return res.status(400).json({ erro: 'Apartamento deve ser entre 01 e 06' });
    }

    const aptoFormatado = apartamento.padStart(2, '0');

    const result = await pool.query(
      `INSERT INTO emails_permitidos (email, apartamento)
       VALUES ($1, $2)
       RETURNING *`,
      [email, aptoFormatado]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    console.error('Erro ao adicionar email permitido:', error);
    res.status(500).json({ erro: 'Erro ao adicionar email permitido' });
  }
};

export const listarEmailsPermitidos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emails_permitidos ORDER BY apartamento, criado_em DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar emails permitidos:', error);
    res.status(500).json({ erro: 'Erro ao listar emails permitidos' });
  }
};

export const removerEmailPermitido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar o email antes de excluir
    const emailResult = await pool.query(
      'SELECT email FROM emails_permitidos WHERE id = $1',
      [id]
    );

    if (emailResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Email não encontrado' });
    }

    const email = emailResult.rows[0].email;

    // Excluir o usuário associado (se existir)
    await pool.query(
      'DELETE FROM usuarios WHERE email = $1 AND tipo = $2',
      [email, 'morador']
    );

    // Excluir o email permitido
    await pool.query(
      'DELETE FROM emails_permitidos WHERE id = $1',
      [id]
    );

    res.json({ mensagem: 'Email e usuário removidos com sucesso' });
  } catch (error) {
    console.error('Erro ao remover email permitido:', error);
    res.status(500).json({ erro: 'Erro ao remover email permitido' });
  }
};

export const verificarToken = (req: Request, res: Response) => {
  res.json({ valido: true, usuario: req.usuario });
};

// Caminho da pasta de backups - detecta se é local (Windows) ou web (Linux/Render)
const isWindows = process.platform === 'win32';
const BACKUPS_DIR = isWindows
  ? 'D:\\Gestao-de-condominio\\Backups'
  : path.join(os.tmpdir(), 'backups'); // Para Render.com: usa diretório temporário do sistema

// Garantir que a pasta de backups existe
const garantirPastaBackups = () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
};

export const gerarBackup = async (req: Request, res: Response) => {
  try {
    console.log('🔥 DEMO BACKUP - VERSÃO ATUALIZADA - 09/12/2025 16:35');
    console.log('📦 Iniciando geração de backup...');
    console.log('📁 BACKUPS_DIR:', BACKUPS_DIR);
    console.log('🖥️ Platform:', process.platform);

    garantirPastaBackups();
    console.log('✓ Pasta de backups garantida');

    // Detectar ambiente baseado no Origin da requisição HTTP
    const origin = req.headers.origin || req.headers.referer || '';
    let ambiente = 'local';

    if (origin.includes('demo.balek.de')) {
      ambiente = 'demo';
    } else if (origin.includes('condominio.balek.de')) {
      ambiente = 'producao';
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      ambiente = 'local';
    }

    console.log('🌐 Origin:', origin, '→ Ambiente:', ambiente);

    // Buscar todos os dados do banco
    const tabelas = [
      'usuarios',
      'despesas',
      'transacoes_bancarias',
      'consumo_gas',
      'documentos',
      'atas_reuniao',
      'boletos',
      'condominos',
      'emails_permitidos',
      'saldo_mensal',
      'configuracoes'
    ];

    let sqlBackup = `-- Backup do banco de dados Residencial Balek\n`;
    sqlBackup += `-- Ambiente: ${ambiente}\n`;
    sqlBackup += `-- Data: ${new Date().toISOString()}\n\n`;

    for (const tabela of tabelas) {
      try {
        const result = await pool.query(`SELECT * FROM ${tabela}`);

        if (result.rows.length > 0) {
          sqlBackup += `\n-- Tabela: ${tabela}\n`;
          sqlBackup += `-- ${result.rows.length} registros\n\n`;

          for (const row of result.rows) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(v =>
              v === null ? 'NULL' :
              typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
              v instanceof Date ? `'${v.toISOString()}'` :
              v
            ).join(', ');

            sqlBackup += `INSERT INTO ${tabela} (${columns}) VALUES (${values});\n`;
          }
        }
      } catch (tabelaError) {
        // Tabela não existe ou erro ao acessar - ignorar e continuar
        console.log(`Tabela ${tabela} não encontrada ou erro ao acessar - pulando`);
      }
    }

    // Salvar arquivo na pasta de backups
    const filename = `backup-${ambiente}-${new Date().toISOString().split('T')[0]}.sql`;
    const filepath = path.join(BACKUPS_DIR, filename);

    console.log('💾 Tentando salvar backup em:', filepath);
    console.log('📊 Tamanho do SQL:', sqlBackup.length, 'caracteres');

    fs.writeFileSync(filepath, sqlBackup, 'utf-8');

    console.log(`✓ Backup salvo em: ${filepath}`);

    res.json({
      sucesso: true,
      mensagem: '🎉 CÓPIA REALIZADA COM SUCESSO - VERSÃO NOVA FUNCIONANDO!',
      arquivo: filename,
      pasta: BACKUPS_DIR,
      versaoDemo: '2.0-ATUALIZADO'
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar backup:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Message:', error.message);
    res.status(500).json({
      erro: 'Erro ao gerar backup',
      detalhes: error.message,
      platform: process.platform,
      backupsDir: BACKUPS_DIR
    });
  }
};

// Listar backups disponíveis
export const listarBackups = async (req: Request, res: Response) => {
  try {
    garantirPastaBackups();

    // Ler arquivos da pasta de backups
    const arquivos = fs.readdirSync(BACKUPS_DIR);

    // Filtrar apenas arquivos .sql
    const backups = arquivos
      .filter(arquivo => arquivo.endsWith('.sql'))
      .map(arquivo => {
        const filepath = path.join(BACKUPS_DIR, arquivo);
        const stats = fs.statSync(filepath);

        return {
          nome: arquivo,
          tamanho: stats.size,
          dataCriacao: stats.birthtime,
          dataModificacao: stats.mtime
        };
      })
      .sort((a, b) => b.dataModificacao.getTime() - a.dataModificacao.getTime()); // Mais recentes primeiro

    res.json({
      sucesso: true,
      backups,
      pasta: BACKUPS_DIR
    });

  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ erro: 'Erro ao listar backups' });
  }
};

// Restaurar backup selecionado
export const restaurarBackup = async (req: Request, res: Response) => {
  try {
    const { arquivo } = req.body;

    if (!arquivo) {
      return res.status(400).json({ erro: 'Nome do arquivo é obrigatório' });
    }

    const filepath = path.join(BACKUPS_DIR, arquivo);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ erro: 'Arquivo de backup não encontrado' });
    }

    // Ler conteúdo do backup
    const sqlContent = fs.readFileSync(filepath, 'utf-8');

    // Limpar todas as tabelas antes de restaurar
    const tabelas = [
      'emails_permitidos',
      'saldo_mensal',
      'boletos',
      'documentos',
      'atas_reuniao',
      'consumo_gas',
      'transacoes_bancarias',
      'despesas',
      'condominos',
      'usuarios',
      'configuracoes'
    ];

    console.log('🗑️ Limpando tabelas...');
    for (const tabela of tabelas) {
      try {
        await pool.query(`DELETE FROM ${tabela}`);
        console.log(`  ✓ Tabela ${tabela} limpa`);
      } catch (error) {
        console.log(`  ⚠️ Erro ao limpar ${tabela}:`, error);
      }
    }

    // Executar SQL do backup
    console.log('📥 Restaurando dados...');
    const statements = sqlContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          console.log(`⚠️ Erro ao executar: ${statement.substring(0, 50)}...`, error.message);
        }
      }
    }

    console.log('✅ Restauração concluída!');

    res.json({
      sucesso: true,
      mensagem: 'Backup restaurado com sucesso!',
      arquivo
    });

  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    res.status(500).json({ erro: 'Erro ao restaurar backup' });
  }
};
