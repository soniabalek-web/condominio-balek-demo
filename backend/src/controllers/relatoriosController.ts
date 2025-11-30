import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import pool from '../config/database';

// Função auxiliar para formatar moeda
const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função auxiliar para formatar data
const formatarData = (mes: number, ano: number): string => {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${meses[mes - 1]}/${ano}`;
};

// Função auxiliar para buscar dados do condomínio
const buscarDadosCondominio = async () => {
  const configResult = await pool.query(
    `SELECT chave, valor FROM configuracoes
     WHERE chave IN ('cond_nome', 'cnpj_condominio', 'cond_endereco', 'cond_numero',
                     'cond_complemento', 'cond_bairro', 'cond_cidade', 'cond_estado',
                     'cond_cep', 'cond_nome_sindico', 'cond_tel_sindico',
                     'cond_email_condominio', 'cond_email_sindico')`
  );

  const config: { [key: string]: string } = {};
  configResult.rows.forEach((row: any) => { config[row.chave] = row.valor; });

  return {
    nome: config.cond_nome || 'Condomínio Edifício Residencial BALEK',
    cnpj: config.cnpj_condominio || '49.936.617/0001-02',
    endereco: config.cond_endereco || '',
    numero: config.cond_numero || '',
    complemento: config.cond_complemento || '',
    bairro: config.cond_bairro || '',
    cidade: config.cond_cidade || 'Curitiba',
    estado: config.cond_estado || 'PR',
    cep: config.cond_cep || '',
    nomeSindico: config.cond_nome_sindico || '',
    telSindico: config.cond_tel_sindico || '',
    emailCondominio: config.cond_email_condominio || '',
    emailSindico: config.cond_email_sindico || '',
    enderecoCompleto: () => {
      const end = config.cond_endereco || '';
      const num = config.cond_numero || '';
      const comp = config.cond_complemento || '';
      const bairro = config.cond_bairro || '';
      return `${end}${num ? ', ' + num : ''}${comp ? ' - ' + comp : ''}${bairro ? ' - ' + bairro : ''}`;
    },
    cidadeEstadoCep: () => {
      const cidade = config.cond_cidade || 'Curitiba';
      const estado = config.cond_estado || 'PR';
      const cep = config.cond_cep || '';
      return `${cidade}/${estado}${cep ? ' - CEP: ' + cep : ''}`;
    }
  };
};

// Relatório de Extrato Bancário
export const gerarExtratoBank = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    // Calcular mês e ano anterior para buscar última data de transação
    const mesAnteriorNum = parseInt(mes) === 1 ? 12 : parseInt(mes) - 1;
    const anoAnteriorNum = parseInt(mes) === 1 ? parseInt(ano) - 1 : parseInt(ano);

    const [saldoResult, transacoesResult, dataInicialResult, dataFinalResult] = await Promise.all([
      pool.query('SELECT * FROM banco_saldo WHERE mes = $1 AND ano = $2', [mes, ano]),
      pool.query(
        `SELECT bt.*, cd.nome as categoria_nome
         FROM banco_transacoes bt
         LEFT JOIN categorias_despesas cd ON bt.categoria_id = cd.id
         WHERE bt.mes = $1 AND bt.ano = $2
         ORDER BY bt.data_transacao, bt.criado_em`,
        [mes, ano]
      ),
      pool.query(
        `SELECT MAX(data_transacao) as ultima_data FROM banco_transacoes WHERE mes = $1 AND ano = $2`,
        [mesAnteriorNum, anoAnteriorNum]
      ),
      pool.query(
        `SELECT MAX(data_transacao) as ultima_data FROM banco_transacoes WHERE mes = $1 AND ano = $2`,
        [mes, ano]
      )
    ]);

    if (saldoResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Dados bancários não encontrados' });
    }

    const saldo = saldoResult.rows[0];

    // Buscar dados do condomínio
    const dadosCondominio = await buscarDadosCondominio();

    // Calcular período das transações
    let dataInicio = '';
    let dataFim = '';
    if (transacoesResult.rows.length > 0) {
      const datas = transacoesResult.rows.map((t: any) => new Date(t.data_transacao));
      dataInicio = new Date(Math.min(...datas.map(d => d.getTime()))).toLocaleDateString('pt-BR');
      dataFim = new Date(Math.max(...datas.map(d => d.getTime()))).toLocaleDateString('pt-BR');
    }

    // Calcular saldo inicial correto (pegar saldo final do mês anterior)
    let saldoInicial = parseFloat(saldo.saldo_inicial);
    const mesAnterior = parseInt(mes) === 1 ? 12 : parseInt(mes) - 1;
    const anoAnterior = parseInt(mes) === 1 ? parseInt(ano) - 1 : parseInt(ano);

    const saldoAnteriorResult = await pool.query(
      'SELECT saldo_final FROM banco_saldo WHERE mes = $1 AND ano = $2',
      [mesAnterior, anoAnterior]
    );

    if (saldoAnteriorResult.rows.length > 0) {
      saldoInicial = parseFloat(saldoAnteriorResult.rows[0].saldo_final);
    }

    // Obter datas das últimas transações para os saldos
    const dataUltimoDiaMesAnterior = dataInicialResult.rows[0]?.ultima_data
      ? new Date(dataInicialResult.rows[0].ultima_data).toLocaleDateString('pt-BR')
      : new Date(anoAnteriorNum, mesAnteriorNum, 0).toLocaleDateString('pt-BR');

    const dataUltimoDiaMesAtual = dataFinalResult.rows[0]?.ultima_data
      ? new Date(dataFinalResult.rows[0].ultima_data).toLocaleDateString('pt-BR')
      : new Date(parseInt(ano), parseInt(mes), 0).toLocaleDateString('pt-BR');

    // Criar PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=extrato-bancario-${mes}-${ano}.pdf`);

    doc.pipe(res);

    // ============================================
    // CABEÇALHO PRINCIPAL
    // ============================================
    doc.rect(0, 0, 595, 100).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`CNPJ: ${dadosCondominio.cnpj}`, 40, 48, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold')
      .text('EXTRATO BANCÁRIO', 40, 65, { align: 'center' });

    let y = 115;
    doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold')
      .text(`Condomínio de: ${formatarData(parseInt(mes), parseInt(ano))}`, 40, y, { align: 'center' });

    y = 150;

    doc.fontSize(10).font('Helvetica').fillColor('#333333')
      .text(`Período: ${dataInicio || formatarData(parseInt(mes), parseInt(ano))} a ${dataFim || formatarData(parseInt(mes), parseInt(ano))}`, 40, y);
    y += 25;

    // Saldo inicial com data
    doc.rect(40, y, 515, 22).fill('#E3F2FD');
    doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold')
      .text(`Saldo Inicial (${dataUltimoDiaMesAnterior}):`, 45, y + 7)
      .text(formatarMoeda(saldoInicial), 450, y + 7, { width: 100, align: 'right' });
    y += 27;

    // Cabeçalho da tabela de transações
    doc.rect(40, y, 515, 20).fill('#BBDEFB');
    doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
      .text('Data', 45, y + 6)
      .text('Tipo', 110, y + 6)
      .text('Descrição', 180, y + 6)
      .text('Valor', 510, y + 6);
    y += 20;

    let totalCreditos = 0;
    let totalDebitos = 0;

    // Transações com linhas alternadas
    transacoesResult.rows.forEach((transacao: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(40, y, 515, 18).fill(bgColor);

      const data = new Date(transacao.data_transacao).toLocaleDateString('pt-BR');
      const tipo = transacao.tipo === 'credito' ? 'Crédito' : 'Débito';
      const valor = parseFloat(transacao.valor);
      const corTipo = transacao.tipo === 'credito' ? '#2E7D32' : '#D32F2F';

      if (transacao.tipo === 'credito') {
        totalCreditos += valor;
      } else {
        totalDebitos += valor;
      }

      doc.fillColor('#333333').fontSize(8).font('Helvetica')
        .text(data, 45, y + 5)
        .fillColor(corTipo).font('Helvetica-Bold')
        .text(tipo, 110, y + 5)
        .fillColor('#333333').fontSize(8).font('Helvetica')
        .text(transacao.descricao.substring(0, 38), 180, y + 5, { width: 300 })
        .font('Helvetica-Bold')
        .text(formatarMoeda(valor), 490, y + 5, { width: 60, align: 'right' });

      y += 18;

      // Nova página se necessário
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
    });

    // Totais do extrato
    y += 5;
    doc.rect(40, y, 515, 20).fill('#C8E6C9');
    doc.fillColor('#2E7D32').fontSize(9).font('Helvetica-Bold')
      .text('Total Créditos:', 45, y + 6)
      .text(formatarMoeda(totalCreditos), 490, y + 6, { width: 60, align: 'right' });
    y += 20;

    doc.rect(40, y, 515, 20).fill('#FFCDD2');
    doc.fillColor('#D32F2F').fontSize(9).font('Helvetica-Bold')
      .text('Total Débitos:', 45, y + 6)
      .text(formatarMoeda(totalDebitos), 490, y + 6, { width: 60, align: 'right' });
    y += 20;

    const saldoFinal = saldoInicial + totalCreditos - totalDebitos;
    doc.rect(40, y, 515, 22).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
      .text(`Saldo Final (${dataUltimoDiaMesAtual}):`, 45, y + 7)
      .text(formatarMoeda(saldoFinal), 490, y + 7, { width: 60, align: 'right' });

    // Rodapé
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar extrato bancário:', error);
    res.status(500).json({ erro: 'Erro ao gerar extrato bancário' });
  }
};

