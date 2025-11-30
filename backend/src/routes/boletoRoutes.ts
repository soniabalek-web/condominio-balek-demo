import express from 'express';
import * as boletoController from '../controllers/boletoController';
import { verificarToken } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(verificarToken);

// Gerar boleto PDF para um apartamento específico
router.get('/pdf/:mes/:ano/:apartamento', boletoController.gerarBoletoPDF);

// TESTE TEMPORÁRIO - Boleto com R$ 0,10 para testar QR Code
router.get('/teste-qrcode', boletoController.gerarBoletoTeste);

// Obter resumo de todos os apartamentos
router.get('/resumo/:mes/:ano', boletoController.gerarTodosBoletos);

export default router;
