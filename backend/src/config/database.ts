import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// SQL para criar as tabelas
export const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tabela de usuários (administradores e moradores)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('administrador', 'morador')),
        apartamento VARCHAR(2),
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de emails permitidos (para registro de moradores)
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails_permitidos (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        apartamento VARCHAR(2) NOT NULL,
        usado BOOLEAN DEFAULT false,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de categorias de despesas fixas
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias_despesas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        ordem INTEGER,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de controle bancário
    await client.query(`
      CREATE TABLE IF NOT EXISTS banco_transacoes (
        id SERIAL PRIMARY KEY,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('debito', 'credito')),
        categoria_id INTEGER REFERENCES categorias_despesas(id),
        descricao TEXT NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        ratear_condominos BOOLEAN DEFAULT true,
        data_transacao DATE NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_por INTEGER REFERENCES usuarios(id)
      )
    `);

    // Tabela de saldo bancário mensal
    await client.query(`
      CREATE TABLE IF NOT EXISTS banco_saldo (
        id SERIAL PRIMARY KEY,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        saldo_inicial DECIMAL(10, 2) NOT NULL,
        saldo_final DECIMAL(10, 2),
        saldo_extrato DECIMAL(10, 2),
        conferido BOOLEAN DEFAULT false,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mes, ano)
      )
    `);

    // Tabela de despesas do condomínio (consolidado mensal)
    await client.query(`
      CREATE TABLE IF NOT EXISTS despesas_condominio (
        id SERIAL PRIMARY KEY,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        categoria_id INTEGER REFERENCES categorias_despesas(id),
        descricao TEXT NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        valor_por_apto DECIMAL(10, 2) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mes, ano, categoria_id, descricao)
      )
    `);

    // Tabela de despesas parceladas
    await client.query(`
      CREATE TABLE IF NOT EXISTS despesas_parceladas (
        id SERIAL PRIMARY KEY,
        descricao TEXT NOT NULL,
        valor_total DECIMAL(10, 2) NOT NULL,
        num_parcelas INTEGER NOT NULL,
        valor_parcela DECIMAL(10, 2) NOT NULL,
        mes_inicio INTEGER NOT NULL,
        ano_inicio INTEGER NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de parcelas cobradas
    await client.query(`
      CREATE TABLE IF NOT EXISTS parcelas_cobradas (
        id SERIAL PRIMARY KEY,
        despesa_parcelada_id INTEGER REFERENCES despesas_parceladas(id) ON DELETE CASCADE,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        parcela_numero INTEGER NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        cobrado BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(despesa_parcelada_id, mes, ano)
      )
    `);

    // Tabela de leituras de gás
    await client.query(`
      CREATE TABLE IF NOT EXISTS leituras_gas (
        id SERIAL PRIMARY KEY,
        apartamento VARCHAR(2) NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        leitura_atual DECIMAL(10, 3) NOT NULL,
        leitura_anterior DECIMAL(10, 3),
        consumo DECIMAL(10, 3),
        valor_m3 DECIMAL(10, 2) NOT NULL,
        valor_total DECIMAL(10, 2),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(apartamento, mes, ano)
      )
    `);

    // Tabela de documentos/anexos
    await client.query(`
      CREATE TABLE IF NOT EXISTS documentos (
        id SERIAL PRIMARY KEY,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho_arquivo TEXT NOT NULL,
        tamanho INTEGER,
        mime_type VARCHAR(100),
        descricao TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_por INTEGER REFERENCES usuarios(id)
      )
    `);

    // Tabela de atas de reunião
    await client.query(`
      CREATE TABLE IF NOT EXISTS atas_reuniao (
        id SERIAL PRIMARY KEY,
        data_reuniao DATE NOT NULL UNIQUE,
        titulo VARCHAR(255),
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho_arquivo TEXT NOT NULL,
        tamanho INTEGER,
        mime_type VARCHAR(100),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_por INTEGER REFERENCES usuarios(id)
      )
    `);

    // Tabela de pagamentos dos moradores
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamentos_moradores (
        id SERIAL PRIMARY KEY,
        apartamento VARCHAR(2) NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        valor_condominio DECIMAL(10, 2) NOT NULL,
        valor_gas DECIMAL(10, 2) NOT NULL,
        valor_total DECIMAL(10, 2) NOT NULL,
        pago BOOLEAN DEFAULT false,
        data_pagamento DATE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(apartamento, mes, ano)
      )
    `);

    // Tabela de condôminos (proprietários)
    await client.query(`
      CREATE TABLE IF NOT EXISTS condominos (
        id SERIAL PRIMARY KEY,
        apartamento VARCHAR(2) UNIQUE NOT NULL,
        nome_proprietario VARCHAR(255) NOT NULL,
        nome_morador VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna nome_morador se não existir (migração)
    await client.query(`
      ALTER TABLE condominos
      ADD COLUMN IF NOT EXISTS nome_morador VARCHAR(255)
    `);

    // Adicionar coluna foto_medidor na tabela leituras_gas se não existir (migração)
    await client.query(`
      ALTER TABLE leituras_gas
      ADD COLUMN IF NOT EXISTS foto_medidor TEXT
    `);

    // Adicionar colunas de comprovante na tabela banco_transacoes se não existirem (migração)
    await client.query(`
      ALTER TABLE banco_transacoes
      ADD COLUMN IF NOT EXISTS comprovante TEXT,
      ADD COLUMN IF NOT EXISTS comprovante_nome VARCHAR(255),
      ADD COLUMN IF NOT EXISTS comprovante_tipo VARCHAR(100)
    `);

    // Tabela de configurações do condomínio
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT NOT NULL,
        descricao TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inserir categorias padrão
    await client.query(`
      INSERT INTO categorias_despesas (nome, ordem) VALUES
      ('Barigui Internet', 1),
      ('Copel Energia', 2),
      ('Sanepar água', 3),
      ('Jardineiro', 4),
      ('Produtos', 5),
      ('Maria aux adm e limpeza', 6),
      ('Manutenção Prédio', 7)
      ON CONFLICT DO NOTHING
    `);

    // Inserir configuração padrão do fundo de reserva e número de apartamentos
    await client.query(`
      INSERT INTO configuracoes (chave, valor, descricao) VALUES
      ('fundo_reserva_percentual', '10', 'Percentual do fundo de reserva sobre o valor do condomínio'),
      ('fundo_reserva_valor_fixo', '0', 'Valor fixo do fundo de reserva (se > 0, ignora percentual)'),
      ('numero_apartamentos', '6', 'Número total de apartamentos no condomínio')
      ON CONFLICT (chave) DO NOTHING
    `);

    // Buscar número de apartamentos configurado
    const configResult = await client.query(
      `SELECT valor FROM configuracoes WHERE chave = 'numero_apartamentos'`
    );
    const numeroApartamentos = parseInt(configResult.rows[0]?.valor || '6', 10);

    // Inserir condôminos dinamicamente baseado no número configurado
    const condominosValues = [];
    for (let i = 1; i <= numeroApartamentos; i++) {
      const apto = i.toString().padStart(2, '0');
      condominosValues.push(`('${apto}', 'Proprietário Apto ${apto}')`);
    }

    if (condominosValues.length > 0) {
      await client.query(`
        INSERT INTO condominos (apartamento, nome_proprietario) VALUES
        ${condominosValues.join(',\n        ')}
        ON CONFLICT (apartamento) DO NOTHING
      `);
    }

    // Tabela de fornecedores
    await client.query(`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        endereco TEXT,
        contato VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255),
        pessoa_contato VARCHAR(255),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de mão de obra
    await client.query(`
      CREATE TABLE IF NOT EXISTS mao_de_obra (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        endereco TEXT,
        contato VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255),
        pessoa_contato VARCHAR(255),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