// Relatório de Despesas do Condomínio
export const gerarRelatorioDespesas = async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.params;

    // Buscar despesas
    const despesasResult = await pool.query(
      `SELECT dc.*, cd.nome as categoria_nome
       FROM despesas_condominio dc
       LEFT JOIN categorias_despesas cd ON dc.categoria_id = cd.id
       WHERE dc.mes = $1 AND dc.ano = $2
       ORDER BY cd.ordem, dc.descricao`,
      [mes, ano]
    );

    // Buscar dados do condomínio
    const dadosCondominio = await buscarDadosCondominio();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=despesas-${mes}-${ano}.pdf`);

    doc.pipe(res);

    // ============================================
    // CABEÇALHO PRINCIPAL
    // ============================================
    doc.rect(0, 0, 595, 100).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`CNPJ: ${dadosCondominio.cnpj}`, 40, 48, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold')
      .text('RELATÓRIO DE DESPESAS', 40, 65, { align: 'center' });

    let y = 115;
    doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold')
      .text(`Condomínio de: ${formatarData(parseInt(mes), parseInt(ano))}`, 40, y, { align: 'center' });

    y = 150;

    // Cabeçalho da tabela de despesas
    doc.rect(40, y, 515, 20).fill('#FFEBEE');
    doc.fillColor('#D32F2F').fontSize(9).font('Helvetica-Bold')
      .text('Descrição', 45, y + 6)
      .text('Total', 410, y + 6, { width: 80, align: 'right' })
      .text('Por Apto', 495, y + 6, { width: 55, align: 'right' });
    y += 20;

    let totalDespesas = 0;

    // Despesas com linhas alternadas
    despesasResult.rows.forEach((despesa: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#FFF5F5';
      doc.rect(40, y, 515, 18).fill(bgColor);

      const valor = parseFloat(despesa.valor);
      const valorPorApto = parseFloat(despesa.valor_por_apto);
      totalDespesas += valor;

      doc.fillColor('#333333').fontSize(8).font('Helvetica')
        .text(despesa.descricao.substring(0, 55), 45, y + 5, { width: 360 })
        .font('Helvetica-Bold')
        .text(formatarMoeda(valor), 410, y + 5, { width: 80, align: 'right' })
        .text(formatarMoeda(valorPorApto), 495, y + 5, { width: 55, align: 'right' });

      y += 18;

      // Nova página se necessário
      if (y > 730) {
        doc.addPage();
        y = 40;
      }
    });

    // Total das despesas
    y += 5;
    doc.rect(40, y, 515, 22).fill('#FFCDD2');
    doc.fillColor('#D32F2F').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL GERAL:', 45, y + 7)
      .text(formatarMoeda(totalDespesas), 410, y + 7, { width: 80, align: 'right' })
      .text(formatarMoeda(totalDespesas / 6), 495, y + 7, { width: 55, align: 'right' });

    // Rodapé
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de despesas:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório de despesas' });
  }
};

// Relatório de Consumo de Gás (12 meses)
export const gerarRelatorioGas = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leituras_gas
       ORDER BY ano DESC, mes DESC, apartamento
       LIMIT 72`
    );

    // Buscar dados do condomínio
    const dadosCondominio = await buscarDadosCondominio();

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-gas-12meses.pdf');

    doc.pipe(res);

    // ============================================
    // CABEÇALHO PRINCIPAL
    // ============================================
    doc.rect(0, 0, 842, 100).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`CNPJ: ${dadosCondominio.cnpj}`, 40, 48, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold')
      .text('RELATÓRIO DE CONSUMO DE GÁS - ÚLTIMOS 12 MESES', 40, 65, { align: 'center' });

    let y = 130;

    // Organizar dados por período
    const periodos: any = {};

    result.rows.forEach((leitura: any) => {
      const chave = `${leitura.ano}-${leitura.mes.toString().padStart(2, '0')}`;
      if (!periodos[chave]) {
        periodos[chave] = {
          mes: leitura.mes,
          ano: leitura.ano,
          leituras: []
        };
      }
      periodos[chave].leituras.push(leitura);
    });

    // Criar tabela para cada período
    Object.values(periodos).forEach((periodo: any, index: number) => {
      // Nova página a cada 4 períodos
      if (index > 0 && index % 4 === 0) {
        doc.addPage();
        y = 40;
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1565C0')
        .text(formatarData(periodo.mes, periodo.ano), 40, y);
      y += 20;

      // Cabeçalho da tabela
      doc.rect(40, y, 760, 20).fill('#E8F5E9');
      doc.fillColor('#2E7D32').fontSize(9).font('Helvetica-Bold')
        .text('Apto', 45, y + 6)
        .text('Leitura Anterior', 120, y + 6, { width: 100, align: 'right' })
        .text('Leitura Atual', 230, y + 6, { width: 100, align: 'right' })
        .text('Consumo (m³)', 340, y + 6, { width: 100, align: 'right' })
        .text('Valor', 680, y + 6, { width: 120, align: 'right' });
      y += 20;

      periodo.leituras.forEach((leitura: any, idx: number) => {
        const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F1F8E9';
        doc.rect(40, y, 760, 18).fill(bgColor);

        const leituraAnterior = leitura.leitura_anterior != null ? parseFloat(leitura.leitura_anterior).toFixed(3) : 'N/A';
        const leituraAtual = leitura.leitura_atual != null ? parseFloat(leitura.leitura_atual).toFixed(3) : 'N/A';
        const consumo = leitura.consumo != null ? parseFloat(leitura.consumo).toFixed(3) : 'N/A';
        const valorTotal = leitura.valor_total ? formatarMoeda(parseFloat(leitura.valor_total)) : 'N/A';

        doc.fillColor('#333333').fontSize(8).font('Helvetica')
          .text(leitura.apartamento, 45, y + 5)
          .text(leituraAnterior, 120, y + 5, { width: 100, align: 'right' })
          .text(leituraAtual, 230, y + 5, { width: 100, align: 'right' })
          .text(consumo, 340, y + 5, { width: 100, align: 'right' })
          .font('Helvetica-Bold')
          .text(valorTotal, 680, y + 5, { width: 120, align: 'right' });

        y += 18;
      });

      y += 25;
    });

    // Rodapé
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 550, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de gás:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório de gás' });
  }
};

