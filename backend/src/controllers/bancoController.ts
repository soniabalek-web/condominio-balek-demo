import { Request, Response } from 'express';
import pool from '../config/database';

// Criar/Atualizar saldo mensal
export const salvarSaldoMensal = async (req: Request, res: Response) => {
  try {
    const { mes, ano, saldo_inicial, saldo_extrato } = req.body;

    if (!mes || !ano || saldo_inicial === undefined) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const result = await pool.query(
      `INSERT INTO banco_saldo (mes, ano, saldo_inicial, saldo_extrato)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (mes, ano)
       DO UPDATE SET saldo_inicial = $3, saldo_extrato = $4
       RETURNING *`,
      [mes, ano, saldo_inicial, saldo_extrato]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar saldo mensal:', error);
    res.status(500).json({ erro: 'Erro ao salvar saldo mensal' });
  }
};

// Obter saldo mensal
export const obterSaldoMensal = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    const result = await pool.query(
      'SELECT * FROM banco_saldo WHERE mes = $1 AND ano = $2',
      [mes, ano]
    );

    // Se não existe, buscar saldo_final do mês anterior
    if (result.rows.length === 0) {
      // Calcular mês anterior
      let mesAnterior = parseInt(mes) - 1;
      let anoAnterior = parseInt(ano);
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anoAnterior--;
      }

      // Buscar saldo final do mês anterior
      const saldoAnteriorResult = await pool.query(
        'SELECT saldo_final FROM banco_saldo WHERE mes = $1 AND ano = $2',
        [mesAnterior, anoAnterior]
      );

      const saldoInicialDoAnterior = saldoAnteriorResult.rows.length > 0
        ? parseFloat(saldoAnteriorResult.rows[0].saldo_final) || 0
        : 0;

      return res.json({
        mes: parseInt(mes),
        ano: parseInt(ano),
        saldo_inicial: saldoInicialDoAnterior,
        saldo_final: saldoInicialDoAnterior,
        saldo_extrato: null,
        conferido: false
      });
    }

    const saldoData = result.rows[0];

    // Sempre buscar saldo_inicial do mês anterior para garantir consistência
    let mesAnterior = parseInt(mes) - 1;
    let anoAnterior = parseInt(ano);
    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior--;
    }

    const saldoAnteriorResult = await pool.query(
      'SELECT saldo_final FROM banco_saldo WHERE mes = $1 AND ano = $2',
      [mesAnterior, anoAnterior]
    );

    // Se existe mês anterior, usar o saldo_final dele como saldo_inicial
    const saldoInicial = saldoAnteriorResult.rows.length > 0
      ? parseFloat(saldoAnteriorResult.rows[0].saldo_final) || parseFloat(saldoData.saldo_inicial) || 0
      : parseFloat(saldoData.saldo_inicial) || 0;

    const transacoesResult = await pool.query(
      `SELECT
         SUM(CASE WHEN tipo = 'credito' THEN valor ELSE 0 END) as total_creditos,
         SUM(CASE WHEN tipo = 'debito' THEN valor ELSE 0 END) as total_debitos
       FROM banco_transacoes
       WHERE mes = $1 AND ano = $2`,
      [mes, ano]
    );

    const totalCreditos = parseFloat(transacoesResult.rows[0]?.total_creditos || 0);
    const totalDebitos = parseFloat(transacoesResult.rows[0]?.total_debitos || 0);
    const saldoFinal = saldoInicial + totalCreditos - totalDebitos;

    // Atualizar saldo_final no banco
    await pool.query(
      'UPDATE banco_saldo SET saldo_final = $1 WHERE mes = $2 AND ano = $3',
      [saldoFinal, mes, ano]
    );

    // Retornar com saldo_inicial e saldo_final atualizados
    res.json({
      ...saldoData,
      saldo_inicial: saldoInicial,
      saldo_final: saldoFinal
    });
  } catch (error) {
    console.error('Erro ao obter saldo mensal:', error);
    res.status(500).json({ erro: 'Erro ao obter saldo mensal' });
  }
};

