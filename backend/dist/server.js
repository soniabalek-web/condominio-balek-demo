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
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importStar(require("./config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Importar rotas
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const despesasRoutes_1 = __importDefault(require("./routes/despesasRoutes"));
const bancoRoutes_1 = __importDefault(require("./routes/bancoRoutes"));
const gasRoutes_1 = __importDefault(require("./routes/gasRoutes"));
const documentosRoutes_1 = __importDefault(require("./routes/documentosRoutes"));
const relatoriosRoutes_1 = __importDefault(require("./routes/relatoriosRoutes"));
const boletoRoutes_1 = __importDefault(require("./routes/boletoRoutes"));
const condominosRoutes_1 = __importDefault(require("./routes/condominosRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rotas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/despesas', despesasRoutes_1.default);
app.use('/api/banco', bancoRoutes_1.default);
app.use('/api/gas', gasRoutes_1.default);
app.use('/api/documentos', documentosRoutes_1.default);
app.use('/api/relatorios', relatoriosRoutes_1.default);
app.use('/api/boletos', boletoRoutes_1.default);
app.use('/api/condominos', condominosRoutes_1.default);
// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor rodando' });
});
// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(err.status || 500).json({
        erro: err.message || 'Erro interno do servidor'
    });
});
// Função para criar usuário administrador padrão
const criarAdminPadrao = async () => {
    try {
        // Verificar se já existe um administrador
        const result = await database_1.default.query("SELECT id FROM usuarios WHERE tipo = 'administrador' LIMIT 1");
        if (result.rows.length === 0) {
            const senhaHash = await bcryptjs_1.default.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025', 10);
            await database_1.default.query(`INSERT INTO usuarios (email, senha, nome, tipo)
         VALUES ($1, $2, $3, 'administrador')`, ['admin@residencialbalek.com', senhaHash, 'Administrador']);
            console.log('✓ Administrador padrão criado');
            console.log('  Email: admin@residencialbalek.com');
            console.log('  Senha:', process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025');
        }
    }
    catch (error) {
        console.error('Erro ao criar administrador padrão:', error);
    }
};
// Inicialização
const iniciar = async () => {
    try {
        // Testar conexão com banco
        await database_1.default.query('SELECT NOW()');
        console.log('✓ Conectado ao banco de dados PostgreSQL');
        // Criar tabelas
        await (0, database_1.createTables)();
        console.log('✓ Tabelas do banco de dados verificadas');
        // Criar admin padrão
        await criarAdminPadrao();
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
            console.log(`   API: http://localhost:${PORT}/api`);
            console.log(`   Health: http://localhost:${PORT}/api/health\n`);
        });
    }
    catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};
iniciar();
// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
    console.log('\nEncerrando servidor...');
    await database_1.default.end();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\nEncerrando servidor...');
    await database_1.default.end();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=server.js.map