// Relatório de Configurações
export const gerarRelatorioConfiguracoes = async (req: Request, res: Response) => {
  try {
    const dadosCondominio = await buscarDadosCondominio();

    // Buscar todas as configurações
    const [configResult, condominosResult, emailsResult, cnpjResult] = await Promise.all([
      pool.query('SELECT * FROM configuracoes ORDER BY chave'),
      pool.query('SELECT * FROM condominos ORDER BY apartamento'),
      pool.query('SELECT * FROM emails_permitidos ORDER BY apartamento'),
      pool.query("SELECT valor FROM configuracoes WHERE chave = 'cnpj_condominio'")
    ]);

    const cnpj = cnpjResult.rows[0]?.valor || '49.936.617/0001-02';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-configuracoes.pdf');

    doc.pipe(res);

    // ============================================
    // CABEÇALHO PRINCIPAL
    // ============================================
    doc.rect(0, 0, 595, 100).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`CNPJ: ${cnpj}`, 40, 48, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold')
      .text('RELATÓRIO DE CONFIGURAÇÕES', 40, 65, { align: 'center' });

    let y = 130;

    // ============================================
    // 1. CADASTRO DO CONDOMÍNIO
    // ============================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('1. CADASTRO DO CONDOMÍNIO', 40, y);
    y += 25;

    const dadosCadastro = {
      nome: configResult.rows.find((c: any) => c.chave === 'cond_nome')?.valor || 'N/C',
      cnpj: configResult.rows.find((c: any) => c.chave === 'cnpj_condominio')?.valor || 'N/C',
      endereco: configResult.rows.find((c: any) => c.chave === 'cond_endereco')?.valor || 'N/C',
      numero: configResult.rows.find((c: any) => c.chave === 'cond_numero')?.valor || '',
      complemento: configResult.rows.find((c: any) => c.chave === 'cond_complemento')?.valor || '',
      bairro: configResult.rows.find((c: any) => c.chave === 'cond_bairro')?.valor || 'N/C',
      cidade: configResult.rows.find((c: any) => c.chave === 'cond_cidade')?.valor || 'N/C',
      estado: configResult.rows.find((c: any) => c.chave === 'cond_estado')?.valor || 'N/C',
      cep: configResult.rows.find((c: any) => c.chave === 'cond_cep')?.valor || 'N/C',
      nomeSindico: configResult.rows.find((c: any) => c.chave === 'cond_nome_sindico')?.valor || 'N/C',
      telSindico: configResult.rows.find((c: any) => c.chave === 'cond_tel_sindico')?.valor || 'N/C',
      emailCondominio: configResult.rows.find((c: any) => c.chave === 'cond_email_condominio')?.valor || 'N/C',
      emailSindico: configResult.rows.find((c: any) => c.chave === 'cond_email_sindico')?.valor || 'N/C'
    };

    const enderecoCompleto = `${dadosCadastro.endereco}, ${dadosCadastro.numero}${dadosCadastro.complemento ? ' - ' + dadosCadastro.complemento : ''} - ${dadosCadastro.bairro}`;
    const cidadeEstadoCep = `${dadosCadastro.cidade}/${dadosCadastro.estado} - CEP: ${dadosCadastro.cep}`;

    doc.rect(40, y, 515, 140).fill('#E3F2FD');
    y += 10;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Nome:', 50, y);
    doc.fillColor('#333333').fontSize(10).font('Helvetica')
      .text(dadosCadastro.nome, 150, y);
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('CNPJ:', 50, y);
    doc.fillColor('#333333').fontSize(10).font('Helvetica')
      .text(dadosCadastro.cnpj, 150, y);
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Endereço:', 50, y);
    doc.fillColor('#333333').fontSize(9).font('Helvetica')
      .text(enderecoCompleto, 150, y, { width: 400 });
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Cidade/UF:', 50, y);
    doc.fillColor('#333333').fontSize(10).font('Helvetica')
      .text(cidadeEstadoCep, 150, y);
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Síndico:', 50, y);
    doc.fillColor('#333333').fontSize(10).font('Helvetica')
      .text(dadosCadastro.nomeSindico, 150, y);
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Tel. Síndico:', 50, y);
    doc.fillColor('#333333').fontSize(10).font('Helvetica')
      .text(dadosCadastro.telSindico, 150, y);
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Email Cond.:', 50, y);
    doc.fillColor('#333333').fontSize(9).font('Helvetica')
      .text(dadosCadastro.emailCondominio, 150, y);
    y += 18;

    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Email Síndico:', 50, y);
    doc.fillColor('#333333').fontSize(9).font('Helvetica')
      .text(dadosCondominio.emailSindico, 150, y);
    y += 30;

    // ============================================
    // 2. FUNDO DE RESERVA
    // ============================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('2. FUNDO DE RESERVA', 40, y);
    y += 25;

    const fundoReservaConfig = configResult.rows.filter((c: any) =>
      c.chave.includes('fundo_reserva')
    );

    doc.rect(40, y, 515, 20).fill('#E3F2FD');
    doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
      .text('Configuração', 45, y + 6)
      .text('Valor', 400, y + 6, { width: 145, align: 'right' });
    y += 20;

    fundoReservaConfig.forEach((config: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(40, y, 515, 20).fill(bgColor);

      const descricao = config.chave === 'fundo_reserva_percentual' ? 'Percentual sobre condomínio' : 'Valor fixo mensal';
      const valor = config.chave === 'fundo_reserva_percentual' ? `${config.valor}%` : formatarMoeda(parseFloat(config.valor));

      doc.fillColor('#333333').fontSize(9).font('Helvetica')
        .text(descricao, 45, y + 6)
        .font('Helvetica-Bold')
        .text(valor, 400, y + 6, { width: 145, align: 'right' });

      y += 20;
    });

    y += 30;

    // ============================================
    // 3. CONDÔMINOS
    // ============================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('3. CONDÔMINOS CADASTRADOS', 40, y);
    y += 25;

    doc.rect(40, y, 515, 20).fill('#E3F2FD');
    doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
      .text('Apto', 45, y + 6)
      .text('Proprietário', 90, y + 6)
      .text('Morador', 230, y + 6)
      .text('Telefone', 370, y + 6)
      .text('Email', 460, y + 6);
    y += 20;

    condominosResult.rows.forEach((cond: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(40, y, 515, 20).fill(bgColor);

      doc.fillColor('#333333').fontSize(8).font('Helvetica')
        .text(cond.apartamento, 45, y + 6)
        .text((cond.nome_proprietario || 'N/C').substring(0, 20), 90, y + 6)
        .text((cond.nome_morador || '-').substring(0, 20), 230, y + 6)
        .text(cond.telefone || '-', 370, y + 6)
        .text((cond.email || '-').substring(0, 15), 460, y + 6);

      y += 20;

      // Nova página se necessário
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
    });

    y += 30;

    // ============================================
    // 4. EMAILS PERMITIDOS
    // ============================================
    if (y > 600) {
      doc.addPage();
      y = 40;
    }

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('4. EMAILS PERMITIDOS PARA REGISTRO', 40, y);
    y += 25;

    doc.rect(40, y, 515, 20).fill('#E3F2FD');
    doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
      .text('Email', 45, y + 6)
      .text('Apartamento', 300, y + 6)
      .text('Status', 450, y + 6);
    y += 20;

    emailsResult.rows.forEach((email: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(40, y, 515, 20).fill(bgColor);

      const status = email.usado ? 'Usado' : 'Disponível';
      const statusColor = email.usado ? '#999999' : '#2E7D32';

      doc.fillColor('#333333').fontSize(8).font('Helvetica')
        .text(email.email.substring(0, 40), 45, y + 6)
        .text(email.apartamento, 300, y + 6)
        .fillColor(statusColor).font('Helvetica-Bold')
        .text(status, 450, y + 6);

      y += 20;

      // Nova página se necessário
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
    });

    // Rodapé
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de configurações:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório de configurações' });
  }
};

// Manter a função de despesas parceladas para compatibilidade (redireciona para configurações)
export const gerarRelatorioDespesasParceladas = gerarRelatorioConfiguracoes;

