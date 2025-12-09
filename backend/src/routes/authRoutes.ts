import express from 'express';
import * as authController from '../controllers/authController';
import { verificarToken, verificarAdmin } from '../middleware/auth';

const router = express.Router();

// Rotas públicas
router.post('/login', authController.login);
router.post('/registrar', authController.registrarMorador);

// Rotas protegidas
router.get('/verificar', verificarToken, authController.verificarToken);

// Rotas apenas para administradores
router.post('/emails-permitidos', verificarToken, verificarAdmin, authController.adicionarEmailPermitido);
router.get('/emails-permitidos', verificarToken, verificarAdmin, authController.listarEmailsPermitidos);
router.delete('/emails-permitidos/:id', verificarToken, verificarAdmin, authController.removerEmailPermitido);

// Rotas de backup e restauração
router.post('/backup', verificarToken, verificarAdmin, authController.gerarBackup);
router.get('/backups', verificarToken, verificarAdmin, authController.listarBackups);
router.post('/restaurar', verificarToken, verificarAdmin, authController.restaurarBackup);

export default router;
