import express from 'express';
import * as despesasController from '../controllers/despesasController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(verificarToken);

// Categorias de despesas
router.get('/categorias', despesasController.listarCategorias);
router.post('/categorias', verificarAdmin, despesasController.criarCategoria);
router.put('/categorias/:id', verificarAdmin, despesasController.atualizarCategoria);
router.delete('/categorias/:id', verificarAdmin, despesasController.desativarCategoria);

// Despesas do condomínio
router.get('/condominio/:mes/:ano', despesasController.listarDespesasCondominio);
router.post('/condominio', verificarAdmin, despesasController.salvarDespesaCondominio);
router.put('/condominio/:id', verificarAdmin, despesasController.atualizarDespesaCondominio);
router.delete('/condominio/:id', verificarAdmin, despesasController.excluirDespesaCondominio);

// Despesas parceladas
router.get('/parceladas', despesasController.listarDespesasParceladas);
router.post('/parceladas', verificarAdmin, despesasController.criarDespesaParcelada);
router.put('/parceladas/parcelas/:id', verificarAdmin, despesasController.atualizarStatusParcela);

// Resumo mensal
router.get('/resumo/:mes/:ano', despesasController.obterResumoMensal);

export default router;