// Criar transação bancária
export const criarTransacao = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { mes, ano, tipo, categoria_id, descricao, valor, ratear_condominos, data_transacao } = req.body;
    const usuario_id = req.usuario?.id;

    if (!mes || !ano || !tipo || !descricao || valor === undefined || !data_transacao) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    await client.query('BEGIN');

    // Criar a transação bancária
    const transacaoResult = await client.query(
      `INSERT INTO banco_transacoes
       (mes, ano, tipo, categoria_id, descricao, valor, ratear_condominos, data_transacao, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [mes, ano, tipo, categoria_id, descricao, valor, ratear_condominos, data_transacao, usuario_id]
    );

    // Se for débito e deve ratear, adicionar automaticamente às despesas do condomínio
    if (tipo === 'debito' && ratear_condominos) {
      const valorPorApto = valor / 6;
      await client.query(
        `INSERT INTO despesas_condominio (mes, ano, categoria_id, descricao, valor, valor_por_apto)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mes, ano, categoria_id, descricao)
         DO UPDATE SET valor = $5, valor_por_apto = $6`,
        [mes, ano, categoria_id, descricao, valor, valorPorApto]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(transacaoResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ erro: 'Erro ao criar transação' });
  } finally {
    client.release();
  }
};

// Listar transações por período
export const listarTransacoes = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    const result = await pool.query(
      `SELECT bt.*, cd.nome as categoria_nome, u.nome as criado_por_nome
       FROM banco_transacoes bt
       LEFT JOIN categorias_despesas cd ON bt.categoria_id = cd.id
       LEFT JOIN usuarios u ON bt.criado_por = u.id
       WHERE bt.mes = $1 AND bt.ano = $2
       ORDER BY bt.data_transacao DESC, bt.criado_em DESC`,
      [mes, ano]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ erro: 'Erro ao listar transações' });
  }
};

// Atualizar transação
export const atualizarTransacao = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { tipo, categoria_id, descricao, valor, ratear_condominos, data_transacao } = req.body;

    await client.query('BEGIN');

    // Buscar transação antiga para comparar
    const transacaoAntigaResult = await client.query(
      'SELECT * FROM banco_transacoes WHERE id = $1',
      [id]
    );

    if (transacaoAntigaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Transação não encontrada' });
    }

    const transacaoAntiga = transacaoAntigaResult.rows[0];

    // Atualizar a transação
    const result = await client.query(
      `UPDATE banco_transacoes
       SET tipo = $1, categoria_id = $2, descricao = $3, valor = $4,
           ratear_condominos = $5, data_transacao = $6
       WHERE id = $7
       RETURNING *`,
      [tipo, categoria_id, descricao, valor, ratear_condominos, data_transacao, id]
    );

    // Se a transação antiga tinha ratear=true, deletar a despesa antiga
    if (transacaoAntiga.ratear_condominos && transacaoAntiga.tipo === 'debito') {
      await client.query(
        `DELETE FROM despesas_condominio
         WHERE mes = $1 AND ano = $2 AND descricao = $3`,
        [transacaoAntiga.mes, transacaoAntiga.ano, transacaoAntiga.descricao]
      );
    }

    // Se a nova transação tem ratear=true e é débito, criar/atualizar despesa
    if (tipo === 'debito' && ratear_condominos) {
      const valorPorApto = valor / 6;
      await client.query(
        `INSERT INTO despesas_condominio (mes, ano, categoria_id, descricao, valor, valor_por_apto)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mes, ano, categoria_id, descricao)
         DO UPDATE SET valor = $5, valor_por_apto = $6`,
        [transacaoAntiga.mes, transacaoAntiga.ano, categoria_id, descricao, valor, valorPorApto]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ erro: 'Erro ao atualizar transação' });
  } finally {
    client.release();
  }
};

// Excluir transação
export const excluirTransacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM banco_transacoes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Transação não encontrada' });
    }

    res.json({ mensagem: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    res.status(500).json({ erro: 'Erro ao excluir transação' });
  }
};

// Calcular saldo do período
export const calcularSaldo = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    // Buscar saldo inicial
    const saldoResult = await pool.query(
      'SELECT saldo_inicial FROM banco_saldo WHERE mes = $1 AND ano = $2',
      [mes, ano]
    );

    if (saldoResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Saldo inicial não definido para este período' });
    }

    const saldoInicial = parseFloat(saldoResult.rows[0].saldo_inicial);

    // Calcular total de créditos e débitos
    const transacoesResult = await pool.query(
      `SELECT
         SUM(CASE WHEN tipo = 'credito' THEN valor ELSE 0 END) as total_creditos,
         SUM(CASE WHEN tipo = 'debito' THEN valor ELSE 0 END) as total_debitos
       FROM banco_transacoes
       WHERE mes = $1 AND ano = $2`,
      [mes, ano]
    );

    const totalCreditos = parseFloat(transacoesResult.rows[0].total_creditos || 0);
    const totalDebitos = parseFloat(transacoesResult.rows[0].total_debitos || 0);
    const saldoFinal = saldoInicial + totalCreditos - totalDebitos;

    // Atualizar saldo final
    await pool.query(
      'UPDATE banco_saldo SET saldo_final = $1 WHERE mes = $2 AND ano = $3',
      [saldoFinal, mes, ano]
    );

    res.json({
      saldo_inicial: saldoInicial,
      total_creditos: totalCreditos,
      total_debitos: totalDebitos,
      saldo_final: saldoFinal
    });
  } catch (error) {
    console.error('Erro ao calcular saldo:', error);
    res.status(500).json({ erro: 'Erro ao calcular saldo' });
  }
};

// Conferir saldo com extrato
export const conferirSaldo = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;
    const { saldo_extrato } = req.body;

    if (saldo_extrato === undefined) {
      return res.status(400).json({ erro: 'Saldo do extrato é obrigatório' });
    }

    // Calcular saldo do sistema
    const saldoCalc = await pool.query(
      `SELECT
         bs.saldo_inicial,
         COALESCE(SUM(CASE WHEN bt.tipo = 'credito' THEN bt.valor ELSE 0 END), 0) as total_creditos,
         COALESCE(SUM(CASE WHEN bt.tipo = 'debito' THEN bt.valor ELSE 0 END), 0) as total_debitos
       FROM banco_saldo bs
       LEFT JOIN banco_transacoes bt ON bt.mes = bs.mes AND bt.ano = bs.ano
       WHERE bs.mes = $1 AND bs.ano = $2
       GROUP BY bs.saldo_inicial`,
      [mes, ano]
    );

    if (saldoCalc.rows.length === 0) {
      return res.status(404).json({ erro: 'Saldo não encontrado' });
    }

    const saldoInicial = parseFloat(saldoCalc.rows[0].saldo_inicial);
    const totalCreditos = parseFloat(saldoCalc.rows[0].total_creditos);
    const totalDebitos = parseFloat(saldoCalc.rows[0].total_debitos);
    const saldoSistema = saldoInicial + totalCreditos - totalDebitos;
    const diferenca = Math.abs(saldoSistema - parseFloat(saldo_extrato));
    const conferido = diferenca < 0.01; // Tolerância de 1 centavo

    // Atualizar registro
    await pool.query(
      `UPDATE banco_saldo
       SET saldo_final = $1, saldo_extrato = $2, conferido = $3
       WHERE mes = $4 AND ano = $5`,
      [saldoSistema, saldo_extrato, conferido, mes, ano]
    );

    res.json({
      saldo_sistema: saldoSistema.toFixed(2),
      saldo_extrato: parseFloat(saldo_extrato).toFixed(2),
      diferenca: diferenca.toFixed(2),
      conferido
    });
  } catch (error) {
    console.error('Erro ao conferir saldo:', error);
    res.status(500).json({ erro: 'Erro ao conferir saldo' });
  }
};

// Mudar mês de cobrança de uma transação
export const mudarMesCobranca = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { novo_mes, novo_ano } = req.body;

    if (!novo_mes || !novo_ano) {
      return res.status(400).json({ erro: 'Novo mês e ano são obrigatórios' });
    }

    await client.query('BEGIN');

    // Buscar transação atual
    const transacaoResult = await client.query(
      'SELECT * FROM banco_transacoes WHERE id = $1',
      [id]
    );

    if (transacaoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Transação não encontrada' });
    }

    const transacao = transacaoResult.rows[0];

    // Se a transação tem ratear=true e é débito, mover a despesa
    if (transacao.ratear_condominos && transacao.tipo === 'debito') {
      // Deletar despesa do mês antigo
      await client.query(
        `DELETE FROM despesas_condominio
         WHERE mes = $1 AND ano = $2 AND descricao = $3`,
        [transacao.mes, transacao.ano, transacao.descricao]
      );

      // Criar despesa no novo mês
      const valorPorApto = transacao.valor / 6;
      await client.query(
        `INSERT INTO despesas_condominio (mes, ano, categoria_id, descricao, valor, valor_por_apto)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mes, ano, categoria_id, descricao)
         DO UPDATE SET valor = $5, valor_por_apto = $6`,
        [novo_mes, novo_ano, transacao.categoria_id, transacao.descricao, transacao.valor, valorPorApto]
      );
    }

    // Atualizar o mês/ano da transação
    const result = await client.query(
      `UPDATE banco_transacoes
       SET mes = $1, ano = $2
       WHERE id = $3
       RETURNING *`,
      [novo_mes, novo_ano, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao mudar mês de cobrança:', error);
    res.status(500).json({ erro: 'Erro ao mudar mês de cobrança' });
  } finally {
    client.release();
  }
};
