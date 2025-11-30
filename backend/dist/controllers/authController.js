"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarToken = exports.removerEmailPermitido = exports.listarEmailsPermitidos = exports.adicionarEmailPermitido = exports.registrarMorador = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }
        const result = await database_1.default.query('SELECT * FROM usuarios WHERE email = $1 AND ativo = true', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        const usuario = result.rows[0];
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        // Verificar se o email está autorizado (exceto para admin/administrador)
        if (usuario.tipo !== 'admin' && usuario.tipo !== 'administrador') {
            const emailPermitido = await database_1.default.query('SELECT * FROM emails_permitidos WHERE email = $1', [email]);
            if (emailPermitido.rows.length === 0) {
                return res.status(403).json({ erro: 'Email não autorizado para acesso ao sistema' });
            }
        }
        const payload = {
            id: usuario.id,
            email: usuario.email,
            tipo: usuario.tipo,
            apartamento: usuario.apartamento
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                tipo: usuario.tipo,
                apartamento: usuario.apartamento
            }
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};
exports.login = login;
const registrarMorador = async (req, res) => {
    try {
        const { email, senha, nome } = req.body;
        if (!email || !senha || !nome) {
            return res.status(400).json({ erro: 'Email, senha e nome são obrigatórios' });
        }
        // Verificar se o email está na lista de permitidos
        const emailPermitido = await database_1.default.query('SELECT * FROM emails_permitidos WHERE email = $1 AND usado = false', [email]);
        if (emailPermitido.rows.length === 0) {
            return res.status(403).json({ erro: 'Email não autorizado para registro' });
        }
        const apartamento = emailPermitido.rows[0].apartamento;
        // Verificar se já existe usuário com esse email
        const usuarioExiste = await database_1.default.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        const senhaHash = await bcryptjs_1.default.hash(senha, 10);
        const result = await database_1.default.query(`INSERT INTO usuarios (email, senha, nome, tipo, apartamento)
       VALUES ($1, $2, $3, 'morador', $4)
       RETURNING id, email, nome, tipo, apartamento`, [email, senhaHash, nome, apartamento]);
        // Marcar email como usado
        await database_1.default.query('UPDATE emails_permitidos SET usado = true WHERE email = $1', [email]);
        const usuario = result.rows[0];
        const payload = {
            id: usuario.id,
            email: usuario.email,
            tipo: usuario.tipo,
            apartamento: usuario.apartamento
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            usuario
        });
    }
    catch (error) {
        console.error('Erro ao registrar morador:', error);
        res.status(500).json({ erro: 'Erro ao registrar morador' });
    }
};
exports.registrarMorador = registrarMorador;
const adicionarEmailPermitido = async (req, res) => {
    try {
        const { email, apartamento } = req.body;
        if (!email || !apartamento) {
            return res.status(400).json({ erro: 'Email e apartamento são obrigatórios' });
        }
        // Validar número do apartamento (01 a 06)
        const aptoNum = parseInt(apartamento);
        if (aptoNum < 1 || aptoNum > 6) {
            return res.status(400).json({ erro: 'Apartamento deve ser entre 01 e 06' });
        }
        const aptoFormatado = apartamento.padStart(2, '0');
        const result = await database_1.default.query(`INSERT INTO emails_permitidos (email, apartamento)
       VALUES ($1, $2)
       RETURNING *`, [email, aptoFormatado]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        console.error('Erro ao adicionar email permitido:', error);
        res.status(500).json({ erro: 'Erro ao adicionar email permitido' });
    }
};
exports.adicionarEmailPermitido = adicionarEmailPermitido;
const listarEmailsPermitidos = async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT * FROM emails_permitidos ORDER BY apartamento, criado_em DESC');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar emails permitidos:', error);
        res.status(500).json({ erro: 'Erro ao listar emails permitidos' });
    }
};
exports.listarEmailsPermitidos = listarEmailsPermitidos;
const removerEmailPermitido = async (req, res) => {
    try {
        const { id } = req.params;
        // Buscar o email antes de excluir
        const emailResult = await database_1.default.query('SELECT email FROM emails_permitidos WHERE id = $1', [id]);
        if (emailResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Email não encontrado' });
        }
        const email = emailResult.rows[0].email;
        // Excluir o usuário associado (se existir)
        await database_1.default.query('DELETE FROM usuarios WHERE email = $1 AND tipo = $2', [email, 'morador']);
        // Excluir o email permitido
        await database_1.default.query('DELETE FROM emails_permitidos WHERE id = $1', [id]);
        res.json({ mensagem: 'Email e usuário removidos com sucesso' });
    }
    catch (error) {
        console.error('Erro ao remover email permitido:', error);
        res.status(500).json({ erro: 'Erro ao remover email permitido' });
    }
};
exports.removerEmailPermitido = removerEmailPermitido;
const verificarToken = (req, res) => {
    res.json({ valido: true, usuario: req.usuario });
};
exports.verificarToken = verificarToken;
//# sourceMappingURL=authController.js.map