// Relatório de Histórico por Apartamento (12 meses)
export const gerarRelatorioHistoricoApartamento = async (req: Request, res: Response) => {
  try {
    const dadosCondominio = await buscarDadosCondominio();

    // Buscar todos os apartamentos
    const condominosResult = await pool.query(
      'SELECT * FROM condominos ORDER BY apartamento'
    );

    // Buscar CNPJ
    const cnpjResult = await pool.query(
      "SELECT valor FROM configuracoes WHERE chave = 'cnpj_condominio'"
    );
    const cnpj = cnpjResult.rows[0]?.valor || '49.936.617/0001-02';

    // Buscar configuração do fundo de reserva
    const configResult = await pool.query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')"
    );
    const config: { [key: string]: string } = {};
    configResult.rows.forEach(row => { config[row.chave] = row.valor; });

    const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
    const percentual = parseFloat(config.fundo_reserva_percentual || '10');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=historico-apartamentos-12meses.pdf');

    doc.pipe(res);

    // Para cada apartamento, criar uma página
    for (const condomino of condominosResult.rows) {
      const apartamento = condomino.apartamento;

      // Buscar últimos 12 meses de despesas do condomínio
      const mesesResult = await pool.query(
        `SELECT DISTINCT mes, ano
         FROM despesas_condominio
         ORDER BY ano DESC, mes DESC
         LIMIT 12`
      );

      // Para cada mês, calcular os valores
      const historico = [];
      for (const mesAno of mesesResult.rows) {
        const { mes, ano } = mesAno;

        // Buscar total de despesas do condomínio
        const despesasResult = await pool.query(
          `SELECT SUM(valor) as total_despesas
           FROM despesas_condominio
           WHERE mes = $1 AND ano = $2`,
          [mes, ano]
        );

        const totalDespesas = parseFloat(despesasResult.rows[0]?.total_despesas || '0');
        const valorCondominio = totalDespesas / 6;

        // Buscar gás do apartamento
        const gasResult = await pool.query(
          `SELECT valor_total
           FROM leituras_gas
           WHERE mes = $1 AND ano = $2 AND apartamento = $3`,
          [mes, ano, apartamento]
        );

        const valorGas = parseFloat(gasResult.rows[0]?.valor_total || '0');

        historico.push({
          mes,
          ano,
          valor_condominio: valorCondominio,
          valor_gas: valorGas
        });
      }

      // ============================================
      // CABEÇALHO
      // ============================================
      doc.rect(0, 0, 595, 100).fill('#1565C0');
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
        .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text(`CNPJ: ${cnpj}`, 40, 48, { align: 'center' });
      doc.fontSize(16).font('Helvetica-Bold')
        .text('HISTÓRICO DE COBRANÇAS - 12 MESES', 40, 65, { align: 'center' });

      let y = 120;

      // Informações do apartamento
      doc.rect(40, y, 515, 50).fill('#E3F2FD');
      doc.rect(40, y, 515, 3).fill('#1565C0');

      doc.fillColor('#1565C0').fontSize(12).font('Helvetica-Bold')
        .text(`Apartamento: ${apartamento}`, 50, y + 12);

      doc.fillColor('#333333').fontSize(10).font('Helvetica')
        .text(`Proprietário: ${condomino.nome_proprietario || 'Não cadastrado'}`, 50, y + 28);

      if (condomino.nome_morador) {
        doc.text(`Morador: ${condomino.nome_morador}`, 300, y + 28);
      }

      y += 65;

      // ============================================
      // TABELA DE HISTÓRICO
      // ============================================
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1565C0')
        .text('Histórico de Cobranças', 40, y);
      y += 20;

      // Cabeçalho da tabela
      doc.rect(40, y, 515, 22).fill('#BBDEFB');
      doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
        .text('Mês/Ano', 45, y + 7)
        .text('Cond.+Água', 160, y + 7, { width: 75, align: 'right' })
        .text('F. Reserva', 240, y + 7, { width: 75, align: 'right' })
        .text('Gás', 320, y + 7, { width: 75, align: 'right' })
        .text('Total', 450, y + 7, { width: 100, align: 'right' });
      y += 22;

      let totalGeralCondominio = 0;
      let totalGeralFundoReserva = 0;
      let totalGeralGas = 0;
      let totalGeralTudo = 0;

      // Verificar se há registros
      if (historico.length === 0) {
        doc.fillColor('#666666').fontSize(10).font('Helvetica')
          .text('Nenhum registro encontrado para este apartamento.', 45, y + 10);
        y += 30;
      } else {
        // Linhas do histórico
        historico.forEach((registro: any, index: number) => {
          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
          doc.rect(40, y, 515, 20).fill(bgColor);

          const mesAno = `${formatarData(registro.mes, registro.ano)}`;
          const valorCondominio = Number(registro.valor_condominio) || 0;
          const valorGas = Number(registro.valor_gas) || 0;

          // Calcular fundo de reserva para este mês
          const fundoReserva = valorFixo > 0 ? valorFixo : valorCondominio * (percentual / 100);

          const total = valorCondominio + fundoReserva + valorGas;

          totalGeralCondominio += valorCondominio;
          totalGeralFundoReserva += fundoReserva;
          totalGeralGas += valorGas;
          totalGeralTudo += total;

          doc.fillColor('#333333').fontSize(9).font('Helvetica')
            .text(mesAno, 45, y + 6)
            .font('Helvetica-Bold')
            .text(formatarMoeda(valorCondominio), 160, y + 6, { width: 75, align: 'right' })
            .text(formatarMoeda(fundoReserva), 240, y + 6, { width: 75, align: 'right' })
            .text(formatarMoeda(valorGas), 320, y + 6, { width: 75, align: 'right' })
            .fontSize(10)
            .text(formatarMoeda(total), 450, y + 6, { width: 100, align: 'right' });

          y += 20;
        });
      }

      // Linha de totais (só mostrar se houver registros)
      if (historico.length > 0) {
        y += 5;
        doc.rect(40, y, 515, 24).fill('#1565C0');
        doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
          .text('TOTAL (12 meses):', 45, y + 8)
          .text(formatarMoeda(totalGeralCondominio), 160, y + 8, { width: 75, align: 'right' })
          .text(formatarMoeda(totalGeralFundoReserva), 240, y + 8, { width: 75, align: 'right' })
          .text(formatarMoeda(totalGeralGas), 320, y + 8, { width: 75, align: 'right' })
          .fontSize(11)
          .text(formatarMoeda(totalGeralTudo), 450, y + 8, { width: 100, align: 'right' });

        y += 40;
      }

      // Informação sobre fundo de reserva
      doc.rect(40, y, 515, 35).fill('#E3F2FD');
      doc.fillColor('#666666').fontSize(8).font('Helvetica')
        .text(
          valorFixo > 0
            ? `Fundo de Reserva: Valor fixo mensal de ${formatarMoeda(valorFixo)}`
            : `Fundo de Reserva: ${percentual}% sobre o valor do condomínio`,
          50, y + 12
        );

      // Rodapé
      doc.fillColor('#666666').fontSize(8).font('Helvetica')
        .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

      // Adicionar nova página para o próximo apartamento (exceto no último)
      if (apartamento !== condominosResult.rows[condominosResult.rows.length - 1].apartamento) {
        doc.addPage();
      }
    }

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de histórico por apartamento:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório de histórico por apartamento' });
  }
};

