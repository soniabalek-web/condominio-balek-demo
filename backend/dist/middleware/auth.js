"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarProprioUsuarioOuAdmin = exports.verificarAdmin = exports.verificarToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verificarToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ erro: 'Token não fornecido' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ erro: 'Token inválido' });
    }
};
exports.verificarToken = verificarToken;
const verificarAdmin = (req, res, next) => {
    if (req.usuario?.tipo !== 'administrador') {
        return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
    }
    next();
};
exports.verificarAdmin = verificarAdmin;
const verificarProprioUsuarioOuAdmin = (req, res, next) => {
    const apartamentoParam = req.params.apartamento;
    const isAdmin = req.usuario?.tipo === 'administrador';
    const isProprioApartamento = req.usuario?.apartamento === apartamentoParam;
    if (!isAdmin && !isProprioApartamento) {
        return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
};
exports.verificarProprioUsuarioOuAdmin = verificarProprioUsuarioOuAdmin;
//# sourceMappingURL=auth.js.map