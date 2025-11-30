import express from 'express';
import * as documentosController from '../controllers/documentosController';
import { verificarToken, verificarAdmin } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(verificarToken);

// Upload (apenas admin)
router.post('/upload', verificarAdmin, upload.single('arquivo'), documentosController.uploadDocumento);

// Listagem
router.get('/:mes/:ano', documentosController.listarDocumentos);
router.get('/todos', documentosController.listarTodosDocumentos);
router.get('/detalhes/:id', documentosController.obterDocumento);

// Download (todos os usuários autenticados)
router.get('/download/:id', documentosController.downloadDocumento);

// Atualização e exclusão (apenas admin)
router.put('/:id', verificarAdmin, documentosController.atualizarDocumento);
router.delete('/:id', verificarAdmin, documentosController.excluirDocumento);

export default router;