// Relatório de Devedores
export const gerarRelatorioDevedores = async (req: Request, res: Response) => {
  try {
    const dadosCondominio = await buscarDadosCondominio();

    const result = await pool.query(
      `SELECT * FROM pagamentos_moradores
       WHERE pago = false
       ORDER BY ano DESC, mes DESC, apartamento`
    );

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-devedores.pdf');

    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).text(dadosCondominio.nome, { align: 'center' });
    doc.fontSize(16).text('Relatório de Devedores', { align: 'center' });
    doc.moveDown(2);

    if (result.rows.length === 0) {
      doc.fontSize(12).text('Não há débitos pendentes.', { align: 'center' });
    } else {
      // Agrupar por apartamento
      const devedoresPorApto: any = {};

      result.rows.forEach((pagamento: any) => {
        if (!devedoresPorApto[pagamento.apartamento]) {
          devedoresPorApto[pagamento.apartamento] = [];
        }
        devedoresPorApto[pagamento.apartamento].push(pagamento);
      });

      Object.keys(devedoresPorApto).sort().forEach((apto: string) => {
        const debitos = devedoresPorApto[apto];
        const totalDevido = debitos.reduce((sum: number, d: any) => sum + parseFloat(d.valor_total), 0);

        doc.fontSize(14).text(`Apartamento ${apto}`, { underline: true });
        doc.moveDown();

        debitos.forEach((debito: any) => {
          doc.fontSize(10).text(formatarData(debito.mes, debito.ano), { continued: true });
          doc.text(` - ${formatarMoeda(parseFloat(debito.valor_total))}`, { align: 'right' });
        });

        doc.moveDown();
        doc.fillColor('red').fontSize(12).text(`Total devido: ${formatarMoeda(totalDevido)}`);
        doc.fillColor('#000000').moveDown(2);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório de devedores:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório de devedores' });
  }
};

// Relatório Completo para o Síndico
export const gerarRelatorioSindico = async (req: Request, res: Response) => {
  try {
    const dadosCondominio = await buscarDadosCondominio();

    const { mes, ano } = req.params;

    // Buscar todas as informações necessárias
    // Calcular mês e ano anterior para buscar última data de transação
    const mesAnteriorNum = parseInt(mes) === 1 ? 12 : parseInt(mes) - 1;
    const anoAnteriorNum = parseInt(mes) === 1 ? parseInt(ano) - 1 : parseInt(ano);

    const [saldoResult, transacoesResult, despesasResult, gasResult, condominosResult, dataInicialResult, dataFinalResult] = await Promise.all([
      pool.query('SELECT * FROM banco_saldo WHERE mes = $1 AND ano = $2', [mes, ano]),
      pool.query(
        `SELECT bt.*, cd.nome as categoria_nome
         FROM banco_transacoes bt
         LEFT JOIN categorias_despesas cd ON bt.categoria_id = cd.id
         WHERE bt.mes = $1 AND bt.ano = $2
         ORDER BY bt.data_transacao, bt.criado_em`,
        [mes, ano]
      ),
      pool.query(
        `SELECT dc.*, cd.nome as categoria_nome, cd.ordem
         FROM despesas_condominio dc
         LEFT JOIN categorias_despesas cd ON dc.categoria_id = cd.id
         WHERE dc.mes = $1 AND dc.ano = $2
         ORDER BY cd.ordem, dc.descricao`,
        [mes, ano]
      ),
      pool.query(
        `SELECT * FROM leituras_gas WHERE mes = $1 AND ano = $2 ORDER BY apartamento`,
        [mes, ano]
      ),
      pool.query(
        `SELECT apartamento, nome_proprietario as nome, email FROM condominos ORDER BY apartamento`,
        []
      ),
      // Buscar última data de transação do mês anterior
      pool.query(
        `SELECT MAX(data_transacao) as ultima_data
         FROM banco_transacoes
         WHERE mes = $1 AND ano = $2`,
        [mesAnteriorNum, anoAnteriorNum]
      ),
      // Buscar última data de transação do mês atual
      pool.query(
        `SELECT MAX(data_transacao) as ultima_data
         FROM banco_transacoes
         WHERE mes = $1 AND ano = $2`,
        [mes, ano]
      )
    ]);

    if (saldoResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Dados bancários não encontrados para este período' });
    }

    const saldo = saldoResult.rows[0];
    const condominos = condominosResult.rows;

    // Criar PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-sindico-${mes}-${ano}.pdf`);

    doc.pipe(res);

    // Variável para controlar o número de páginas
    let numeroPagina = 1;
    const totalPaginas = 3; // Estimativa inicial

    // Buscar dados do síndico (apartamento 5)
    const sindico = condominos.find((c: any) => c.apartamento === '05');

    // Buscar CNPJ das configurações
    const cnpjResult = await pool.query(
      "SELECT valor FROM configuracoes WHERE chave = 'cnpj_condominio'"
    );
    const cnpj = cnpjResult.rows[0]?.valor || '49.936.617/0001-02';

    // Calcular período das transações
    let dataInicio = '';
    let dataFim = '';
    if (transacoesResult.rows.length > 0) {
      const datas = transacoesResult.rows.map((t: any) => new Date(t.data_transacao));
      dataInicio = new Date(Math.min(...datas.map(d => d.getTime()))).toLocaleDateString('pt-BR');
      dataFim = new Date(Math.max(...datas.map(d => d.getTime()))).toLocaleDateString('pt-BR');
    }

    // Calcular saldo inicial correto (pegar saldo final do mês anterior)
    let saldoInicial = parseFloat(saldo.saldo_inicial);
    const mesAnterior = parseInt(mes) === 1 ? 12 : parseInt(mes) - 1;
    const anoAnterior = parseInt(mes) === 1 ? parseInt(ano) - 1 : parseInt(ano);

    const saldoAnteriorResult = await pool.query(
      'SELECT saldo_final FROM banco_saldo WHERE mes = $1 AND ano = $2',
      [mesAnterior, anoAnterior]
    );

    if (saldoAnteriorResult.rows.length > 0) {
      saldoInicial = parseFloat(saldoAnteriorResult.rows[0].saldo_final);
    }

    // Obter datas das últimas transações para os saldos
    const dataUltimoDiaMesAnterior = dataInicialResult.rows[0]?.ultima_data
      ? new Date(dataInicialResult.rows[0].ultima_data).toLocaleDateString('pt-BR')
      : new Date(anoAnteriorNum, mesAnteriorNum, 0).toLocaleDateString('pt-BR'); // fallback para último dia do mês

    const dataUltimoDiaMesAtual = dataFinalResult.rows[0]?.ultima_data
      ? new Date(dataFinalResult.rows[0].ultima_data).toLocaleDateString('pt-BR')
      : new Date(parseInt(ano), parseInt(mes), 0).toLocaleDateString('pt-BR'); // fallback para último dia do mês

    // ============================================
    // CABEÇALHO PRINCIPAL
    // ============================================
    doc.rect(0, 0, 595, 100).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`CNPJ: ${cnpj}`, 40, 48, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold')
      .text('RELATÓRIO MENSAL PARA O SÍNDICO', 40, 65, { align: 'center' });
    if (sindico) {
      doc.fontSize(10).font('Helvetica')
        .text(`Síndico: ${sindico.nome} - Apto ${sindico.apartamento}`, 40, 88, { align: 'center' });
    }

    let y = 115;
    doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold')
      .text(`Condomínio de: ${formatarData(parseInt(mes), parseInt(ano))}`, 40, y, { align: 'center' });

    y = 135;

    // ============================================
    // PÁGINA 1: RESUMO A PAGAR POR APARTAMENTO
    // ============================================

    // Calcular total de despesas primeiro
    let totalDespesas = 0;
    despesasResult.rows.forEach((despesa: any) => {
      totalDespesas += parseFloat(despesa.valor);
    });

    const valorCondominioPorApto = totalDespesas / 6;

    // Buscar configuração do fundo de reserva
    const configResult = await pool.query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')"
    );
    const config: { [key: string]: string } = {};
    configResult.rows.forEach(row => { config[row.chave] = row.valor; });

    const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
    const percentual = parseFloat(config.fundo_reserva_percentual || '10');
    const fundoReserva = valorFixo > 0 ? valorFixo : valorCondominioPorApto * (percentual / 100);

    let totalGeralCondominio = 0;
    let totalGeralFundoReserva = 0;
    let totalGeralGas = 0;
    let totalGeralTudo = 0;

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('1. RESUMO A PAGAR POR APARTAMENTO', 40, y, { align: 'center' });
    y += 25;

    // Cabeçalho do resumo
    doc.rect(40, y, 515, 20).fill('#E3F2FD');
    doc.fillColor('#1565C0').fontSize(8).font('Helvetica-Bold')
      .text('Apto', 45, y + 6)
      .text('Proprietário', 80, y + 6)
      .text('Email', 200, y + 6)
      .text('Cond.+Água', 285, y + 6, { width: 60, align: 'right' })
      .text('F.Res.', 350, y + 6, { width: 50, align: 'right' })
      .text('Gás', 405, y + 6, { width: 50, align: 'right' })
      .text('Total', 485, y + 6, { width: 65, align: 'right' });
    y += 20;

    // Resumo por apartamento com linhas alternadas
    for (let i = 1; i <= 6; i++) {
      const apto = i.toString().padStart(2, '0');
      const condomino = condominos.find((c: any) => c.apartamento === apto);
      const gasApto = gasResult.rows.find((g: any) => g.apartamento === apto);
      const valorGas = gasApto?.valor_total ? parseFloat(gasApto.valor_total) : 0;
      const total = valorCondominioPorApto + fundoReserva + valorGas;

      totalGeralCondominio += valorCondominioPorApto;
      totalGeralFundoReserva += fundoReserva;
      totalGeralGas += valorGas;
      totalGeralTudo += total;

      const bgColor = (i - 1) % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(40, y, 515, 22).fill(bgColor);

      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold')
        .text(`${apto}`, 45, y + 7);

      if (condomino) {
        doc.fontSize(8).font('Helvetica')
          .text(condomino.nome?.substring(0, 20) || 'Não cadastrado', 80, y + 7)
          .text(condomino.email?.substring(0, 22) || 'Não cadastrado', 200, y + 7);
      }

      doc.fontSize(9).font('Helvetica-Bold')
        .text(formatarMoeda(valorCondominioPorApto), 285, y + 7, { width: 60, align: 'right' })
        .text(formatarMoeda(fundoReserva), 350, y + 7, { width: 50, align: 'right' })
        .text(formatarMoeda(valorGas), 405, y + 7, { width: 50, align: 'right' })
        .text(formatarMoeda(total), 485, y + 7, { width: 65, align: 'right' });

      y += 22;
    }

    // Linha de totais
    y += 5;
    doc.rect(40, y, 515, 22).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL GERAL:', 45, y + 7)
      .text(formatarMoeda(totalGeralCondominio), 285, y + 7, { width: 60, align: 'right' })
      .text(formatarMoeda(totalGeralFundoReserva), 350, y + 7, { width: 50, align: 'right' })
      .text(formatarMoeda(totalGeralGas), 405, y + 7, { width: 50, align: 'right' })
      .text(formatarMoeda(totalGeralTudo), 485, y + 7, { width: 65, align: 'right' });

    y += 45;

    // Informação sobre fundo de reserva
    if (fundoReserva > 0) {
      doc.rect(40, y, 515, 45).fill('#E3F2FD');
      doc.rect(40, y, 515, 3).fill('#1565C0');
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold')
        .text('Informação - Fundo de Reserva', 50, y + 12);
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
        .text(
          valorFixo > 0
            ? `Valor fixo mensal: ${formatarMoeda(fundoReserva)}`
            : `${percentual}% sobre o valor do condomínio: ${formatarMoeda(fundoReserva)}`,
          50, y + 28
        );
    }

    // Rodapé página 1
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    // ============================================
    // PÁGINA 2: DETALHAMENTO
    // ============================================
    numeroPagina++;
    doc.addPage();
    y = 40;

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1565C0')
      .text('DETALHAMENTO', 40, y, { align: 'center' });
    y += 30;

    // ============================================
    // SEÇÃO 2: DESPESAS DO CONDOMÍNIO
    // ============================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('2. DESPESAS DO CONDOMÍNIO', 40, y);
    y += 25;

    // Cabeçalho da tabela de despesas
    doc.rect(40, y, 515, 20).fill('#FFEBEE');
    doc.fillColor('#D32F2F').fontSize(9).font('Helvetica-Bold')
      .text('Descrição', 45, y + 6)
      .text('Total', 410, y + 6, { width: 80, align: 'right' })
      .text('Por Apto', 495, y + 6, { width: 55, align: 'right' });
    y += 20;

    // Despesas com linhas alternadas
    despesasResult.rows.forEach((despesa: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#FFF5F5';
      doc.rect(40, y, 515, 18).fill(bgColor);

      const valor = parseFloat(despesa.valor);
      const valorPorApto = parseFloat(despesa.valor_por_apto);

      doc.fillColor('#333333').fontSize(8).font('Helvetica')
        .text(despesa.descricao.substring(0, 55), 45, y + 5, { width: 360 })
        .font('Helvetica-Bold')
        .text(formatarMoeda(valor), 410, y + 5, { width: 80, align: 'right' })
        .text(formatarMoeda(valorPorApto), 495, y + 5, { width: 55, align: 'right' });

      y += 18;

      // Nova página se necessário
      if (y > 730) {
        numeroPagina++;
        doc.addPage();
        y = 40;
      }
    });

    // Total das despesas
    y += 5;
    doc.rect(40, y, 515, 22).fill('#FFCDD2');
    doc.fillColor('#D32F2F').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL GERAL:', 45, y + 7)
      .text(formatarMoeda(totalDespesas), 410, y + 7, { width: 80, align: 'right' })
      .text(formatarMoeda(totalDespesas / 6), 495, y + 7, { width: 55, align: 'right' });

    y += 40;

    // ============================================
    // SEÇÃO 3: CONSUMO DE GÁS (mesma página ou próxima)
    // ============================================
    if (y > 450) {
      numeroPagina++;
      doc.addPage();
      y = 40;
    }

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('3. CONSUMO DE GÁS', 40, y);
    y += 25;

    if (gasResult.rows.length > 0) {
      const valorM3 = parseFloat(gasResult.rows[0].valor_m3);

      doc.rect(40, y, 515, 18).fill('#E8F5E9');
      doc.fillColor('#2E7D32').fontSize(9).font('Helvetica-Bold')
        .text(`Valor do m³: ${formatarMoeda(valorM3)}`, 45, y + 5);
      y += 23;

      // Cabeçalho da tabela de gás
      doc.rect(40, y, 515, 20).fill('#C8E6C9');
      doc.fillColor('#2E7D32').fontSize(9).font('Helvetica-Bold')
        .text('Apto', 45, y + 6)
        .text('Leit. Ant.', 105, y + 6, { width: 65, align: 'right' })
        .text('Leit. Atual', 175, y + 6, { width: 65, align: 'right' })
        .text('Consumo (m³)', 245, y + 6, { width: 75, align: 'right' })
        .text('Valor', 470, y + 6, { width: 80, align: 'right' });
      y += 20;

      // Dados de gás com linhas alternadas
      gasResult.rows.forEach((gas: any, index: number) => {
        const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F1F8E9';
        doc.rect(40, y, 515, 18).fill(bgColor);

        const leituraAnterior = gas.leitura_anterior != null ? parseFloat(gas.leitura_anterior).toFixed(3) : 'N/A';
        const leituraAtual = gas.leitura_atual != null ? parseFloat(gas.leitura_atual).toFixed(3) : 'N/A';
        const consumo = gas.consumo != null ? parseFloat(gas.consumo).toFixed(3) : 'N/A';
        const valorTotal = gas.valor_total ? formatarMoeda(parseFloat(gas.valor_total)) : 'N/A';

        doc.fillColor('#333333').fontSize(8).font('Helvetica')
          .text(gas.apartamento, 45, y + 5)
          .text(leituraAnterior, 105, y + 5, { width: 65, align: 'right' })
          .text(leituraAtual, 175, y + 5, { width: 65, align: 'right' })
          .text(consumo, 245, y + 5, { width: 75, align: 'right' })
          .font('Helvetica-Bold')
          .text(valorTotal, 470, y + 5, { width: 80, align: 'right' });

        y += 18;
      });
    } else {
      doc.fillColor('#999999').fontSize(10).font('Helvetica')
        .text('Nenhuma leitura de gás registrada para este período.', 40, y);
    }

    // Rodapé da página de detalhamento
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    // ============================================
    // PÁGINA 3: EXTRATO BANCÁRIO
    // ============================================
    numeroPagina++;
    doc.addPage();
    y = 40;

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('4. EXTRATO BANCÁRIO', 40, y);
    y += 20;
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
      .text(`Período: ${dataInicio || formatarData(parseInt(mes), parseInt(ano))} a ${dataFim || formatarData(parseInt(mes), parseInt(ano))}`, 40, y);
    y += 25;

    // Saldo inicial com data
    doc.rect(40, y, 515, 22).fill('#E3F2FD');
    doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold')
      .text(`Saldo Inicial (${dataUltimoDiaMesAnterior}):`, 45, y + 7)
      .text(formatarMoeda(saldoInicial), 450, y + 7, { width: 100, align: 'right' });
    y += 27;

    // Cabeçalho da tabela de transações
    doc.rect(40, y, 515, 20).fill('#BBDEFB');
    doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
      .text('Data', 45, y + 6)
      .text('Tipo', 110, y + 6)
      .text('Descrição', 180, y + 6)
      .text('Valor', 510, y + 6);
    y += 20;

    let totalCreditos = 0;
    let totalDebitos = 0;

    // Transações com linhas alternadas
    transacoesResult.rows.forEach((transacao: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc.rect(40, y, 515, 18).fill(bgColor);

      const data = new Date(transacao.data_transacao).toLocaleDateString('pt-BR');
      const tipo = transacao.tipo === 'credito' ? 'Crédito' : 'Débito';
      const valor = parseFloat(transacao.valor);
      const corTipo = transacao.tipo === 'credito' ? '#2E7D32' : '#D32F2F';

      if (transacao.tipo === 'credito') {
        totalCreditos += valor;
      } else {
        totalDebitos += valor;
      }

      doc.fillColor('#333333').fontSize(8).font('Helvetica')
        .text(data, 45, y + 5)
        .fillColor(corTipo).font('Helvetica-Bold')
        .text(tipo, 110, y + 5)
        .fillColor('#333333').fontSize(8).font('Helvetica')
        .text(transacao.descricao.substring(0, 38), 180, y + 5, { width: 300 })
        .font('Helvetica-Bold')
        .text(formatarMoeda(valor), 490, y + 5, { width: 60, align: 'right' });

      y += 18;

      // Nova página se necessário
      if (y > 750) {
        numeroPagina++;
        doc.addPage();
        y = 40;
      }
    });

    // Totais do extrato
    y += 5;
    doc.rect(40, y, 515, 20).fill('#C8E6C9');
    doc.fillColor('#2E7D32').fontSize(9).font('Helvetica-Bold')
      .text('Total Créditos:', 45, y + 6)
      .text(formatarMoeda(totalCreditos), 490, y + 6, { width: 60, align: 'right' });
    y += 20;

    doc.rect(40, y, 515, 20).fill('#FFCDD2');
    doc.fillColor('#D32F2F').fontSize(9).font('Helvetica-Bold')
      .text('Total Débitos:', 45, y + 6)
      .text(formatarMoeda(totalDebitos), 490, y + 6, { width: 60, align: 'right' });
    y += 20;

    const saldoFinal = saldoInicial + totalCreditos - totalDebitos;
    doc.rect(40, y, 515, 22).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
      .text(`Saldo Final (${dataUltimoDiaMesAtual}):`, 45, y + 7)
      .text(formatarMoeda(saldoFinal), 490, y + 7, { width: 60, align: 'right' });

    // Rodapé página 3 (extrato bancário)
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório do síndico:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório do síndico' });
  }
};

// Relatório Mensal para Kondor Imóveis
export const gerarRelatorioKondor = async (req: Request, res: Response) => {
  try {
    const dadosCondominio = await buscarDadosCondominio();

    const { mes, ano } = req.params;

    // Buscar todas as informações necessárias
    const [despesasResult, gasResult, condominosResult] = await Promise.all([
      pool.query(
        `SELECT dc.*, cd.nome as categoria_nome, cd.ordem
         FROM despesas_condominio dc
         LEFT JOIN categorias_despesas cd ON dc.categoria_id = cd.id
         WHERE dc.mes = $1 AND dc.ano = $2
         ORDER BY cd.ordem, dc.descricao`,
        [mes, ano]
      ),
      pool.query(
        `SELECT * FROM leituras_gas WHERE mes = $1 AND ano = $2 ORDER BY apartamento`,
        [mes, ano]
      ),
      pool.query(
        `SELECT apartamento, nome_proprietario as nome, nome_morador, email FROM condominos ORDER BY apartamento`,
        []
      )
    ]);

    const condominos = condominosResult.rows;

    // Buscar CNPJ das configurações
    const cnpjResult = await pool.query(
      "SELECT valor FROM configuracoes WHERE chave = 'cnpj_condominio'"
    );
    const cnpj = cnpjResult.rows[0]?.valor || '49.936.617/0001-02';

    // Buscar configuração do fundo de reserva
    const configResult = await pool.query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('fundo_reserva_percentual', 'fundo_reserva_valor_fixo')"
    );
    const config: { [key: string]: string } = {};
    configResult.rows.forEach(row => { config[row.chave] = row.valor; });

    // Criar PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-kondor-${mes}-${ano}.pdf`);

    doc.pipe(res);

    // ============================================
    // CABEÇALHO PRINCIPAL (estilo similar ao síndico)
    // ============================================
    doc.rect(0, 0, 595, 100).fill('#1565C0'); // Azul igual ao síndico
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text(dadosCondominio.nome.toUpperCase(), 40, 20, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text(`CNPJ: ${cnpj}`, 40, 48, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold')
      .text('RELATÓRIO MENSAL PARA KONDOR IMÓVEIS', 40, 65, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text('Email: cpd@kondorimoveis.com.br', 40, 88, { align: 'center' });

    let y = 115;
    doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold')
      .text(`Condomínio de: ${formatarData(parseInt(mes), parseInt(ano))}`, 40, y, { align: 'center' });

    y = 135;

    // ============================================
    // PÁGINA 1: RESUMO DOS VALORES A COBRAR
    // ============================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('1. RESUMO DOS VALORES A COBRAR POR APARTAMENTO', 40, y, { align: 'center' });
    y += 25;

    // Calcular totais
    let totalDespesas = 0;
    despesasResult.rows.forEach((despesa: any) => {
      totalDespesas += parseFloat(despesa.valor);
    });

    const valorCondominioPorApto = totalDespesas / 6;

    // Buscar fundo de reserva
    const valorFixo = parseFloat(config.fundo_reserva_valor_fixo || '0');
    const percentual = parseFloat(config.fundo_reserva_percentual || '10');
    const fundoReserva = valorFixo > 0 ? valorFixo : valorCondominioPorApto * (percentual / 100);

    // Cabeçalho da tabela de resumo
    doc.rect(40, y, 515, 22).fill('#BBDEFB'); // Azul claro
    doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold')
      .text('Apto', 45, y + 7)
      .text('Proprietário', 75, y + 7)
      .text('Morador', 175, y + 7)
      .text('Cond.+Água', 260, y + 7, { width: 60, align: 'right' })
      .text('F.Res.', 325, y + 7, { width: 50, align: 'right' })
      .text('Gás', 380, y + 7, { width: 50, align: 'right' })
      .text('Total', 435, y + 7, { width: 50, align: 'right' })
      .text('Obs.', 490, y + 7, { width: 60, align: 'center' });
    y += 22;

    let totalGeralCondominio = 0;
    let totalGeralFundoReserva = 0;
    let totalGeralGas = 0;
    let totalGeralTudo = 0;

    // Resumo por apartamento com cores alternadas suaves
    for (let i = 1; i <= 6; i++) {
      const apto = i.toString().padStart(2, '0');
      const condomino = condominos.find((c: any) => c.apartamento === apto);
      const gasApto = gasResult.rows.find((g: any) => g.apartamento === apto);
      const valorGas = gasApto?.valor_total ? parseFloat(gasApto.valor_total) : 0;
      const total = valorCondominioPorApto + fundoReserva + valorGas;

      totalGeralCondominio += valorCondominioPorApto;
      totalGeralFundoReserva += fundoReserva;
      totalGeralGas += valorGas;
      totalGeralTudo += total;

      // Linhas alternadas suaves (sem destaque especial para Kondor)
      const isKondor = ['02', '03', '06'].includes(apto);
      const bgColor = (i - 1) % 2 === 0 ? '#FFFFFF' : '#F7FCFB';
      doc.rect(40, y, 515, 24).fill(bgColor);

      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold')
        .text(`${apto}`, 45, y + 8);

      if (condomino) {
        // Proprietário
        doc.fontSize(8).font('Helvetica')
          .text(condomino.nome?.substring(0, 18) || 'N/C', 75, y + 5);

        // Morador (se diferente do proprietário)
        const nomeMorador = condomino.nome_morador || condomino.nome || 'N/C';
        doc.fontSize(8).font('Helvetica')
          .text(nomeMorador.substring(0, 15), 175, y + 12);
      }

      doc.fillColor('#333333').fontSize(8).font('Helvetica-Bold')
        .text(formatarMoeda(valorCondominioPorApto), 260, y + 8, { width: 60, align: 'right' })
        .text(formatarMoeda(fundoReserva), 325, y + 8, { width: 50, align: 'right' })
        .text(formatarMoeda(valorGas), 380, y + 8, { width: 50, align: 'right' })
        .fontSize(9)
        .text(formatarMoeda(total), 435, y + 8, { width: 50, align: 'right' });

      // Adicionar observação para apartamentos da Kondor (somente texto)
      if (isKondor) {
        doc.fillColor('#333333').fontSize(7).font('Helvetica')
          .text('Adm.', 500, y + 6, { width: 50, align: 'center' })
          .text('Kondor', 490, y + 14, { width: 60, align: 'center' });
      }

      y += 24;
    }

    // Linha de totais
    y += 3;
    doc.rect(40, y, 515, 26).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL GERAL:', 45, y + 9)
      .text(formatarMoeda(totalGeralCondominio), 220, y + 9, { width: 100, align: 'right' })
      .text(formatarMoeda(totalGeralFundoReserva), 285, y + 9, { width: 90, align: 'right' })
      .text(formatarMoeda(totalGeralGas), 345, y + 9, { width: 85, align: 'right' })
      .fontSize(11)
      .text(formatarMoeda(totalGeralTudo), 400, y + 9, { width: 85, align: 'right' });

    y += 50;

    // Informação sobre fundo de reserva (ainda na página 1)
    if (fundoReserva > 0) {
      doc.rect(40, y, 515, 45).fill('#E3F2FD');
      doc.rect(40, y, 515, 3).fill('#1565C0');
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold')
        .text('Informação - Fundo de Reserva', 50, y + 12);
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
        .text(
          valorFixo > 0
            ? `Valor fixo mensal: ${formatarMoeda(fundoReserva)}`
            : `${percentual}% sobre o valor do condomínio: ${formatarMoeda(fundoReserva)}`,
          50, y + 28
        );
      y += 60;
    }

    // Rodapé página 1
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 750, { align: 'center' });

    // ============================================
    // PÁGINA 2: DETALHAMENTO DAS DESPESAS
    // ============================================
    doc.addPage();
    y = 40;

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('2. DETALHAMENTO DAS DESPESAS', 40, y, { align: 'center' });
    y += 25;

    // Cabeçalho da tabela de despesas
    doc.rect(40, y, 515, 22).fill('#BBDEFB');
    doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
      .text('Descrição', 50, y + 7)
      .text('Valor Total', 410, y + 7, { width: 90, align: 'right' })
      .text('Por Apto', 505, y + 7, { width: 45, align: 'right' });
    y += 22;

    // Despesas com linhas alternadas
    despesasResult.rows.forEach((despesa: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
      doc.rect(40, y, 515, 20).fill(bgColor);

      const valor = parseFloat(despesa.valor);
      const valorPorApto = parseFloat(despesa.valor_por_apto);

      doc.fillColor('#333333').fontSize(9).font('Helvetica')
        .text(despesa.descricao.substring(0, 60), 50, y + 6, { width: 350 })
        .font('Helvetica-Bold')
        .text(formatarMoeda(valor), 410, y + 6, { width: 90, align: 'right' })
        .text(formatarMoeda(valorPorApto), 505, y + 6, { width: 45, align: 'right' });

      y += 20;
    });

    // Total das despesas
    y += 3;
    doc.rect(40, y, 515, 24).fill('#1565C0');
    doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL DESPESAS:', 50, y + 7)
      .text(formatarMoeda(totalDespesas), 360, y + 7, { width: 140, align: 'right' })
      .text(formatarMoeda(valorCondominioPorApto), 470, y + 7, { width: 80, align: 'right' });

    y += 40;

    // ============================================
    // SEÇÃO 3: CONSUMO DE GÁS (mesma página 2)
    // ============================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0')
      .text('3. CONSUMO DE GÁS', 40, y, { align: 'center' });
    y += 25;

    if (gasResult.rows.length > 0) {
      const valorM3 = parseFloat(gasResult.rows[0].valor_m3);

      doc.rect(40, y, 515, 20).fill('#BBDEFB');
      doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
        .text(`Valor do m³: ${formatarMoeda(valorM3)}`, 50, y + 6);
      y += 25;

      // Cabeçalho da tabela de gás
      doc.rect(40, y, 515, 22).fill('#BBDEFB');
      doc.fillColor('#1565C0').fontSize(10).font('Helvetica-Bold')
        .text('Apto', 50, y + 7)
        .text('Leitura Anterior', 110, y + 7, { width: 85, align: 'right' })
        .text('Leitura Atual', 200, y + 7, { width: 85, align: 'right' })
        .text('Consumo (m³)', 290, y + 7, { width: 85, align: 'right' })
        .text('Valor Total', 480, y + 7, { width: 70, align: 'right' });
      y += 22;

      // Dados de gás com linhas alternadas
      gasResult.rows.forEach((gas: any, index: number) => {
        const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
        doc.rect(40, y, 515, 20).fill(bgColor);

        const leituraAnterior = gas.leitura_anterior != null ? parseFloat(gas.leitura_anterior).toFixed(3) : 'N/A';
        const leituraAtual = gas.leitura_atual != null ? parseFloat(gas.leitura_atual).toFixed(3) : 'N/A';
        const consumo = gas.consumo != null ? parseFloat(gas.consumo).toFixed(3) : 'N/A';
        const valorTotal = gas.valor_total ? formatarMoeda(parseFloat(gas.valor_total)) : 'N/A';

        doc.fillColor('#333333').fontSize(9).font('Helvetica')
          .text(gas.apartamento, 50, y + 6)
          .text(leituraAnterior, 110, y + 6, { width: 85, align: 'right' })
          .text(leituraAtual, 200, y + 6, { width: 85, align: 'right' })
          .text(consumo, 290, y + 6, { width: 85, align: 'right' })
          .font('Helvetica-Bold')
          .text(valorTotal, 480, y + 6, { width: 70, align: 'right' });

        y += 20;
      });

      // Total do gás
      y += 3;
      doc.rect(40, y, 515, 24).fill('#1565C0');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
        .text('TOTAL GÁS:', 50, y + 7)
        .text(formatarMoeda(totalGeralGas), 480, y + 7, { width: 70, align: 'right' });

    } else {
      doc.rect(40, y, 515, 40).fill('#E3F2FD');
      doc.fillColor('#999999').fontSize(10).font('Helvetica')
        .text('Nenhuma leitura de gás registrada para este período.', 50, y + 14, { align: 'center' });
    }

    y += 50;

    // ============================================
    // RESUMO GERAL (ainda na página 2)
    // ============================================

    // Box de resumo final (na página 2)
    doc.rect(40, y, 515, 100).fill('#E3F2FD');
    doc.rect(40, y, 515, 4).fill('#1565C0');

    doc.fillColor('#1565C0').fontSize(12).font('Helvetica-Bold')
      .text('RESUMO GERAL', 50, y + 12);

    y += 30;

    doc.fontSize(10).font('Helvetica')
      .fillColor('#333333')
      .text('Total de Despesas do Condomínio:', 60, y)
      .font('Helvetica-Bold')
      .text(formatarMoeda(totalGeralCondominio), 400, y, { width: 145, align: 'right' });

    y += 18;
    doc.font('Helvetica')
      .text('Total de Fundo de Reserva:', 60, y)
      .font('Helvetica-Bold')
      .text(formatarMoeda(totalGeralFundoReserva), 400, y, { width: 145, align: 'right' });

    y += 18;
    doc.font('Helvetica')
      .text('Total de Gás:', 60, y)
      .font('Helvetica-Bold')
      .text(formatarMoeda(totalGeralGas), 400, y, { width: 145, align: 'right' });

    y += 25;
    doc.rect(60, y, 490, 2).fill('#1565C0');
    y += 8;

    doc.fontSize(11).font('Helvetica-Bold')
      .fillColor('#333333')
      .text('VALOR TOTAL A COBRAR:', 60, y)
      .fillColor('#1565C0').fontSize(13)
      .text(formatarMoeda(totalGeralTudo), 400, y, { width: 145, align: 'right' });

    // Rodapé página 2
    doc.fillColor('#666666').fontSize(8).font('Helvetica')
      .text(`Kondor Imóveis - Email: cpd@kondorimoveis.com.br`, 40, 750, { align: 'center' })
      .text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 40, 765, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório Kondor:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório Kondor' });
  }
};
