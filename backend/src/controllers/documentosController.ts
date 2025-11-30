import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';

// Upload de documento
export const uploadDocumento = async (req: Request, res: Response) => {
  try {
    const { mes, ano, tipo, descricao } = req.body;
    const usuario_id = req.usuario?.id;

    if (!mes || !ano || !tipo) {
      return res.status(400).json({ erro: 'Mês, ano e tipo são obrigatórios' });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo foi enviado' });
    }

    const result = await pool.query(
      `INSERT INTO documentos (mes, ano, tipo, nome_arquivo, caminho_arquivo, tamanho, mime_type, descricao, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        mes,
        ano,
        tipo,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        descricao,
        usuario_id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ erro: 'Erro ao fazer upload do documento' });
  }
};

// Listar documentos por período
export const listarDocumentos = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    const result = await pool.query(
      `SELECT d.*, u.nome as criado_por_nome
       FROM documentos d
       LEFT JOIN usuarios u ON d.criado_por = u.id
       WHERE d.mes = $1 AND d.ano = $2
       ORDER BY d.criado_em DESC`,
      [mes, ano]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ erro: 'Erro ao listar documentos' });
  }
};

// Listar todos os documentos (com filtros opcionais)
export const listarTodosDocumentos = async (req: Request, res: Response) => {
  try {
    const { tipo, limite } = req.query;

    let query = `
      SELECT d.*, u.nome as criado_por_nome
      FROM documentos d
      LEFT JOIN usuarios u ON d.criado_por = u.id
    `;

    const params: any[] = [];

    if (tipo) {
      query += ' WHERE d.tipo = $1';
      params.push(tipo);
    }

    query += ' ORDER BY d.ano DESC, d.mes DESC, d.criado_em DESC';

    if (limite) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limite as string));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ erro: 'Erro ao listar documentos' });
  }
};

// Obter um documento específico
export const obterDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.*, u.nome as criado_por_nome
       FROM documentos d
       LEFT JOIN usuarios u ON d.criado_por = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter documento:', error);
    res.status(500).json({ erro: 'Erro ao obter documento' });
  }
};

// Download de documento
export const downloadDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM documentos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }

    const documento = result.rows[0];
    const caminhoArquivo = path.resolve(documento.caminho_arquivo);

    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado no servidor' });
    }

    res.download(caminhoArquivo, documento.nome_arquivo);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({ erro: 'Erro ao fazer download do documento' });
  }
};

// Excluir documento
export const excluirDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM documentos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }

    const documento = result.rows[0];

    // Tentar excluir o arquivo físico
    try {
      const caminhoArquivo = path.resolve(documento.caminho_arquivo);
      if (fs.existsSync(caminhoArquivo)) {
        fs.unlinkSync(caminhoArquivo);
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo físico:', error);
    }

    res.json({ mensagem: 'Documento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ erro: 'Erro ao excluir documento' });
  }
};

// Atualizar descrição do documento
export const atualizarDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { descricao, tipo } = req.body;

    const result = await pool.query(
      'UPDATE documentos SET descricao = $1, tipo = $2 WHERE id = $3 RETURNING *',
      [descricao, tipo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ erro: 'Erro ao atualizar documento' });
  }
};
