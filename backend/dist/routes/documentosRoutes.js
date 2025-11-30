"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const documentosController = __importStar(require("../controllers/documentosController"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../utils/upload");
const router = express_1.default.Router();
// Todas as rotas requerem autenticação
router.use(auth_1.verificarToken);
// Upload (apenas admin)
router.post('/upload', auth_1.verificarAdmin, upload_1.upload.single('arquivo'), documentosController.uploadDocumento);
// Listagem
router.get('/:mes/:ano', documentosController.listarDocumentos);
router.get('/todos', documentosController.listarTodosDocumentos);
router.get('/detalhes/:id', documentosController.obterDocumento);
// Download (todos os usuários autenticados)
router.get('/download/:id', documentosController.downloadDocumento);
// Atualização e exclusão (apenas admin)
router.put('/:id', auth_1.verificarAdmin, documentosController.atualizarDocumento);
router.delete('/:id', auth_1.verificarAdmin, documentosController.excluirDocumento);
exports.default = router;
//# sourceMappingURL=documentosRoutes.js.map