"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterFundoReserva = exports.atualizarConfiguracoesBatch = exports.atualizarConfiguracao = exports.obterConfiguracoes = exports.atualizarCondomino = exports.obterCondomino = exports.listarCondominos = void 0;
const database_1 = __importDefault(require("../config/database"));
// Listar todos os condôminos
const listarCondominos = async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT * FROM condominos ORDER BY apartamento');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar condôminos:', error);
        res.status(500).json({ erro: 'Erro ao listar condôminos' });
    }
};
exports.listarCondominos = listarCondominos;
// Obter condômino por apartamento
const obterCondomino = async (req, res) => {
    try {
        const { apartamento } = req.params;
        const result = await database_1.default.query('SELECT * FROM condominos WHERE apartamento = $1', [apartamento]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Condômino não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao obter condômino:', error);
        res.status(500).json({ erro: 'Erro ao obter condômino' });
    }
};
exports.obterCondomino = obterCondomino;
// Atualizar condômino
const atualizarCondomino = async (req, res) => {
    try {
        const { apartamento } = req.params;
        const { nome_proprietario, nome_morador, telefone, email } = req.body;
        if (!nome_proprietario) {
            return res.status(400).json({ erro: 'Nome do proprietário é obrigatório' });
        }
        const result = await database_1.default.query(`UPDATE condominos
       SET nome_proprietario = $1, nome_morador = $2, telefone = $3, email = $4, atualizado_em = CURRENT_TIMESTAMP
       WHERE apartamento = $5
       RETURNING *`, [nome_proprietario, nome_morador || null, telefone || null, email || null, apartamento]);
        if (result.rows.length === 0) {
            // Se não existe, criar
            const insertResult = await database_1.default.query(`INSERT INTO condominos (apartamento, nome_proprietario, nome_morador, telefone, email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [apartamento, nome_proprietario, nome_morador || null, telefone || null, email || null]);
            return res.status(201).json(insertResult.rows[0]);
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar condômino:', error);
        res.status(500).json({ erro: 'Erro ao atualizar condômino' });
    }
};
exports.atualizarCondomino = atualizarCondomino;
// Obter configurações
const obterConfiguracoes = async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT * FROM configuracoes');
        // Converter para objeto chave-valor
        const config = {};
        result.rows.forEach(row => {
            config[row.chave] = row.valor;
        });
        res.json(config);
    }
    catch (error) {
        console.error('Erro ao obter configurações:', error);
        res.status(500).json({ erro: 'Erro ao obter configurações' });
    }
};
exports.obterConfiguracoes = obterConfiguracoes;
// Atualizar configuração
const atualizarConfiguracao = async (req, res) => {
    try {
        const { chave, valor } = req.body;
        if (!chave || valor === undefined) {
            return res.status(400).json({ erro: 'Chave e valor são obrigatórios' });
        }
        const result = await database_1.default.query(`INSERT INTO configuracoes (chave, valor)
       VALUES ($1, $2)
       ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = CURRENT_TIMESTAMP
       RETURNING *`, [chave, valor.toString()]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        res.status(500).json({ erro: 'Erro ao atualizar configuração' });
    }
};
exports.atualizarConfiguracao = atualizarConfiguracao;
// Atualizar múltiplas configurações de uma vez
const atualizarConfiguracoesBatch = async (req, res) => {
    try {
        const configuracoes = req.body;
        if (!Array.isArray(configuracoes)) {
            return res.status(400).json({ erro: 'Esperado um array de configurações' });
        }
        const client = await database_1.default.connect();
        try {
            await client.query('BEGIN');
            for (const config of configuracoes) {
                const { chave, valor } = config;
                if (!chave || valor === undefined) {
                    continue; // Pula configurações inválidas
                }
                await client.query(`INSERT INTO configuracoes (chave, valor)
           VALUES ($1, $2)
           ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = CURRENT_TIMESTAMP`, [chave, valor.toString()]);
            }
            await client.query('COMMIT');
            res.json({ sucesso: true, mensagem: 'Configurações atualizadas com sucesso' });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Erro ao atualizar configurações em lote:', error);
        res.status(500).json({ erro: 'Erro ao atualizar configurações' });
    }
};
exports.atualizarConfiguracoesBatch = atualizarConfiguracoesBatch;
// Obter valor do fundo de reserva calculado
const obterFundoReserva = async (req, res) => {
    try {
        const { mes, ano } = req.params;
        // Buscar configurações
        const configResult = await database_1.default.query("SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')");
        const config = {};
        configResult.rows.forEach(row => {
            config[row.chave] = row.valor;
        });
        const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
        const percentual = parseFloat(config.fundo_reserva_percentual || '10');
        // Se valor fixo > 0, usar valor fixo
        if (valorFixo > 0) {
            return res.json({
                tipo: 'fixo',
                valor: valorFixo,
                valor_por_apto: valorFixo
            });
        }
        // Senão, calcular com base no percentual sobre o condomínio
        const despesasResult = await database_1.default.query(`SELECT SUM(valor) as total FROM despesas_condominio WHERE mes = $1 AND ano = $2`, [mes, ano]);
        const totalDespesas = parseFloat(despesasResult.rows[0]?.total || 0);
        const valorCondominioPorApto = totalDespesas / 6;
        const fundoReservaPorApto = valorCondominioPorApto * (percentual / 100);
        res.json({
            tipo: 'percentual',
            percentual,
            valor_base: valorCondominioPorApto,
            valor_por_apto: fundoReservaPorApto
        });
    }
    catch (error) {
        console.error('Erro ao calcular fundo de reserva:', error);
        res.status(500).json({ erro: 'Erro ao calcular fundo de reserva' });
    }
};
exports.obterFundoReserva = obterFundoReserva;
//# sourceMappingURL=condominosController.js.map