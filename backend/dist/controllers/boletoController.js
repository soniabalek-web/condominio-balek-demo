"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarTodosBoletos = exports.gerarBoletoTeste = exports.gerarBoletoPDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = __importDefault(require("../config/database"));
const pix_utils_1 = require("pix-utils");
// Dados do condomínio
const CONDOMINIO = {
    nome: 'Condomínio Edifício Residencial BALEK',
    cnpj: '49.936.617/0001-02',
    banco: 'Banco Inter S/A - 077',
    agencia: '0001',
    conta: '28387222-5',
    chavePix: '49.936.617/0001-02'
};
const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const nomeMes = (mes) => {
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mes];
};
// Calcular CRC16 CCITT-FALSE para PIX
const crc16ccitt = (str) => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            }
            else {
                crc <<= 1;
            }
        }
        crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};
// Gerar payload PIX usando biblioteca pix-utils (bem testada)
const gerarPixPayload = (chave, nome, cidade, valor) => {
    // Para CNPJ/CPF: remover TUDO exceto dígitos
    const chaveClean = chave.replace(/\D/g, '');
    const pix = (0, pix_utils_1.createStaticPix)({
        merchantName: nome.substring(0, 25),
        merchantCity: cidade.substring(0, 15),
        pixKey: chaveClean,
        transactionAmount: valor,
    });
    if ((0, pix_utils_1.hasError)(pix)) {
        console.error('Erro ao criar PIX:', pix.error);
        return '';
    }
    return pix.toBRCode();
};
const gerarBoletoPDF = async (req, res) => {
    try {
        const { mes, ano, apartamento } = req.params;
        const mesNum = parseInt(mes);
        const anoNum = parseInt(ano);
        const aptoFormatado = apartamento.padStart(2, '0');
        // Buscar dados do condômino
        const condominoResult = await database_1.default.query('SELECT * FROM condominos WHERE apartamento = $1', [aptoFormatado]);
        const condomino = condominoResult.rows[0] || { nome_proprietario: `Proprietário Apto ${aptoFormatado}` };
        // Buscar TODAS as despesas do mês
        const despesasResult = await database_1.default.query(`SELECT dc.*, cd.nome as categoria_nome
       FROM despesas_condominio dc
       LEFT JOIN categorias_despesas cd ON dc.categoria_id = cd.id
       WHERE dc.mes = $1 AND dc.ano = $2
       ORDER BY cd.ordem, dc.descricao`, [mesNum, anoNum]);
        const despesas = despesasResult.rows;
        // Buscar dados de gás
        const gasResult = await database_1.default.query(`SELECT * FROM leituras_gas WHERE mes = $1 AND ano = $2 AND apartamento = $3`, [mesNum, anoNum, aptoFormatado]);
        const gasData = gasResult.rows[0] || { leitura_anterior: 0, leitura_atual: 0, consumo: 0, valor_m3: 0, valor_total: 0 };
        // Buscar configuração do fundo de reserva
        const configResult = await database_1.default.query("SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')");
        const config = {};
        configResult.rows.forEach(row => { config[row.chave] = row.valor; });
        // Buscar dados bancários da configuração
        const dadosBancariosResult = await database_1.default.query(`SELECT chave, valor FROM configuracoes
       WHERE chave IN ('cnpj_condominio', 'banco_favorecido', 'banco_nome', 'banco_agencia', 'banco_conta', 'pix_chave')`);
        const dadosBancarios = {};
        dadosBancariosResult.rows.forEach(row => { dadosBancarios[row.chave] = row.valor; });
        // Dados do condomínio (usa configuração ou fallback para valores padrão)
        const condominioData = {
            nome: dadosBancarios.banco_favorecido || CONDOMINIO.nome,
            cnpj: dadosBancarios.cnpj_condominio || CONDOMINIO.cnpj,
            banco: dadosBancarios.banco_nome || CONDOMINIO.banco,
            agencia: dadosBancarios.banco_agencia || CONDOMINIO.agencia,
            conta: dadosBancarios.banco_conta || CONDOMINIO.conta,
            chavePix: dadosBancarios.pix_chave || CONDOMINIO.chavePix
        };
        // Calcular totais
        const totalDespesas = despesas.reduce((sum, d) => sum + parseFloat(d.valor), 0);
        const valorCondominioPorApto = totalDespesas / 6;
        // Calcular fundo de reserva
        const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
        const percentual = parseFloat(config.fundo_reserva_percentual || '10');
        const fundoReserva = valorFixo > 0 ? valorFixo : valorCondominioPorApto * (percentual / 100);
        const valorGas = parseFloat(gasData.valor_total) || 0;
        const totalPagar = valorCondominioPorApto + fundoReserva + valorGas;
        // Criar PDF
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=boleto_apto${aptoFormatado}_${mes}_${ano}.pdf`);
        doc.pipe(res);
        // === CABEÇALHO AZUL ===
        doc.rect(0, 0, 612, 100).fill('#1565C0');
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
            .text(condominioData.nome, 40, 25, { align: 'center' });
        doc.fontSize(10).font('Helvetica')
            .text(`CNPJ: ${condominioData.cnpj}`, 40, 50, { align: 'center' });
        doc.fontSize(14).font('Helvetica-Bold')
            .text(`DEMONSTRATIVO DE COBRANÇA - ${nomeMes(mesNum).toUpperCase()}/${anoNum}`, 40, 72, { align: 'center' });
        // === DADOS DO APARTAMENTO ===
        let y = 115;
        doc.fillColor('#1565C0').fontSize(14).font('Helvetica-Bold')
            .text(`APARTAMENTO ${aptoFormatado}`, 40, y);
        doc.fillColor('#333333').fontSize(11).font('Helvetica')
            .text(`Proprietário: ${condomino.nome_proprietario}`, 40, y + 18);
        y += 45;
        doc.strokeColor('#1565C0').lineWidth(2).moveTo(40, y).lineTo(555, y).stroke();
        // === DESPESAS DETALHADAS ===
        y += 15;
        doc.fillColor('#D32F2F').fontSize(12).font('Helvetica-Bold')
            .text('DESPESAS DO CONDOMÍNIO', 40, y);
        y += 20;
        // Cabeçalho da tabela
        doc.rect(40, y, 515, 20).fill('#FFEBEE');
        doc.fillColor('#C62828').fontSize(9).font('Helvetica-Bold');
        doc.text('Descrição', 45, y + 6);
        doc.text('Total', 320, y + 6, { width: 80, align: 'right' });
        doc.text('Sua Parte (1/6)', 420, y + 6, { width: 130, align: 'right' });
        y += 20;
        // Linhas de despesas
        despesas.forEach((d, i) => {
            const bgColor = i % 2 === 0 ? '#FFFFFF' : '#FFF5F5';
            doc.rect(40, y, 515, 18).fill(bgColor);
            doc.fillColor('#333333').fontSize(8).font('Helvetica');
            const descricao = d.categoria_nome ? `${d.categoria_nome} - ${d.descricao}` : d.descricao;
            doc.text(descricao.substring(0, 55), 45, y + 5, { width: 260 });
            doc.text(formatarMoeda(parseFloat(d.valor)), 320, y + 5, { width: 80, align: 'right' });
            doc.text(formatarMoeda(parseFloat(d.valor_por_apto)), 420, y + 5, { width: 130, align: 'right' });
            y += 18;
        });
        // Subtotal despesas
        doc.rect(40, y, 515, 22).fill('#FFCDD2');
        doc.fillColor('#B71C1C').fontSize(10).font('Helvetica-Bold');
        doc.text('SUBTOTAL DESPESAS', 45, y + 6);
        doc.text(formatarMoeda(totalDespesas), 320, y + 6, { width: 80, align: 'right' });
        doc.text(formatarMoeda(valorCondominioPorApto), 420, y + 6, { width: 130, align: 'right' });
        y += 30;
        // === TABELA DE GÁS ===
        doc.fillColor('#2E7D32').fontSize(12).font('Helvetica-Bold')
            .text('CONSUMO DE GÁS', 40, y);
        y += 20;
        doc.rect(40, y, 515, 20).fill('#E8F5E9');
        doc.fillColor('#1B5E20').fontSize(9).font('Helvetica-Bold');
        doc.text('Leit. Anterior', 45, y + 6, { width: 80, align: 'center' });
        doc.text('Leit. Atual', 125, y + 6, { width: 80, align: 'center' });
        doc.text('Consumo m³', 205, y + 6, { width: 80, align: 'center' });
        doc.text('Valor/m³', 285, y + 6, { width: 80, align: 'right' });
        doc.text('Valor Total', 420, y + 6, { width: 130, align: 'right' });
        y += 20;
        doc.rect(40, y, 515, 18).fill('#FFFFFF');
        doc.fillColor('#333333').fontSize(9).font('Helvetica');
        doc.text(gasData.leitura_anterior?.toString() || '0', 45, y + 5, { width: 80, align: 'center' });
        doc.text(gasData.leitura_atual?.toString() || '0', 125, y + 5, { width: 80, align: 'center' });
        doc.text(gasData.consumo?.toString() || '0', 205, y + 5, { width: 80, align: 'center' });
        doc.text(formatarMoeda(parseFloat(gasData.valor_m3) || 0), 285, y + 5, { width: 80, align: 'right' });
        doc.text(formatarMoeda(valorGas), 420, y + 5, { width: 130, align: 'right' });
        y += 30;
        // === RESUMO FINAL ===
        doc.fillColor('#1565C0').fontSize(12).font('Helvetica-Bold')
            .text('RESUMO DO PAGAMENTO', 40, y);
        y += 20;
        const itens = [
            { desc: 'Taxa de Condomínio + Água (sua parte)', valor: valorCondominioPorApto },
            { desc: `Fundo de Reserva (${valorFixo > 0 ? 'fixo' : percentual + '%'})`, valor: fundoReserva },
            { desc: 'Consumo de Gás', valor: valorGas }
        ];
        itens.forEach((item, i) => {
            const bg = i % 2 === 0 ? '#E3F2FD' : '#FFFFFF';
            doc.rect(40, y, 515, 20).fill(bg);
            doc.fillColor('#333333').fontSize(10).font('Helvetica');
            doc.text(item.desc, 50, y + 5, { width: 350 });
            doc.text(formatarMoeda(item.valor), 420, y + 5, { width: 130, align: 'right' });
            y += 20;
        });
        // TOTAL
        doc.rect(40, y, 515, 28).fill('#1565C0');
        doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold');
        doc.text('TOTAL A PAGAR', 50, y + 8);
        doc.text(formatarMoeda(totalPagar), 420, y + 8, { width: 130, align: 'right' });
        y += 40;
        // === DADOS PARA PAGAMENTO COM QR CODE ===
        doc.fillColor('#FF6F00').fontSize(12).font('Helvetica-Bold')
            .text('DADOS PARA PAGAMENTO PIX', 40, y);
        y += 20;
        doc.rect(40, y, 320, 90).fill('#FFF8E1').stroke('#FFB300');
        doc.fillColor('#E65100').fontSize(10).font('Helvetica-Bold')
            .text('Chave PIX (CNPJ):', 50, y + 10);
        doc.fillColor('#333333').fontSize(10).font('Helvetica')
            .text(condominioData.chavePix, 50, y + 25)
            .text(`Banco: ${condominioData.banco} | Ag: ${condominioData.agencia} | CC: ${condominioData.conta}`, 50, y + 40)
            .text(`Favorecido: ${condominioData.nome}`, 50, y + 55, { width: 300 })
            .text(`Valor: ${formatarMoeda(totalPagar)}`, 50, y + 70);
        // QR Code
        try {
            const payload = gerarPixPayload(condominioData.chavePix, condominioData.nome.substring(0, 25), 'CURITIBA', totalPagar);
            const qrCodeDataUrl = await qrcode_1.default.toDataURL(payload, { width: 110, margin: 1 });
            const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            doc.image(qrCodeBuffer, 380, y, { width: 90 });
            doc.fillColor('#333333').fontSize(8).text('Escaneie para pagar', 380, y + 95, { width: 90, align: 'center' });
        }
        catch (e) {
            console.error('Erro QR:', e);
        }
        y += 120;
        // Rodapé
        doc.strokeColor('#BDBDBD').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();
        doc.fillColor('#757575').fontSize(7).font('Helvetica')
            .text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, y + 8, { align: 'center' })
            .text('Dúvidas? Entre em contato com a administração do condomínio.', 40, y + 18, { align: 'center' });
        doc.end();
    }
    catch (error) {
        console.error('Erro ao gerar boleto:', error);
        res.status(500).json({ erro: 'Erro ao gerar boleto PDF' });
    }
};
exports.gerarBoletoPDF = gerarBoletoPDF;
// TESTE TEMPORÁRIO - Boleto com R$ 0,10 para testar QR Code
const gerarBoletoTeste = async (req, res) => {
    try {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=boleto_TESTE_QRCode.pdf');
        doc.pipe(res);
        const totalPagar = 0.10;
        // === CABEÇALHO AZUL ===
        doc.rect(0, 0, 612, 100).fill('#1565C0');
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
            .text(CONDOMINIO.nome, 40, 25, { align: 'center' });
        doc.fontSize(10).font('Helvetica')
            .text(`CNPJ: ${CONDOMINIO.cnpj}`, 40, 50, { align: 'center' });
        doc.fontSize(14).font('Helvetica-Bold')
            .text('*** BOLETO DE TESTE - QR CODE ***', 40, 72, { align: 'center' });
        let y = 115;
        doc.fillColor('#D32F2F').fontSize(16).font('Helvetica-Bold')
            .text('ATENÇÃO: ESTE É UM BOLETO DE TESTE!', 40, y, { align: 'center' });
        y += 40;
        doc.fillColor('#333333').fontSize(12).font('Helvetica')
            .text('Este boleto foi gerado apenas para testar o QR Code do PIX.', 40, y, { align: 'center' });
        y += 30;
        doc.fillColor('#1565C0').fontSize(14).font('Helvetica-Bold')
            .text('RESUMO DO PAGAMENTO', 40, y);
        y += 25;
        const itens = [
            { desc: 'Despesas (teste)', valor: 0.01 },
            { desc: 'Fundo de Reserva (teste)', valor: 0.01 },
            { desc: 'Gás (teste)', valor: 0.08 }
        ];
        itens.forEach((item, i) => {
            const bg = i % 2 === 0 ? '#E3F2FD' : '#FFFFFF';
            doc.rect(40, y, 515, 22).fill(bg);
            doc.fillColor('#333333').fontSize(11).font('Helvetica');
            doc.text(item.desc, 50, y + 5);
            doc.text(formatarMoeda(item.valor), 450, y + 5);
            y += 22;
        });
        // TOTAL
        doc.rect(40, y, 515, 30).fill('#1565C0');
        doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold');
        doc.text('TOTAL A PAGAR', 50, y + 8);
        doc.text(formatarMoeda(totalPagar), 420, y + 8);
        y += 50;
        // === DADOS PARA PAGAMENTO COM QR CODE ===
        doc.fillColor('#FF6F00').fontSize(12).font('Helvetica-Bold')
            .text('DADOS PARA PAGAMENTO PIX', 40, y);
        y += 20;
        doc.rect(40, y, 320, 100).fill('#FFF8E1').stroke('#FFB300');
        doc.fillColor('#E65100').fontSize(10).font('Helvetica-Bold')
            .text('Chave PIX (CNPJ):', 50, y + 10);
        doc.fillColor('#333333').fontSize(10).font('Helvetica')
            .text(CONDOMINIO.chavePix, 50, y + 28)
            .text(`Banco: ${CONDOMINIO.banco} | Ag: ${CONDOMINIO.agencia} | CC: ${CONDOMINIO.conta}`, 50, y + 46)
            .text(`Favorecido: ${CONDOMINIO.nome}`, 50, y + 64, { width: 300 })
            .text(`Valor: ${formatarMoeda(totalPagar)}`, 50, y + 82);
        // QR Code com payload PIX correto
        try {
            const payload = gerarPixPayload(CONDOMINIO.chavePix, 'COND EDIF RES BALEK', 'CURITIBA', totalPagar);
            const qrCodeDataUrl = await qrcode_1.default.toDataURL(payload, { width: 120, margin: 1 });
            const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            doc.image(qrCodeBuffer, 380, y, { width: 100 });
            doc.fillColor('#333333').fontSize(9).text('Escaneie para pagar', 380, y + 105, { width: 100, align: 'center' });
        }
        catch (e) {
            console.error('Erro QR:', e);
        }
        y += 140;
        doc.fillColor('#D32F2F').fontSize(10).font('Helvetica-Bold')
            .text('LEMBRE-SE: Após testar, peça para remover este boleto de teste!', 40, y, { align: 'center' });
        doc.end();
    }
    catch (error) {
        console.error('Erro ao gerar boleto teste:', error);
        res.status(500).json({ erro: 'Erro ao gerar boleto teste' });
    }
};
exports.gerarBoletoTeste = gerarBoletoTeste;
const gerarTodosBoletos = async (req, res) => {
    try {
        const { mes, ano } = req.params;
        const resumo = [];
        for (let i = 1; i <= 6; i++) {
            const apto = i.toString().padStart(2, '0');
            const gasResult = await database_1.default.query(`SELECT valor_total FROM leituras_gas WHERE mes = $1 AND ano = $2 AND apartamento = $3`, [mes, ano, apto]);
            const despesasResult = await database_1.default.query(`SELECT SUM(valor) as total FROM despesas_condominio WHERE mes = $1 AND ano = $2`, [mes, ano]);
            const totalDespesas = parseFloat(despesasResult.rows[0]?.total || 0);
            const valorCondominio = totalDespesas / 6;
            const fundoReserva = valorCondominio * 0.10;
            const valorGas = parseFloat(gasResult.rows[0]?.valor_total || 0);
            resumo.push({
                apartamento: apto,
                valor_condominio: valorCondominio,
                fundo_reserva: fundoReserva,
                valor_gas: valorGas,
                total: valorCondominio + fundoReserva + valorGas
            });
        }
        res.json(resumo);
    }
    catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ erro: 'Erro ao gerar resumo' });
    }
};
exports.gerarTodosBoletos = gerarTodosBoletos;
//# sourceMappingURL=boletoController.js.map