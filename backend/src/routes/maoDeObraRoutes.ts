import express from 'express';
import * as maoDeObraController from '../controllers/maoDeObraController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação de administrador
router.get('/tipos', verificarToken, verificarAdmin, maoDeObraController.listarTiposMaoDeObra);
router.get('/', verificarToken, verificarAdmin, maoDeObraController.listarMaoDeObra);
router.get('/:id', verificarToken, verificarAdmin, maoDeObraController.buscarMaoDeObra);
router.post('/', verificarToken, verificarAdmin, maoDeObraController.criarMaoDeObra);
router.put('/:id', verificarToken, verificarAdmin, maoDeObraController.atualizarMaoDeObra);
router.delete('/:id', verificarToken, verificarAdmin, maoDeObraController.excluirMaoDeObra);

export default router;
