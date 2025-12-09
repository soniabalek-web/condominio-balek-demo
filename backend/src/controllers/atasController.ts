import { Request, Response } from 'express';
import pool from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar multer para upload de atas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/atas');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ata-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, DOC e DOCX são permitidos'));
    }
  }
});

// Listar todas as atas
export const listarAtas = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, data_reuniao, titulo, nome_arquivo, tamanho, criado_em
       FROM atas_reuniao
       ORDER BY data_reuniao DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar atas:', error);
    res.status(500).json({ erro: 'Erro ao listar atas' });
  }
};

// Fazer upload de ata
export const uploadAta = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    const { data_reuniao, titulo } = req.body;
    const usuario = (req as any).usuario;

    if (!data_reuniao) {
      // Remover arquivo se data não fornecida
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ erro: 'Data da reunião é obrigatória' });
    }

    const result = await pool.query(
      `INSERT INTO atas_reuniao (data_reuniao, titulo, nome_arquivo, caminho_arquivo, tamanho, mime_type, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (data_reuniao) DO UPDATE
       SET titulo = $2, nome_arquivo = $3, caminho_arquivo = $4, tamanho = $5, mime_type = $6, criado_por = $7
       RETURNING *`,
      [
        data_reuniao,
        titulo || `Ata de ${data_reuniao}`,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        usuario.id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao fazer upload de ata:', error);
    // Remover arquivo em caso de erro
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ erro: 'Erro ao fazer upload de ata' });
  }
};

// Baixar ata
export const baixarAta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM atas_reuniao WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Ata não encontrada' });
    }

    const ata = result.rows[0];

    if (!fs.existsSync(ata.caminho_arquivo)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado no servidor' });
    }

    res.download(ata.caminho_arquivo, ata.nome_arquivo);
  } catch (error) {
    console.error('Erro ao baixar ata:', error);
    res.status(500).json({ erro: 'Erro ao baixar ata' });
  }
};

// Excluir ata
export const excluirAta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM atas_reuniao WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Ata não encontrada' });
    }

    const ata = result.rows[0];

    // Remover arquivo físico
    if (fs.existsSync(ata.caminho_arquivo)) {
      fs.unlinkSync(ata.caminho_arquivo);
    }

    res.json({ sucesso: true, mensagem: 'Ata excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ata:', error);
    res.status(500).json({ erro: 'Erro ao excluir ata' });
  }
};
