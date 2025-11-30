"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarDocumento = exports.excluirDocumento = exports.downloadDocumento = exports.obterDocumento = exports.listarTodosDocumentos = exports.listarDocumentos = exports.uploadDocumento = void 0;
const database_1 = __importDefault(require("../config/database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Upload de documento
const uploadDocumento = async (req, res) => {
    try {
        const { mes, ano, tipo, descricao } = req.body;
        const usuario_id = req.usuario?.id;
        if (!mes || !ano || !tipo) {
            return res.status(400).json({ erro: 'Mês, ano e tipo são obrigatórios' });
        }
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo foi enviado' });
        }
        const result = await database_1.default.query(`INSERT INTO documentos (mes, ano, tipo, nome_arquivo, caminho_arquivo, tamanho, mime_type, descricao, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            mes,
            ano,
            tipo,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            descricao,
            usuario_id
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao fazer upload:', error);
        res.status(500).json({ erro: 'Erro ao fazer upload do documento' });
    }
};
exports.uploadDocumento = uploadDocumento;
// Listar documentos por período
const listarDocumentos = async (req, res) => {
    try {
        const { mes, ano } = req.params;
        const result = await database_1.default.query(`SELECT d.*, u.nome as criado_por_nome
       FROM documentos d
       LEFT JOIN usuarios u ON d.criado_por = u.id
       WHERE d.mes = $1 AND d.ano = $2
       ORDER BY d.criado_em DESC`, [mes, ano]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar documentos:', error);
        res.status(500).json({ erro: 'Erro ao listar documentos' });
    }
};
exports.listarDocumentos = listarDocumentos;
// Listar todos os documentos (com filtros opcionais)
const listarTodosDocumentos = async (req, res) => {
    try {
        const { tipo, limite } = req.query;
        let query = `
      SELECT d.*, u.nome as criado_por_nome
      FROM documentos d
      LEFT JOIN usuarios u ON d.criado_por = u.id
    `;
        const params = [];
        if (tipo) {
            query += ' WHERE d.tipo = $1';
            params.push(tipo);
        }
        query += ' ORDER BY d.ano DESC, d.mes DESC, d.criado_em DESC';
        if (limite) {
            query += ` LIMIT $${params.length + 1}`;
            params.push(parseInt(limite));
        }
        const result = await database_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar documentos:', error);
        res.status(500).json({ erro: 'Erro ao listar documentos' });
    }
};
exports.listarTodosDocumentos = listarTodosDocumentos;
// Obter um documento específico
const obterDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query(`SELECT d.*, u.nome as criado_por_nome
       FROM documentos d
       LEFT JOIN usuarios u ON d.criado_por = u.id
       WHERE d.id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Documento não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao obter documento:', error);
        res.status(500).json({ erro: 'Erro ao obter documento' });
    }
};
exports.obterDocumento = obterDocumento;
// Download de documento
const downloadDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('SELECT * FROM documentos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Documento não encontrado' });
        }
        const documento = result.rows[0];
        const caminhoArquivo = path_1.default.resolve(documento.caminho_arquivo);
        if (!fs_1.default.existsSync(caminhoArquivo)) {
            return res.status(404).json({ erro: 'Arquivo não encontrado no servidor' });
        }
        res.download(caminhoArquivo, documento.nome_arquivo);
    }
    catch (error) {
        console.error('Erro ao fazer download:', error);
        res.status(500).json({ erro: 'Erro ao fazer download do documento' });
    }
};
exports.downloadDocumento = downloadDocumento;
// Excluir documento
const excluirDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('DELETE FROM documentos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Documento não encontrado' });
        }
        const documento = result.rows[0];
        // Tentar excluir o arquivo físico
        try {
            const caminhoArquivo = path_1.default.resolve(documento.caminho_arquivo);
            if (fs_1.default.existsSync(caminhoArquivo)) {
                fs_1.default.unlinkSync(caminhoArquivo);
            }
        }
        catch (error) {
            console.error('Erro ao excluir arquivo físico:', error);
        }
        res.json({ mensagem: 'Documento excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir documento:', error);
        res.status(500).json({ erro: 'Erro ao excluir documento' });
    }
};
exports.excluirDocumento = excluirDocumento;
// Atualizar descrição do documento
const atualizarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, tipo } = req.body;
        const result = await database_1.default.query('UPDATE documentos SET descricao = $1, tipo = $2 WHERE id = $3 RETURNING *', [descricao, tipo, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Documento não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar documento:', error);
        res.status(500).json({ erro: 'Erro ao atualizar documento' });
    }
};
exports.atualizarDocumento = atualizarDocumento;
//# sourceMappingURL=documentosController.js.map