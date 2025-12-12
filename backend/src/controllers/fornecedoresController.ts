import { Request, Response } from 'express';
import pool from '../config/database';

// Tipos de fornecedores permitidos
export const TIPOS_FORNECEDORES = [
  'Loja de Material de Construção',
  'Loja de Jardinagem',
  'Loja de Material de Limpeza',
  'Escritório',
  'Manutenção em Geral',
  'Supermercados',
  'Gás',
  'Outros'
];

// Listar todos os fornecedores
export const listarFornecedores = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fornecedores WHERE ativo = true ORDER BY tipo, nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
};

// Buscar fornecedor por ID
export const buscarFornecedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM fornecedores WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ erro: 'Erro ao buscar fornecedor' });
  }
};

// Criar novo fornecedor
export const criarFornecedor = async (req: Request, res: Response) => {
  try {
    const {
      tipo,
      nome,
      endereco,
      contato,
      telefone,
      email,
      pessoa_contato,
      observacoes
    } = req.body;

    if (!tipo || !nome) {
      return res.status(400).json({ erro: 'Tipo e nome são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO fornecedores (tipo, nome, endereco, contato, telefone, email, pessoa_contato, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tipo, nome, endereco, contato, telefone, email, pessoa_contato, observacoes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ erro: 'Erro ao criar fornecedor' });
  }
};

// Atualizar fornecedor
export const atualizarFornecedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      nome,
      endereco,
      contato,
      telefone,
      email,
      pessoa_contato,
      observacoes
    } = req.body;

    const result = await pool.query(
      `UPDATE fornecedores
       SET tipo = $1, nome = $2, endereco = $3, contato = $4, telefone = $5,
           email = $6, pessoa_contato = $7, observacoes = $8, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [tipo, nome, endereco, contato, telefone, email, pessoa_contato, observacoes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ erro: 'Erro ao atualizar fornecedor' });
  }
};

// Excluir fornecedor (soft delete)
export const excluirFornecedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE fornecedores SET ativo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    res.json({ mensagem: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({ erro: 'Erro ao excluir fornecedor' });
  }
};

// Listar tipos de fornecedores
export const listarTiposFornecedores = async (req: Request, res: Response) => {
  res.json(TIPOS_FORNECEDORES);
};
