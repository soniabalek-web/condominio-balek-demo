import express from 'express';
import * as fornecedoresController from '../controllers/fornecedoresController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação de administrador
router.get('/tipos', verificarToken, verificarAdmin, fornecedoresController.listarTiposFornecedores);
router.get('/', verificarToken, verificarAdmin, fornecedoresController.listarFornecedores);
router.get('/:id', verificarToken, verificarAdmin, fornecedoresController.buscarFornecedor);
router.post('/', verificarToken, verificarAdmin, fornecedoresController.criarFornecedor);
router.put('/:id', verificarToken, verificarAdmin, fornecedoresController.atualizarFornecedor);
router.delete('/:id', verificarToken, verificarAdmin, fornecedoresController.excluirFornecedor);

export default router;
