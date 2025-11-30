"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excluirLeitura = exports.obterRelatorioGeral = exports.obterHistoricoApartamento = exports.obterLeituraApartamento = exports.listarLeituras = exports.registrarLeiturasLote = exports.registrarLeitura = void 0;
const database_1 = __importDefault(require("../config/database"));
// Registrar leitura de gás
const registrarLeitura = async (req, res) => {
    try {
        const { apartamento, mes, ano, leitura_atual, valor_m3 } = req.body;
        if (!apartamento || !mes || !ano || leitura_atual === undefined || valor_m3 === undefined) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }
        // Validar apartamento
        const aptoNum = parseInt(apartamento);
        if (aptoNum < 1 || aptoNum > 6) {
            return res.status(400).json({ erro: 'Apartamento deve ser entre 01 e 06' });
        }
        const aptoFormatado = apartamento.toString().padStart(2, '0');
        // Buscar leitura anterior
        let mesAnterior = mes - 1;
        let anoAnterior = ano;
        if (mesAnterior < 1) {
            mesAnterior = 12;
            anoAnterior = ano - 1;
        }
        const leituraAnteriorResult = await database_1.default.query('SELECT leitura_atual FROM leituras_gas WHERE apartamento = $1 AND mes = $2 AND ano = $3', [aptoFormatado, mesAnterior, anoAnterior]);
        let leitura_anterior = null;
        let consumo = null;
        let valor_total = null;
        if (leituraAnteriorResult.rows.length > 0) {
            leitura_anterior = parseFloat(leituraAnteriorResult.rows[0].leitura_atual);
            consumo = parseFloat(leitura_atual) - leitura_anterior;
            valor_total = consumo * parseFloat(valor_m3);
        }
        const result = await database_1.default.query(`INSERT INTO leituras_gas (apartamento, mes, ano, leitura_atual, leitura_anterior, consumo, valor_m3, valor_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (apartamento, mes, ano)
       DO UPDATE SET leitura_atual = $4, leitura_anterior = $5, consumo = $6, valor_m3 = $7, valor_total = $8
       RETURNING *`, [aptoFormatado, mes, ano, leitura_atual, leitura_anterior, consumo, valor_m3, valor_total]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao registrar leitura:', error);
        res.status(500).json({ erro: 'Erro ao registrar leitura' });
    }
};
exports.registrarLeitura = registrarLeitura;
// Registrar múltiplas leituras de uma vez
const registrarLeiturasLote = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { mes, ano, valor_m3, leituras } = req.body;
        if (!mes || !ano || valor_m3 === undefined || !leituras || !Array.isArray(leituras)) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }
        await client.query('BEGIN');
        const resultados = [];
        for (const leitura of leituras) {
            const { apartamento, leitura_atual, leitura_anterior: leituraAnteriorFornecida } = leitura;
            if (!apartamento || leitura_atual === undefined) {
                continue;
            }
            const aptoFormatado = apartamento.toString().padStart(2, '0');
            let leitura_anterior = null;
            let consumo = null;
            let valor_total = null;
            // Se leitura_anterior foi fornecida pelo usuário, usa ela
            if (leituraAnteriorFornecida !== undefined && leituraAnteriorFornecida !== null && leituraAnteriorFornecida !== '') {
                leitura_anterior = parseFloat(leituraAnteriorFornecida);
                consumo = parseFloat(leitura_atual) - leitura_anterior;
                valor_total = consumo * parseFloat(valor_m3);
            }
            else {
                // Caso contrário, busca automaticamente do mês anterior
                let mesAnterior = mes - 1;
                let anoAnterior = ano;
                if (mesAnterior < 1) {
                    mesAnterior = 12;
                    anoAnterior = ano - 1;
                }
                const leituraAnteriorResult = await client.query('SELECT leitura_atual FROM leituras_gas WHERE apartamento = $1 AND mes = $2 AND ano = $3', [aptoFormatado, mesAnterior, anoAnterior]);
                if (leituraAnteriorResult.rows.length > 0) {
                    leitura_anterior = parseFloat(leituraAnteriorResult.rows[0].leitura_atual);
                    consumo = parseFloat(leitura_atual) - leitura_anterior;
                    valor_total = consumo * parseFloat(valor_m3);
                }
            }
            const result = await client.query(`INSERT INTO leituras_gas (apartamento, mes, ano, leitura_atual, leitura_anterior, consumo, valor_m3, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (apartamento, mes, ano)
         DO UPDATE SET leitura_atual = $4, leitura_anterior = $5, consumo = $6, valor_m3 = $7, valor_total = $8
         RETURNING *`, [aptoFormatado, mes, ano, leitura_atual, leitura_anterior, consumo, valor_m3, valor_total]);
            resultados.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json(resultados);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao registrar leituras em lote:', error);
        res.status(500).json({ erro: 'Erro ao registrar leituras em lote' });
    }
    finally {
        client.release();
    }
};
exports.registrarLeiturasLote = registrarLeiturasLote;
// Listar leituras por período
const listarLeituras = async (req, res) => {
    try {
        const { mes, ano } = req.params;
        const result = await database_1.default.query(`SELECT * FROM leituras_gas
       WHERE mes = $1 AND ano = $2
       ORDER BY apartamento`, [mes, ano]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar leituras:', error);
        res.status(500).json({ erro: 'Erro ao listar leituras' });
    }
};
exports.listarLeituras = listarLeituras;
// Obter leitura de um apartamento específico
const obterLeituraApartamento = async (req, res) => {
    try {
        const { apartamento, mes, ano } = req.params;
        const aptoFormatado = apartamento.toString().padStart(2, '0');
        const result = await database_1.default.query('SELECT * FROM leituras_gas WHERE apartamento = $1 AND mes = $2 AND ano = $3', [aptoFormatado, mes, ano]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Leitura não encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao obter leitura:', error);
        res.status(500).json({ erro: 'Erro ao obter leitura' });
    }
};
exports.obterLeituraApartamento = obterLeituraApartamento;
// Obter histórico de leituras de um apartamento (últimos 12 meses)
const obterHistoricoApartamento = async (req, res) => {
    try {
        const { apartamento } = req.params;
        const aptoFormatado = apartamento.toString().padStart(2, '0');
        const result = await database_1.default.query(`SELECT * FROM leituras_gas
       WHERE apartamento = $1
       ORDER BY ano DESC, mes DESC
       LIMIT 12`, [aptoFormatado]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao obter histórico:', error);
        res.status(500).json({ erro: 'Erro ao obter histórico' });
    }
};
exports.obterHistoricoApartamento = obterHistoricoApartamento;
// Obter relatório de gás de todos os apartamentos (últimos 12 meses)
const obterRelatorioGeral = async (req, res) => {
    try {
        const result = await database_1.default.query(`SELECT * FROM leituras_gas
       ORDER BY ano DESC, mes DESC, apartamento
       LIMIT 72`);
        // Organizar por mês/ano
        const relatorio = {};
        result.rows.forEach((leitura) => {
            const chave = `${leitura.ano}-${leitura.mes.toString().padStart(2, '0')}`;
            if (!relatorio[chave]) {
                relatorio[chave] = {
                    mes: leitura.mes,
                    ano: leitura.ano,
                    apartamentos: []
                };
            }
            relatorio[chave].apartamentos.push(leitura);
        });
        const relatorioArray = Object.values(relatorio);
        res.json(relatorioArray);
    }
    catch (error) {
        console.error('Erro ao obter relatório geral:', error);
        res.status(500).json({ erro: 'Erro ao obter relatório geral' });
    }
};
exports.obterRelatorioGeral = obterRelatorioGeral;
// Excluir leitura
const excluirLeitura = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('DELETE FROM leituras_gas WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Leitura não encontrada' });
        }
        res.json({ mensagem: 'Leitura excluída com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir leitura:', error);
        res.status(500).json({ erro: 'Erro ao excluir leitura' });
    }
};
exports.excluirLeitura = excluirLeitura;
//# sourceMappingURL=gasController.js.map