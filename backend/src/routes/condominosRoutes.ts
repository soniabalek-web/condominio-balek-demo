import express from 'express';
import * as condominosController from '../controllers/condominosController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(verificarToken);

// Condôminos
router.get('/', condominosController.listarCondominos);
router.get('/:apartamento', condominosController.obterCondomino);
router.put('/:apartamento', verificarAdmin, condominosController.atualizarCondomino);

// Configurações
router.get('/config/todas', condominosController.obterConfiguracoes);
router.put('/config/atualizar', verificarAdmin, condominosController.atualizarConfiguracao);
router.post('/config/batch', verificarAdmin, condominosController.atualizarConfiguracoesBatch);
router.get('/config/fundo-reserva/:mes/:ano', condominosController.obterFundoReserva);

export default router;
