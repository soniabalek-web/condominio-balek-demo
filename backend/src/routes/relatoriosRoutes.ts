import express from 'express';
import * as relatoriosController from '../controllers/relatoriosController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação de administrador
router.use(verificarToken, verificarAdmin);

router.get('/extrato-bancario/:mes/:ano', relatoriosController.gerarExtratoBank);
router.get('/despesas/:mes/:ano', relatoriosController.gerarRelatorioDespesas);
router.get('/gas-12meses', relatoriosController.gerarRelatorioGas);
router.get('/despesas-parceladas', relatoriosController.gerarRelatorioDespesasParceladas);
router.get('/devedores', relatoriosController.gerarRelatorioDevedores);
router.get('/sindico/:mes/:ano', relatoriosController.gerarRelatorioSindico);
router.get('/kondor/:mes/:ano', relatoriosController.gerarRelatorioKondor);
router.get('/historico-apartamentos', relatoriosController.gerarRelatorioHistoricoApartamento);

export default router;
