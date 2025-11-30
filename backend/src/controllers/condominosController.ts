import { Request, Response } from 'express';
import pool from '../config/database';

// Listar todos os condôminos
export const listarCondominos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM condominos ORDER BY apartamento'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar condôminos:', error);
    res.status(500).json({ erro: 'Erro ao listar condôminos' });
  }
};

// Obter condômino por apartamento
export const obterCondomino = async (req: Request, res: Response) => {
  try {
    const { apartamento } = req.params;
    const result = await pool.query(
      'SELECT * FROM condominos WHERE apartamento = $1',
      [apartamento]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Condômino não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter condômino:', error);
    res.status(500).json({ erro: 'Erro ao obter condômino' });
  }
};

// Atualizar condômino
export const atualizarCondomino = async (req: Request, res: Response) => {
  try {
    const { apartamento } = req.params;
    const { nome_proprietario, nome_morador, telefone, email } = req.body;

    if (!nome_proprietario) {
      return res.status(400).json({ erro: 'Nome do proprietário é obrigatório' });
    }

    const result = await pool.query(
      `UPDATE condominos
       SET nome_proprietario = $1, nome_morador = $2, telefone = $3, email = $4, atualizado_em = CURRENT_TIMESTAMP
       WHERE apartamento = $5
       RETURNING *`,
      [nome_proprietario, nome_morador || null, telefone || null, email || null, apartamento]
    );

    if (result.rows.length === 0) {
      // Se não existe, criar
      const insertResult = await pool.query(
        `INSERT INTO condominos (apartamento, nome_proprietario, nome_morador, telefone, email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [apartamento, nome_proprietario, nome_morador || null, telefone || null, email || null]
      );
      return res.status(201).json(insertResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar condômino:', error);
    res.status(500).json({ erro: 'Erro ao atualizar condômino' });
  }
};

// Obter configurações
export const obterConfiguracoes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM configuracoes');

    // Converter para objeto chave-valor
    const config: { [key: string]: string } = {};
    result.rows.forEach(row => {
      config[row.chave] = row.valor;
    });

    res.json(config);
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ erro: 'Erro ao obter configurações' });
  }
};

// Atualizar configuração
export const atualizarConfiguracao = async (req: Request, res: Response) => {
  try {
    const { chave, valor } = req.body;

    if (!chave || valor === undefined) {
      return res.status(400).json({ erro: 'Chave e valor são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO configuracoes (chave, valor)
       VALUES ($1, $2)
       ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = CURRENT_TIMESTAMP
       RETURNING *`,
      [chave, valor.toString()]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ erro: 'Erro ao atualizar configuração' });
  }
};

// Atualizar múltiplas configurações de uma vez
export const atualizarConfiguracoesBatch = async (req: Request, res: Response) => {
  try {
    const configuracoes = req.body;

    if (!Array.isArray(configuracoes)) {
      return res.status(400).json({ erro: 'Esperado um array de configurações' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const config of configuracoes) {
        const { chave, valor } = config;

        if (!chave || valor === undefined) {
          continue; // Pula configurações inválidas
        }

        await client.query(
          `INSERT INTO configuracoes (chave, valor)
           VALUES ($1, $2)
           ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = CURRENT_TIMESTAMP`,
          [chave, valor.toString()]
        );
      }

      await client.query('COMMIT');
      res.json({ sucesso: true, mensagem: 'Configurações atualizadas com sucesso' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações em lote:', error);
    res.status(500).json({ erro: 'Erro ao atualizar configurações' });
  }
};

// Obter valor do fundo de reserva calculado
export const obterFundoReserva = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    // Buscar configurações
    const configResult = await pool.query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')"
    );

    const config: { [key: string]: string } = {};
    configResult.rows.forEach(row => {
      config[row.chave] = row.valor;
    });

    const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
    const percentual = parseFloat(config.fundo_reserva_percentual || '10');

    // Se valor fixo > 0, usar valor fixo
    if (valorFixo > 0) {
      return res.json({
        tipo: 'fixo',
        valor: valorFixo,
        valor_por_apto: valorFixo
      });
    }

    // Senão, calcular com base no percentual sobre o condomínio
    const despesasResult = await pool.query(
      `SELECT SUM(valor) as total FROM despesas_condominio WHERE mes = $1 AND ano = $2`,
      [mes, ano]
    );

    const totalDespesas = parseFloat(despesasResult.rows[0]?.total || 0);
    const valorCondominioPorApto = totalDespesas / 6;
    const fundoReservaPorApto = valorCondominioPorApto * (percentual / 100);

    res.json({
      tipo: 'percentual',
      percentual,
      valor_base: valorCondominioPorApto,
      valor_por_apto: fundoReservaPorApto
    });
  } catch (error) {
    console.error('Erro ao calcular fundo de reserva:', error);
    res.status(500).json({ erro: 'Erro ao calcular fundo de reserva' });
  }
};
