"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterResumoMensal = exports.atualizarStatusParcela = exports.listarDespesasParceladas = exports.criarDespesaParcelada = exports.excluirDespesaCondominio = exports.atualizarDespesaCondominio = exports.salvarDespesaCondominio = exports.listarDespesasCondominio = exports.desativarCategoria = exports.atualizarCategoria = exports.criarCategoria = exports.listarCategorias = void 0;
const database_1 = __importDefault(require("../config/database"));
// Listar categorias de despesas
const listarCategorias = async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT * FROM categorias_despesas WHERE ativo = true ORDER BY ordem');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ erro: 'Erro ao listar categorias' });
    }
};
exports.listarCategorias = listarCategorias;
// Criar nova categoria
const criarCategoria = async (req, res) => {
    try {
        const { nome, ordem } = req.body;
        if (!nome) {
            return res.status(400).json({ erro: 'Nome é obrigatório' });
        }
        const result = await database_1.default.query('INSERT INTO categorias_despesas (nome, ordem) VALUES ($1, $2) RETURNING *', [nome, ordem || 999]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ erro: 'Erro ao criar categoria' });
    }
};
exports.criarCategoria = criarCategoria;
// Atualizar categoria
const atualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, ordem } = req.body;
        const result = await database_1.default.query('UPDATE categorias_despesas SET nome = $1, ordem = $2 WHERE id = $3 RETURNING *', [nome, ordem, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ erro: 'Erro ao atualizar categoria' });
    }
};
exports.atualizarCategoria = atualizarCategoria;
// Desativar categoria
const desativarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('UPDATE categorias_despesas SET ativo = false WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }
        res.json({ mensagem: 'Categoria desativada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desativar categoria:', error);
        res.status(500).json({ erro: 'Erro ao desativar categoria' });
    }
};
exports.desativarCategoria = desativarCategoria;
// Listar despesas do condomínio por período
const listarDespesasCondominio = async (req, res) => {
    try {
        const { mes, ano } = req.params;
        const result = await database_1.default.query(`SELECT dc.*, cd.nome as categoria_nome
       FROM despesas_condominio dc
       LEFT JOIN categorias_despesas cd ON dc.categoria_id = cd.id
       WHERE dc.mes = $1 AND dc.ano = $2
       ORDER BY cd.ordem, dc.descricao`, [mes, ano]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar despesas:', error);
        res.status(500).json({ erro: 'Erro ao listar despesas' });
    }
};
exports.listarDespesasCondominio = listarDespesasCondominio;
// Criar/Atualizar despesa do condomínio
const salvarDespesaCondominio = async (req, res) => {
    try {
        const { mes, ano, categoria_id, descricao, valor } = req.body;
        if (!mes || !ano || !descricao || valor === undefined) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }
        const valorPorApto = valor / 6;
        const result = await database_1.default.query(`INSERT INTO despesas_condominio (mes, ano, categoria_id, descricao, valor, valor_por_apto)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (mes, ano, categoria_id, descricao)
       DO UPDATE SET valor = $5, valor_por_apto = $6
       RETURNING *`, [mes, ano, categoria_id, descricao, valor, valorPorApto]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao salvar despesa:', error);
        res.status(500).json({ erro: 'Erro ao salvar despesa' });
    }
};
exports.salvarDespesaCondominio = salvarDespesaCondominio;
// Atualizar despesa do condomínio
const atualizarDespesaCondominio = async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, valor } = req.body;
        if (!descricao || valor === undefined) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }
        const valorPorApto = valor / 6;
        const result = await database_1.default.query(`UPDATE despesas_condominio
       SET descricao = $1, valor = $2, valor_por_apto = $3
       WHERE id = $4
       RETURNING *`, [descricao, valor, valorPorApto, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Despesa não encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar despesa:', error);
        res.status(500).json({ erro: 'Erro ao atualizar despesa' });
    }
};
exports.atualizarDespesaCondominio = atualizarDespesaCondominio;
// Excluir despesa do condomínio
const excluirDespesaCondominio = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('DELETE FROM despesas_condominio WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Despesa não encontrada' });
        }
        res.json({ mensagem: 'Despesa excluída com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir despesa:', error);
        res.status(500).json({ erro: 'Erro ao excluir despesa' });
    }
};
exports.excluirDespesaCondominio = excluirDespesaCondominio;
// Criar despesa parcelada
const criarDespesaParcelada = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { descricao, valor_total, num_parcelas, mes_inicio, ano_inicio } = req.body;
        if (!descricao || !valor_total || !num_parcelas || !mes_inicio || !ano_inicio) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }
        await client.query('BEGIN');
        const valor_parcela = valor_total / num_parcelas / 6; // Dividido pelos 6 apartamentos
        // Criar a despesa parcelada
        const despesaResult = await client.query(`INSERT INTO despesas_parceladas (descricao, valor_total, num_parcelas, valor_parcela, mes_inicio, ano_inicio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [descricao, valor_total, num_parcelas, valor_parcela, mes_inicio, ano_inicio]);
        const despesaId = despesaResult.rows[0].id;
        // Criar as parcelas
        let mesAtual = mes_inicio;
        let anoAtual = ano_inicio;
        for (let i = 1; i <= num_parcelas; i++) {
            await client.query(`INSERT INTO parcelas_cobradas (despesa_parcelada_id, mes, ano, parcela_numero, valor)
         VALUES ($1, $2, $3, $4, $5)`, [despesaId, mesAtual, anoAtual, i, valor_parcela]);
            // Adicionar automaticamente à despesa do condomínio
            const valorTotalParcela = valor_parcela * 6;
            await client.query(`INSERT INTO despesas_condominio (mes, ano, descricao, valor, valor_por_apto)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (mes, ano, categoria_id, descricao) DO NOTHING`, [mesAtual, anoAtual, `${descricao} (${i}/${num_parcelas})`, valorTotalParcela, valor_parcela]);
            mesAtual++;
            if (mesAtual > 12) {
                mesAtual = 1;
                anoAtual++;
            }
        }
        await client.query('COMMIT');
        res.status(201).json(despesaResult.rows[0]);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar despesa parcelada:', error);
        res.status(500).json({ erro: 'Erro ao criar despesa parcelada' });
    }
    finally {
        client.release();
    }
};
exports.criarDespesaParcelada = criarDespesaParcelada;
// Listar despesas parceladas
const listarDespesasParceladas = async (req, res) => {
    try {
        const result = await database_1.default.query(`
      SELECT dp.*,
        (SELECT COUNT(*) FROM parcelas_cobradas WHERE despesa_parcelada_id = dp.id AND cobrado = true) as parcelas_cobradas,
        (SELECT json_agg(pc ORDER BY pc.parcela_numero)
         FROM parcelas_cobradas pc
         WHERE pc.despesa_parcelada_id = dp.id) as parcelas
      FROM despesas_parceladas dp
      ORDER BY dp.ano_inicio DESC, dp.mes_inicio DESC
    `);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Erro ao listar despesas parceladas:', error);
        res.status(500).json({ erro: 'Erro ao listar despesas parceladas' });
    }
};
exports.listarDespesasParceladas = listarDespesasParceladas;
// Marcar parcela como cobrada/não cobrada
const atualizarStatusParcela = async (req, res) => {
    try {
        const { id } = req.params;
        const { cobrado } = req.body;
        const result = await database_1.default.query('UPDATE parcelas_cobradas SET cobrado = $1 WHERE id = $2 RETURNING *', [cobrado, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Parcela não encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar parcela:', error);
        res.status(500).json({ erro: 'Erro ao atualizar parcela' });
    }
};
exports.atualizarStatusParcela = atualizarStatusParcela;
// Obter resumo mensal para todos os apartamentos
const obterResumoMensal = async (req, res) => {
    try {
        const { mes, ano } = req.params;
        // Buscar despesas do condomínio
        const despesas = await database_1.default.query(`SELECT SUM(valor) as total_despesas
       FROM despesas_condominio
       WHERE mes = $1 AND ano = $2`, [mes, ano]);
        const totalDespesas = despesas.rows[0]?.total_despesas || 0;
        const totalCondominioPorApto = parseFloat(totalDespesas) / 6;
        // Buscar configuração do fundo de reserva
        const configResult = await database_1.default.query("SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')");
        const config = {};
        configResult.rows.forEach(row => { config[row.chave] = row.valor; });
        const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
        const percentual = parseFloat(config.fundo_reserva_percentual || '10');
        const fundoReserva = valorFixo > 0 ? valorFixo : totalCondominioPorApto * (percentual / 100);
        // Buscar valores de gás por apartamento
        const gas = await database_1.default.query(`SELECT apartamento, valor_total as valor_gas
       FROM leituras_gas
       WHERE mes = $1 AND ano = $2
       ORDER BY apartamento`, [mes, ano]);
        const resumo = [];
        for (let i = 1; i <= 6; i++) {
            const apto = i.toString().padStart(2, '0');
            const gasApto = gas.rows.find(g => g.apartamento === apto);
            const valorGas = gasApto?.valor_gas || 0;
            resumo.push({
                apartamento: apto,
                valor_condominio: totalCondominioPorApto,
                fundo_reserva: fundoReserva,
                valor_gas: parseFloat(valorGas),
                total: totalCondominioPorApto + fundoReserva + parseFloat(valorGas)
            });
        }
        res.json(resumo);
    }
    catch (error) {
        console.error('Erro ao obter resumo mensal:', error);
        res.status(500).json({ erro: 'Erro ao obter resumo mensal' });
    }
};
exports.obterResumoMensal = obterResumoMensal;
//# sourceMappingURL=despesasController.js.map