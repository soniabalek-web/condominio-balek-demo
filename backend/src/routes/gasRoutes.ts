import express from 'express';
import * as gasController from '../controllers/gasController';
import { verificarToken, verificarAdmin, verificarProprioUsuarioOuAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(verificarToken);

// Leituras
router.post('/leituras', verificarAdmin, gasController.registrarLeitura);
router.post('/leituras/lote', verificarAdmin, gasController.registrarLeiturasLote);
router.get('/leituras/:mes/:ano', gasController.listarLeituras);
router.get('/leituras/:apartamento/:mes/:ano', verificarProprioUsuarioOuAdmin, gasController.obterLeituraApartamento);
router.delete('/leituras/:id', verificarAdmin, gasController.excluirLeitura);

// Histórico e relatórios
router.get('/historico/:apartamento', verificarProprioUsuarioOuAdmin, gasController.obterHistoricoApartamento);
router.get('/relatorio', verificarAdmin, gasController.obterRelatorioGeral);

export default router;
