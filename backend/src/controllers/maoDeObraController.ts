import { Request, Response } from 'express';
import pool from '../config/database';

// Tipos de mão de obra permitidos
export const TIPOS_MAO_DE_OBRA = [
  'Informática',
  'Jardinagem',
  'Construção',
  'Pedreiros',
  'Eletricistas',
  'Encanador',
  'Pintor',
  'Faz Tudo',
  'Manutenção em Geral',
  'Outros'
];

// Listar todos os profissionais
export const listarMaoDeObra = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mao_de_obra WHERE ativo = true ORDER BY tipo, nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar mão de obra:', error);
    res.status(500).json({ erro: 'Erro ao listar mão de obra' });
  }
};

// Buscar profissional por ID
export const buscarMaoDeObra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM mao_de_obra WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Profissional não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar mão de obra:', error);
    res.status(500).json({ erro: 'Erro ao buscar mão de obra' });
  }
};

// Criar novo profissional
export const criarMaoDeObra = async (req: Request, res: Response) => {
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
      `INSERT INTO mao_de_obra (tipo, nome, endereco, contato, telefone, email, pessoa_contato, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tipo, nome, endereco, contato, telefone, email, pessoa_contato, observacoes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar mão de obra:', error);
    res.status(500).json({ erro: 'Erro ao criar mão de obra' });
  }
};

// Atualizar profissional
export const atualizarMaoDeObra = async (req: Request, res: Response) => {
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
      `UPDATE mao_de_obra
       SET tipo = $1, nome = $2, endereco = $3, contato = $4, telefone = $5,
           email = $6, pessoa_contato = $7, observacoes = $8, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [tipo, nome, endereco, contato, telefone, email, pessoa_contato, observacoes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Profissional não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar mão de obra:', error);
    res.status(500).json({ erro: 'Erro ao atualizar mão de obra' });
  }
};

// Excluir profissional (soft delete)
export const excluirMaoDeObra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE mao_de_obra SET ativo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Profissional não encontrado' });
    }

    res.json({ mensagem: 'Profissional excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mão de obra:', error);
    res.status(500).json({ erro: 'Erro ao excluir mão de obra' });
  }
};

// Listar tipos de mão de obra
export const listarTiposMaoDeObra = async (req: Request, res: Response) => {
  res.json(TIPOS_MAO_DE_OBRA);
};
