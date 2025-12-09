import express from 'express';
import * as atasController from '../controllers/atasController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(verificarToken);

// Rotas de atas
router.get('/', atasController.listarAtas);
router.post('/upload', verificarAdmin, atasController.upload.single('arquivo'), atasController.uploadAta);
router.get('/download/:id', atasController.baixarAta);
router.delete('/:id', verificarAdmin, atasController.excluirAta);

export default router;
