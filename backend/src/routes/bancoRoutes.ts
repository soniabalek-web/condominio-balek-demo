import express from 'express';
import * as bancoController from '../controllers/bancoController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação de administrador
router.use(verificarToken, verificarAdmin);

// Saldo mensal
router.post('/saldo', bancoController.salvarSaldoMensal);
router.get('/saldo/:mes/:ano', bancoController.obterSaldoMensal);

// Transações
router.post('/transacoes', bancoController.criarTransacao);
router.get('/transacoes/:mes/:ano', bancoController.listarTransacoes);
router.put('/transacoes/:id', bancoController.atualizarTransacao);
router.delete('/transacoes/:id', bancoController.excluirTransacao);
router.put('/transacoes/:id/mudar-mes', bancoController.mudarMesCobranca);

// Cálculo e conferência
router.get('/calcular-saldo/:mes/:ano', bancoController.calcularSaldo);
router.post('/conferir-saldo/:mes/:ano', bancoController.conferirSaldo);

export default router;
