import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Avatar,
  Chip,
  Paper,
  Divider,
  Stack,
  Fab,
  Tabs,
  Tab,
  Backdrop,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Drawer
} from '@mui/material';
import {
  Logout,
  Add,
  Delete,
  Download,
  Edit,
  CalendarMonth,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Receipt,
  AccountBalance,
  LocalFireDepartment,
  Email,
  Assessment,
  TrendingUp,
  AttachMoney,
  PictureAsPdf,
  People,
  Settings,
  CloudUpload,
  Backup,
  Restore,
  Security,
  Store,
  Build,
  Business,
  Savings,
  AccountBalanceWallet
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Fornecedores from './Fornecedores';
import MaoDeObra from './MaoDeObra';
import {
  DespesaCondominio,
  BancoTransacao,
  LeituraGas,
  EmailPermitido,
  ResumoMensal
} from '../types';

const DashboardAdmin: React.FC = () => {
  const { usuario, logout } = useAuth();
  const [secaoAtiva, setSecaoAtiva] = useState('visao-geral');
  // Inicializar com mês anterior
  const mesAtual = new Date();
  mesAtual.setMonth(mesAtual.getMonth() - 1); // Voltar 1 mês
  const [mes, setMes] = useState(mesAtual.getMonth() + 1);
  const [ano, setAno] = useState(mesAtual.getFullYear());

  // Estados
  const [despesas, setDespesas] = useState<DespesaCondominio[]>([]);
  const [transacoes, setTransacoes] = useState<BancoTransacao[]>([]);
  const [leituras, setLeituras] = useState<LeituraGas[]>([]);
  const [emailsPermitidos, setEmailsPermitidos] = useState<EmailPermitido[]>([]);
  const [resumo, setResumo] = useState<ResumoMensal[]>([]);
  const [saldo, setSaldo] = useState<any>(null);
  const [condominos, setCondominos] = useState<any[]>([]);
  const [configuracoes, setConfiguracoes] = useState<any>({});
  const [nomeCondominio, setNomeCondominio] = useState('Residencial Balek');
  const [atas, setAtas] = useState<any[]>([]);
  const [novaAta, setNovaAta] = useState({ data_reuniao: '', titulo: '', arquivo: null as File | null });

  // Dialogs
  const [dialogDespesa, setDialogDespesa] = useState(false);
  const [dialogTransacao, setDialogTransacao] = useState(false);
  const [dialogGas, setDialogGas] = useState(false);
  const [dialogEmail, setDialogEmail] = useState(false);
  const [dialogMudarMes, setDialogMudarMes] = useState(false);
  const [dialogNovoApartamento, setDialogNovoApartamento] = useState(false);
  const [dialogExcluirIntervalo, setDialogExcluirIntervalo] = useState(false);
  const [dialogSeguranca, setDialogSeguranca] = useState(false);
  const [senhaSeguranca, setSenhaSeguranca] = useState('');
  const [acaoSeguranca, setAcaoSeguranca] = useState<'backup' | 'restaurar' | ''>('');
  const [dialogRestaurar, setDialogRestaurar] = useState(false);
  const [backupsDisponiveis, setBackupsDisponiveis] = useState<any[]>([]);
  const [backupSelecionado, setBackupSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [transacaoParaMudar, setTransacaoParaMudar] = useState<any>(null);
  const [novoMesAno, setNovoMesAno] = useState({ mes: mes, ano: ano });
  const [novoApartamento, setNovoApartamento] = useState({ numero: '', nome_proprietario: '' });
  const [intervaloExclusao, setIntervaloExclusao] = useState({ de: '', ate: '' });

  // Forms
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: 0,
    data_transacao: new Date().toISOString().split('T')[0]
  });
  const [arquivoDespesa, setArquivoDespesa] = useState<File | null>(null);
  const [novaTransacao, setNovaTransacao] = useState({
    tipo: 'debito' as 'debito' | 'credito',
    descricao: '',
    valor: 0,
    ratear_condominos: false,
    data_transacao: new Date().toISOString().split('T')[0]
  });
  const [transacaoEditando, setTransacaoEditando] = useState<any>(null);
  const [despesaEditando, setDespesaEditando] = useState<any>(null);
  const [valorM3, setValorM3] = useState(0);
  const [leiturasInput, setLeiturasInput] = useState<any>({});
  const [leiturasAnteriores, setLeiturasAnteriores] = useState<any>({});
  const [novoEmail, setNovoEmail] = useState({ email: '', apartamento: '' });
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error', texto: string | React.ReactNode } | null>(null);
  const [abaConfig, setAbaConfig] = useState(0);
  const [dadosBanco, setDadosBanco] = useState({ nome: '', codigo: '', agencia: '', conta: '', chavePix: '', favorecido: '', cidade: '' });
  const [dadosCondominio, setDadosCondominio] = useState({
    nome: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    cnpj: '',
    nomeSindico: '',
    telSindico: '',
    emailCondominio: '',
    emailSindico: ''
  });

  // Carregar nome do condomínio ao montar componente
  useEffect(() => {
    const carregarNomeCondominio = async () => {
      try {
        const configRes = await api.get('/condominos/config/todas');
        const nome = configRes.data.cond_nome || 'Residencial Balek';
        setNomeCondominio(nome);
      } catch (error) {
        console.error('Erro ao carregar nome do condomínio:', error);
      }
    };
    carregarNomeCondominio();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [secaoAtiva, mes, ano]);

  // Carregar atas quando abrir a seção de Atas de Reunião
  useEffect(() => {
    const carregarAtas = async () => {
      if (secaoAtiva === 'atas') {
        try {
          const response = await api.get('/atas');
          setAtas(response.data);
        } catch (error) {
          console.error('Erro ao carregar atas:', error);
        }
      }
    };
    carregarAtas();
  }, [secaoAtiva]);

  const tentarCopiarSaldoMesAnterior = async (): Promise<number | null> => {
    try {
      // Calcular mês anterior
      let mesAnterior = mes - 1;
      let anoAnterior = ano;
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anoAnterior = ano - 1;
      }

      console.log(`Tentando copiar saldo de ${mesAnterior}/${anoAnterior} para ${mes}/${ano}`);

      // Buscar saldo do mês anterior
      const saldoAnteriorRes = await api.get(`/banco/saldo/${mesAnterior}/${anoAnterior}`);
      console.log('Dados do mês anterior:', saldoAnteriorRes.data);

      const saldoFinalAnterior = parseFloat(saldoAnteriorRes.data.saldo_final) || 0;
      console.log('Saldo final do mês anterior:', saldoFinalAnterior);

      // Copiar independente do valor (pode ser 0 ou negativo também)
      if (saldoAnteriorRes.data.saldo_final !== null && saldoAnteriorRes.data.saldo_final !== undefined) {
        console.log('Copiando saldo:', saldoFinalAnterior);

        // Salvar como saldo inicial do mês atual
        await api.post('/banco/saldo', {
          mes,
          ano,
          saldo_inicial: saldoFinalAnterior,
          saldo_extrato: null
        });

        console.log('Saldo copiado com sucesso!');
        return saldoFinalAnterior;
      }

      console.log('Saldo final do mês anterior não existe');
      return null;
    } catch (error: any) {
      console.error('Erro ao copiar saldo do mês anterior:', error);
      return null;
    }
  };

  const carregarDados = async () => {
    try {
      if (secaoAtiva === 'visao-geral' || secaoAtiva === 'despesas') {
        const [despesasRes, resumoRes, transacoesRes, saldoRes] = await Promise.all([
          api.get(`/despesas/condominio/${mes}/${ano}`).catch(() => ({ data: [] })),
          api.get(`/despesas/resumo/${mes}/${ano}`).catch(() => ({ data: [] })),
          api.get(`/banco/transacoes/${mes}/${ano}`).catch(() => ({ data: [] })),
          api.get(`/banco/saldo/${mes}/${ano}`).catch(() => ({ data: null }))
        ]);
        setDespesas(despesasRes.data);
        setResumo(resumoRes.data);
        setTransacoes(transacoesRes.data);
        setSaldo(saldoRes.data);
      } else if (secaoAtiva === 'banco') {
        const [transacoesRes, saldoRes] = await Promise.all([
          api.get(`/banco/transacoes/${mes}/${ano}`).catch(() => ({ data: [] })),
          api.get(`/banco/saldo/${mes}/${ano}`).catch(() => ({ data: null }))
        ]);
        setTransacoes(transacoesRes.data);

        // Verificar se precisa copiar saldo do mês anterior
        const saldoAtual = saldoRes.data;
        const saldoInicialAtual = parseFloat(String(saldoAtual?.saldo_inicial)) || 0;

        // Se saldo inicial é 0, tentar copiar do mês anterior
        if (saldoInicialAtual === 0) {
          const saldoCopiado = await tentarCopiarSaldoMesAnterior();
          if (saldoCopiado !== null) {
            // Recarregar saldo após copiar
            const novoSaldoRes = await api.get(`/banco/saldo/${mes}/${ano}`).catch(() => ({ data: null }));
            setSaldo(novoSaldoRes.data);
          } else {
            setSaldo(saldoAtual);
          }
        } else {
          setSaldo(saldoAtual);
        }
      } else if (secaoAtiva === 'gas') {
        const leiturasRes = await api.get(`/gas/leituras/${mes}/${ano}`).catch(() => ({ data: [] }));
        setLeituras(leiturasRes.data);
      } else if (secaoAtiva === 'configuracoes') {
        const [configRes, emailsRes, condominosRes] = await Promise.all([
          api.get('/condominos/config/todas').catch(() => ({ data: {} })),
          api.get('/auth/emails-permitidos').catch(() => ({ data: [] })),
          api.get('/condominos').catch(() => ({ data: [] }))
        ]);
        setConfiguracoes(configRes.data);
        setEmailsPermitidos(emailsRes.data);
        setCondominos(condominosRes.data);
        // Carregar dados bancários das configurações
        setDadosBanco({
          nome: configRes.data.banco_nome || '',
          codigo: configRes.data.banco_codigo || '',
          agencia: configRes.data.banco_agencia || '',
          conta: configRes.data.banco_conta || '',
          chavePix: configRes.data.banco_chave_pix || '',
          favorecido: configRes.data.banco_favorecido || '',
          cidade: configRes.data.banco_cidade || ''
        });
        // Carregar dados do condomínio das configurações
        setDadosCondominio({
          nome: configRes.data.cond_nome || '',
          endereco: configRes.data.cond_endereco || '',
          numero: configRes.data.cond_numero || '',
          complemento: configRes.data.cond_complemento || '',
          bairro: configRes.data.cond_bairro || '',
          cidade: configRes.data.cond_cidade || '',
          estado: configRes.data.cond_estado || '',
          cep: configRes.data.cond_cep || '',
          cnpj: configRes.data.cnpj_condominio || '',
          nomeSindico: configRes.data.cond_nome_sindico || '',
          telSindico: configRes.data.cond_tel_sindico || '',
          emailCondominio: configRes.data.cond_email_condominio || '',
          emailSindico: configRes.data.cond_email_sindico || ''
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      // Só mostra mensagem de erro se não for 404 (dados não encontrados)
      if (error.response?.status !== 404) {
        setMensagem({ tipo: 'error', texto: 'Erro ao carregar dados. Por favor, tente novamente.' });
      }
    }
  };

  const salvarDespesa = async () => {
    try {
      if (despesaEditando) {
        // Editando despesa existente
        await api.put(`/despesas/condominio/${despesaEditando.id}`, {
          descricao: novaDespesa.descricao,
          valor: novaDespesa.valor
        });
        setMensagem({ tipo: 'success', texto: 'Despesa atualizada com sucesso!' });
      } else {
        // Criando nova despesa
        await api.post('/despesas/condominio', { mes, ano, descricao: novaDespesa.descricao, valor: novaDespesa.valor });
        setMensagem({ tipo: 'success', texto: 'Despesa salva com sucesso!' });
      }

      setDialogDespesa(false);
      setNovaDespesa({
        descricao: '',
        valor: 0,
        data_transacao: new Date().toISOString().split('T')[0]
      });
      setDespesaEditando(null);
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao salvar despesa' });
    }
  };

  const abrirEdicaoDespesa = (despesa: any) => {
    setDespesaEditando(despesa);
    setNovaDespesa({
      descricao: despesa.descricao,
      valor: despesa.valor,
      data_transacao: new Date().toISOString().split('T')[0]
    });
    setDialogDespesa(true);
  };

  const excluirDespesa = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }
    try {
      await api.delete(`/despesas/condominio/${id}`);
      setMensagem({ tipo: 'success', texto: 'Despesa excluída com sucesso!' });
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao excluir despesa' });
    }
  };

  const salvarTransacao = async () => {
    try {
      if (transacaoEditando) {
        // Editando transação existente - usar mes/ano ORIGINAL da transação
        await api.put(`/banco/transacoes/${transacaoEditando.id}`, {
          mes: transacaoEditando.mes,
          ano: transacaoEditando.ano,
          ...novaTransacao
        });
        setMensagem({ tipo: 'success', texto: 'Transação atualizada com sucesso!' });
      } else {
        // Criando nova transação
        await api.post('/banco/transacoes', { mes, ano, ...novaTransacao });
        setMensagem({ tipo: 'success', texto: 'Transação salva com sucesso!' });
      }
      setDialogTransacao(false);
      setNovaTransacao({
        tipo: 'debito',
        descricao: '',
        valor: 0,
        ratear_condominos: false,
        data_transacao: new Date().toISOString().split('T')[0]
      });
      setTransacaoEditando(null);
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao salvar transação' });
    }
  };

  const abrirEdicaoTransacao = (transacao: any) => {
    setTransacaoEditando(transacao);
    setNovaTransacao({
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      valor: transacao.valor,
      ratear_condominos: transacao.ratear_condominos,
      data_transacao: new Date(transacao.data_transacao).toISOString().split('T')[0]
    });
    setDialogTransacao(true);
  };

  const excluirTransacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }
    try {
      await api.delete(`/banco/transacoes/${id}`);
      setMensagem({ tipo: 'success', texto: 'Transação excluída com sucesso!' });
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao excluir transação' });
    }
  };

  const abrirDialogMudarMes = (transacao: any) => {
    setTransacaoParaMudar(transacao);
    setNovoMesAno({ mes: transacao.mes, ano: transacao.ano });
    setDialogMudarMes(true);
  };

  const mudarMesTransacao = async () => {
    try {
      await api.put(`/banco/transacoes/${transacaoParaMudar.id}/mudar-mes`, {
        novo_mes: novoMesAno.mes,
        novo_ano: novoMesAno.ano
      });
      setDialogMudarMes(false);
      setTransacaoParaMudar(null);
      setMensagem({ tipo: 'success', texto: 'Transação movida com sucesso!' });
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao mudar mês da transação' });
    }
  };

  const abrirDialogGas = async () => {
    // Buscar leituras do mês anterior para preencher como default
    let mesAnterior = mes - 1;
    let anoAnterior = ano;
    if (mesAnterior < 1) {
      mesAnterior = 12;
      anoAnterior = ano - 1;
    }

    try {
      const response = await api.get(`/gas/leituras/${mesAnterior}/${anoAnterior}`);
      const leiturasAnt: any = {};
      response.data.forEach((leitura: any) => {
        leiturasAnt[leitura.apartamento] = leitura.leitura_atual;
      });
      setLeiturasAnteriores(leiturasAnt);
    } catch (error) {
      // Se não houver leituras do mês anterior, deixa vazio
      setLeiturasAnteriores({});
    }

    setDialogGas(true);
  };

  const salvarLeituras = async () => {
    try {
      const leituras = Object.keys(leiturasInput).map(apto => ({
        apartamento: apto,
        leitura_atual: parseFloat(leiturasInput[apto]),
        leitura_anterior: leiturasAnteriores[apto] ? parseFloat(leiturasAnteriores[apto]) : null
      }));

      await api.post('/gas/leituras/lote', { mes, ano, valor_m3: valorM3, leituras });
      setDialogGas(false);
      setLeiturasInput({});
      setLeiturasAnteriores({});
      setMensagem({ tipo: 'success', texto: 'Leituras salvas com sucesso!' });
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao salvar leituras' });
    }
  };

  const adicionarEmail = async () => {
    try {
      await api.post('/auth/emails-permitidos', novoEmail);
      setDialogEmail(false);
      setNovoEmail({ email: '', apartamento: '' });
      setMensagem({ tipo: 'success', texto: 'Email autorizado com sucesso!' });
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao adicionar email' });
    }
  };

  const removerEmailPermitido = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este email permitido?')) {
      return;
    }
    try {
      await api.delete(`/auth/emails-permitidos/${id}`);
      setMensagem({ tipo: 'success', texto: 'Email removido com sucesso!' });
      carregarDados();
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.response?.data?.erro || 'Erro ao remover email' });
    }
  };

  const baixarRelatorio = async (tipo: string) => {
    try {
      let url = '';
      if (tipo === 'extrato') url = `/relatorios/extrato-bancario/${mes}/${ano}`;
      else if (tipo === 'despesas') url = `/relatorios/despesas/${mes}/${ano}`;
      else if (tipo === 'gas') url = '/relatorios/gas-12meses';
      else if (tipo === 'parceladas') url = '/relatorios/despesas-parceladas';
      else if (tipo === 'sindico') url = `/relatorios/sindico/${mes}/${ano}`;
      else if (tipo === 'kondor') url = `/relatorios/kondor/${mes}/${ano}`;
      else if (tipo === 'historico-apartamentos') url = '/relatorios/historico-apartamentos';

      const response = await api.get(url, { responseType: 'blob' });
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', `relatorio-${tipo}-${mes}-${ano}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMensagem({ tipo: 'error', texto: 'Erro ao gerar relatório' });
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const downloadBoletoPDF = async (apartamento: string) => {
    try {
      const response = await api.get(`/boletos/pdf/${mes}/${ano}/${apartamento}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boleto_apto${apartamento}_${mes}_${ano}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar boleto:', error);
      alert('Erro ao baixar boleto PDF');
    }
  };

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const menuItems = [
    { id: 'visao-geral', nome: 'Visão Geral', icone: <DashboardIcon />, cor: '#4CAF50' },
    { id: 'configuracoes', nome: 'Configurações', icone: <Settings />, cor: '#9C27B0' },
    { id: 'banco', nome: 'Banco & Lançamentos', icone: <AccountBalance />, cor: '#2196F3' },
    { id: 'despesas', nome: 'Despesas & Boletos', icone: <Receipt />, cor: '#FF9800' },
    { id: 'gas', nome: 'Gás', icone: <LocalFireDepartment />, cor: '#F44336' },
    { id: 'fornecedores', nome: 'Fornecedores', icone: <Store />, cor: '#00BCD4' },
    { id: 'mao-de-obra', nome: 'Mão de Obra', icone: <Build />, cor: '#FFC107' },
    { id: 'relatorios', nome: 'Relatórios', icone: <Assessment />, cor: '#3F51B5' },
    { id: 'atas', nome: 'Atas de Reunião', icone: <PictureAsPdf />, cor: '#E91E63' },
    { id: 'seguranca', nome: 'Segurança', icone: <Security />, cor: '#607D8B' },
  ];

  // Estatísticas para Visão Geral
  const totalDespesas = despesas.reduce((sum, d) => sum + (parseFloat(String(d.valor)) || 0), 0);
  const totalCreditos = transacoes.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0);
  const totalDebitos = transacoes.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0);
  const saldoInicial = parseFloat(String(saldo?.saldo_inicial)) || 0;
  const saldoBanco = saldoInicial + totalCreditos - totalDebitos;

  // Novos cálculos para as estatísticas
  const totalConsumoGas = resumo.reduce((sum, r) => sum + (parseFloat(String(r.valor_gas)) || 0), 0);
  const totalFundoReserva = resumo.reduce((sum, r) => sum + (parseFloat(String(r.fundo_reserva)) || 0), 0);
  const despesaCondominio = totalDespesas; // Soma de todas as despesas do condomínio
  const nrApartamentos = parseInt(configuracoes.numero_apartamentos || '6');

  // Gera lista dinâmica de apartamentos baseado na configuração
  const listaApartamentos = Array.from({ length: nrApartamentos }, (_, i) => i + 1);

  const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];

  // Abrir dialog de segurança (para backup ou restaurar)
  const abrirDialogSeguranca = (acao: 'backup' | 'restaurar') => {
    setAcaoSeguranca(acao);
    setSenhaSeguranca('');
    setDialogSeguranca(true);
  };

  const confirmarSenhaSeguranca = async () => {
    if (senhaSeguranca !== 'Seguranca/551') {
      setMensagem({ tipo: 'error', texto: 'Senha incorreta!' });
      setTimeout(() => setMensagem(null), 3000);
      return;
    }

    setDialogSeguranca(false);
    setSenhaSeguranca('');

    // Executar ação correspondente
    if (acaoSeguranca === 'backup') {
      await executarBackup();
    } else if (acaoSeguranca === 'restaurar') {
      await abrirListaBackups();
    }
  };

  const executarBackup = async () => {
    setLoading(true);
    setLoadingMessage('Gerando backup do sistema... Por favor, aguarde.');

    try {
      // Novo endpoint: POST /auth/backup (salva direto na pasta)
      const response = await api.post('/auth/backup');

      const { arquivo, pasta } = response.data;

      setLoading(false);

      // Mensagem com informações do backup salvo
      setMensagem({
        tipo: 'success',
        texto: (
          <>
            <strong>✅ Backup realizado com sucesso!</strong>
            <br /><br />
            📁 <strong>Arquivo:</strong> {arquivo}
            <br />
            📂 <strong>Pasta:</strong> {pasta}
            <br /><br />
            📌 <strong>Para restaurar:</strong> Use a opção "Restaurar Backup" no menu Segurança
            <br /><br />
            <em>Clique no X para fechar esta mensagem</em>
          </>
        )
      });
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      setLoading(false);
      setMensagem({ tipo: 'error', texto: 'Erro ao gerar backup' });
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  // Abrir lista de backups (após senha validada)
  const abrirListaBackups = async () => {
    try {
      const response = await api.get('/auth/backups');
      setBackupsDisponiveis(response.data.backups);
      setDialogRestaurar(true);
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      setMensagem({ tipo: 'error', texto: 'Erro ao listar backups disponíveis' });
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  // Confirmar restauração do backup
  const confirmarRestauracao = async () => {
    if (!backupSelecionado) {
      setMensagem({ tipo: 'error', texto: 'Selecione um backup para restaurar' });
      setTimeout(() => setMensagem(null), 3000);
      return;
    }

    setDialogRestaurar(false);
    setLoading(true);
    setLoadingMessage('Restaurando backup... Isso pode levar alguns instantes. Por favor, aguarde.');

    try {
      await api.post('/auth/restaurar', { arquivo: backupSelecionado });

      setLoading(false);

      setMensagem({
        tipo: 'success',
        texto: (
          <>
            <strong>✅ Backup restaurado com sucesso!</strong>
            <br /><br />
            📁 <strong>Arquivo:</strong> {backupSelecionado}
            <br /><br />
            <em>Recarregue a página para ver os dados restaurados</em>
            <br /><br />
            <Button variant="contained" onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </>
        )
      });
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      setLoading(false);
      setMensagem({ tipo: 'error', texto: 'Erro ao restaurar backup' });
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Conteúdo Principal */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            top: 0,
            zIndex: 1100
          }}
        >
          <Toolbar>
            <HomeIcon sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {nomeCondominio} - Administração
            </Typography>
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'white', color: '#667eea' }}>A</Avatar>}
              label={usuario?.nome}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mr: 2 }}
            />
            <IconButton color="inherit" onClick={logout}>
              <Logout />
            </IconButton>
          </Toolbar>

          {/* Menu de Navegação Horizontal */}
          <Box sx={{
            borderBottom: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            backgroundColor: '#667eea',
            display: 'flex',
            justifyContent: 'flex-start',
            pl: '48px',
            pr: 2
          }}>
            <Tabs
              value={secaoAtiva}
              onChange={(e, newValue) => setSecaoAtiva(newValue)}
              sx={{
                minHeight: 90,
                '& .MuiTabs-flexContainer': {
                  gap: 2,
                },
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'none',
                  minHeight: 82,
                  minWidth: 110,
                  maxWidth: 130,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  padding: '12px 16px',
                  margin: '4px 0',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.8rem',
                  },
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                  },
                  '&.Mui-selected': {
                    color: 'white',
                    fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                }
              }}
            >
              {menuItems.map((item) => (
                <Tab
                  key={item.id}
                  value={item.id}
                  label={item.nome}
                  icon={item.icone}
                  iconPosition="top"
                />
              ))}
            </Tabs>
          </Box>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {mensagem && (
            <Alert severity={mensagem.tipo} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMensagem(null)}>
              {mensagem.texto}
            </Alert>
          )}

          {/* Seleção de Mês/Ano - Esconder para Fornecedores e Mão de Obra */}
          {secaoAtiva !== 'fornecedores' && secaoAtiva !== 'mao-de-obra' && (
            <Box mb={4}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Mês</InputLabel>
                    <Select value={mes} label="Mês" onChange={(e) => setMes(Number(e.target.value))} sx={{ bgcolor: 'white', borderRadius: 2 }}>
                      {meses.map((m, i) => (
                        <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Ano</InputLabel>
                    <Select value={ano} label="Ano" onChange={(e) => setAno(Number(e.target.value))} sx={{ bgcolor: 'white', borderRadius: 2 }}>
                      {[2024, 2025, 2026, 2027].map((a) => (
                        <MenuItem key={a} value={a}>{a}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Visão Geral */}
          {secaoAtiva === 'visao-geral' && (
            <Box>
              <Typography variant="h4" fontWeight={700} mb={3} sx={{ color: '#1a1a2e' }}>
                Visão Geral - {meses[mes - 1]}/{ano}
              </Typography>

              <Grid container spacing={2} mb={4}>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#e3f2fd' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Despesa Condomínio
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {formatarMoeda(despesaCondominio)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#ffebee' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Total Consumo Gás
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#d32f2f' }}>
                        {formatarMoeda(totalConsumoGas)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#f1f8e9' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Fundo de Reserva
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#388e3c' }}>
                        {formatarMoeda(totalFundoReserva)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#fff3e0' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Total Despesas
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#e65100' }}>
                        {formatarMoeda(totalDespesas)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#e8f5e9' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Créditos do Mês
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#2e7d32' }}>
                        {formatarMoeda(totalCreditos)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#f3e5f5' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Saldo do Banco
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: saldoBanco >= 0 ? '#388e3c' : '#c62828' }}>
                        {formatarMoeda(saldoBanco)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={12/7} lg={12/7}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#fce4ec' }}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        Nº Apartamentos
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#c2185b' }}>
                        {nrApartamentos}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Resumo por Apartamento
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      {resumo.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={resumo}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="apartamento" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => formatarMoeda(value)} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value) => {
                                if (value === 'Condomínio+Água') return 'Valor do Condomínio';
                                if (value === 'Fundo Reserva') return 'Fundo Reserva';
                                if (value === 'Gás') return 'Gás';
                                return value;
                              }}
                            />
                            <Bar dataKey="valor_condominio" fill="#667eea" name="Condomínio+Água">
                              <LabelList dataKey="valor_condominio" position="top" formatter={(value: any) => formatarMoeda(value)} style={{ fontSize: 10 }} />
                            </Bar>
                            <Bar dataKey="fundo_reserva" fill="#48bb78" name="Fundo Reserva">
                              <LabelList dataKey="fundo_reserva" position="top" formatter={(value: any) => formatarMoeda(value)} style={{ fontSize: 10 }} />
                            </Bar>
                            <Bar dataKey="valor_gas" fill="#f5576c" name="Gás">
                              <LabelList dataKey="valor_gas" position="top" formatter={(value: any) => formatarMoeda(value)} style={{ fontSize: 10 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                          Nenhum dado disponível
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Distribuição de Despesas
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      {despesas.length > 0 ? (
                        <Box>
                          {despesas.slice(0, 6).map((despesa, index) => (
                            <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                              <Box display="flex" alignItems="center" flex={1}>
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: COLORS[index % COLORS.length],
                                    mr: 1.5,
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="body2" sx={{ fontSize: '0.85rem', flex: 1 }}>
                                  {despesa.descricao.substring(0, 25)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', ml: 1 }}>
                                {formatarMoeda(parseFloat(String(despesa.valor)))}
                              </Typography>
                            </Box>
                          ))}
                          <Divider sx={{ my: 2 }} />
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="body1" fontWeight={700} color="primary">
                              Total
                            </Typography>
                            <Typography variant="body1" fontWeight={700} color="primary">
                              {formatarMoeda(totalDespesas)}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                          Nenhum dado disponível
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Despesas */}
          {secaoAtiva === 'despesas' && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a2e' }}>
                  Despesas do Condomínio
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setDialogDespesa(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Adicionar Despesa
                </Button>
              </Box>

              {/* Card com Total das Despesas */}
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      Total das Despesas - {mes}/{ano}
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {formatarMoeda(despesas.reduce((sum, d) => sum + (parseFloat(String(d.valor)) || 0), 0))}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Valor Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Por Apto</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {despesas.map((d) => (
                        <TableRow key={d.id} sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                          <TableCell>{d.descricao}</TableCell>
                          <TableCell align="right">{formatarMoeda(d.valor)}</TableCell>
                          <TableCell align="right">
                            <Chip label={formatarMoeda(d.valor_por_apto)} size="small" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => abrirEdicaoDespesa(d)}
                              title="Editar"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => excluirDespesa(d.id)}
                              title="Excluir"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {resumo.length > 0 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Resumo por Apartamento
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Apto</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Condomínio+Água</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Fundo Reserva</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Gás</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Boleto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumo.map((r) => (
                          <TableRow key={r.apartamento}>
                            <TableCell><Chip label={r.apartamento} size="small" color="primary" /></TableCell>
                            <TableCell align="right">{formatarMoeda(r.valor_condominio)}</TableCell>
                            <TableCell align="right">{formatarMoeda(r.fundo_reserva || 0)}</TableCell>
                            <TableCell align="right">{formatarMoeda(r.valor_gas)}</TableCell>
                            <TableCell align="right"><strong>{formatarMoeda(r.total)}</strong></TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => downloadBoletoPDF(r.apartamento)}
                                title="Baixar Boleto PDF"
                                size="small"
                              >
                                <PictureAsPdf />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Linha de Totais */}
                        <TableRow sx={{ bgcolor: '#f3f4f6', borderTop: '2px solid #667eea' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>TOTAL</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {formatarMoeda(resumo.reduce((sum, r) => sum + (parseFloat(String(r.valor_condominio)) || 0), 0))}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {formatarMoeda(resumo.reduce((sum, r) => sum + (parseFloat(String(r.fundo_reserva)) || 0), 0))}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {formatarMoeda(resumo.reduce((sum, r) => sum + (parseFloat(String(r.valor_gas)) || 0), 0))}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#667eea' }}>
                            {formatarMoeda(resumo.reduce((sum, r) => sum + (parseFloat(String(r.total)) || 0), 0))}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Banco */}
          {secaoAtiva === 'banco' && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a2e' }}>
                  Banco - {meses[mes - 1]}/{ano}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setDialogTransacao(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Nova Transação
                </Button>
              </Box>

              {/* Resumo do Saldo */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Saldo Inicial
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary">
                        {formatarMoeda(saldoInicial)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#e8f5e9' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Créditos
                      </Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#2e7d32' }}>
                        {formatarMoeda(totalCreditos)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#ffebee' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Débitos
                      </Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#d32f2f' }}>
                        {formatarMoeda(totalDebitos)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: saldoBanco >= 0 ? '#f1f8e9' : '#fce4ec' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Saldo Final
                      </Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ color: saldoBanco >= 0 ? '#388e3c' : '#c62828' }}>
                        {formatarMoeda(saldoBanco)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Valor</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Ratear</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        // Ordenar transações por data
                        const transacoesOrdenadas = [...transacoes].sort((a, b) =>
                          new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime()
                        );

                        // Calcular saldo acumulado
                        let saldoAcumulado = saldoInicial;

                        return transacoesOrdenadas.map((t) => {
                          // Atualizar saldo
                          const valorTransacao = typeof t.valor === 'string' ? parseFloat(t.valor) : t.valor || 0;
                          if (t.tipo === 'credito') {
                            saldoAcumulado += valorTransacao;
                          } else {
                            saldoAcumulado -= valorTransacao;
                          }

                          return (
                            <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                              <TableCell>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>
                                <Chip
                                  label={t.tipo === 'credito' ? 'Crédito' : 'Débito'}
                                  size="small"
                                  color={t.tipo === 'credito' ? 'success' : 'error'}
                                />
                              </TableCell>
                              <TableCell>{t.descricao}</TableCell>
                              <TableCell align="right">
                                <Box sx={{ color: t.tipo === 'credito' ? '#2e7d32' : '#d32f2f', fontWeight: 600 }}>
                                  {t.tipo === 'credito' ? '+' : '-'} {formatarMoeda(t.valor)}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={formatarMoeda(saldoAcumulado)}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    bgcolor: saldoAcumulado >= 0 ? '#e8f5e9' : '#ffebee',
                                    color: saldoAcumulado >= 0 ? '#2e7d32' : '#d32f2f'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">{t.ratear_condominos ? 'Sim' : 'Não'}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => abrirEdicaoTransacao(t)}
                                  title="Editar"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => excluirTransacao(t.id)}
                                  title="Excluir"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => abrirDialogMudarMes(t)}
                                  title="Mudar Mês de Cobrança"
                                >
                                  <CalendarMonth fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Gás */}
          {secaoAtiva === 'gas' && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#1a1a2e' }}>
                  Leituras de Gás
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={abrirDialogGas}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Registrar Leituras
                </Button>
              </Box>

              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Apto</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Leit. Anterior</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Leit. Atual</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Consumo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leituras.map((l) => (
                        <TableRow key={l.id} sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                          <TableCell><Chip label={l.apartamento} size="small" color="primary" /></TableCell>
                          <TableCell align="right">{l.leitura_anterior ? Number(l.leitura_anterior).toFixed(3) : '-'}</TableCell>
                          <TableCell align="right">{l.leitura_atual ? Number(l.leitura_atual).toFixed(3) : '-'}</TableCell>
                          <TableCell align="right">{l.consumo ? Number(l.consumo).toFixed(3) : '-'}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={l.valor_total ? formatarMoeda(l.valor_total) : '-'}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Configurações */}
          {secaoAtiva === 'configuracoes' && (
            <Box>
              <Typography variant="h4" fontWeight={700} mb={3} sx={{ color: '#1a1a2e' }}>
                Configurações
              </Typography>

              <Tabs
                value={abaConfig}
                onChange={(e, v) => setAbaConfig(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 3,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  padding: '8px',
                  '& .MuiTabs-flexContainer': {
                    gap: 1,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    minWidth: 120,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: '#667eea',
                    backgroundColor: 'white',
                    border: '2px solid #e0e0e0',
                    borderRadius: 1.5,
                    padding: '10px 20px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      borderColor: '#667eea',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 6px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-selected': {
                      color: 'white',
                      backgroundColor: '#667eea',
                      borderColor: '#667eea',
                      fontWeight: 700,
                      boxShadow: '0 3px 10px rgba(102, 126, 234, 0.4)',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    display: 'none',
                  }
                }}
              >
                <Tab label="Cadastro do Condomínio" />
                <Tab label="Fundo de Reserva" />
                <Tab label="Dados Bancários" />
                <Tab label="Emails Permitidos" />
                <Tab label="Condôminos" />
              </Tabs>

              {/* Tab 0: Cadastro do Condomínio */}
              {abaConfig === 0 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1a1a2e', mb: 3 }}>
                      Cadastro do Condomínio
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome do Condomínio"
                          value={dadosCondominio.nome}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, nome: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="CNPJ"
                          value={dadosCondominio.cnpj}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, cnpj: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          label="Endereço"
                          value={dadosCondominio.endereco}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, endereco: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Número"
                          value={dadosCondominio.numero}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, numero: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Complemento"
                          value={dadosCondominio.complemento}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, complemento: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Bairro"
                          value={dadosCondominio.bairro}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, bairro: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Cidade"
                          value={dadosCondominio.cidade}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, cidade: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Estado"
                          value={dadosCondominio.estado}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, estado: e.target.value })}
                          inputProps={{ maxLength: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="CEP"
                          value={dadosCondominio.cep}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, cep: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome do Síndico"
                          value={dadosCondominio.nomeSindico}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, nomeSindico: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Telefone do Síndico"
                          value={dadosCondominio.telSindico}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, telSindico: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email do Condomínio"
                          type="email"
                          value={dadosCondominio.emailCondominio}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, emailCondominio: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email do Síndico"
                          type="email"
                          value={dadosCondominio.emailSindico}
                          onChange={(e) => setDadosCondominio({ ...dadosCondominio, emailSindico: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Número de Apartamentos"
                          type="text"
                          placeholder="6"
                          value={configuracoes.numero_apartamentos || ''}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, ''); // Remove não-números
                            setConfiguracoes({ ...configuracoes, numero_apartamentos: valor });
                          }}
                          helperText="Total de apartamentos para rateio de despesas (clique para editar)"
                          onFocus={(e) => {
                            // Seleciona todo o texto ao focar
                            setTimeout(() => e.target.select(), 0);
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1a1a2e', mb: 2 }}>
                      Documentos do Condomínio
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Registro do Condomínio"
                          type="file"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ accept: '.pdf,.doc,.docx' }}
                          helperText="Formato: PDF, DOC ou DOCX"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Convenção do Condomínio"
                          type="file"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ accept: '.pdf,.doc,.docx' }}
                          helperText="Formato: PDF, DOC ou DOCX"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Contrato com Administradora"
                          type="file"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ accept: '.pdf,.doc,.docx' }}
                          helperText="Formato: PDF, DOC ou DOCX"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Documentos Extras"
                          type="file"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ accept: '.pdf,.doc,.docx', multiple: true }}
                          helperText="Formato: PDF, DOC ou DOCX (múltiplos arquivos)"
                        />
                      </Grid>
                    </Grid>

                    <Box mt={3} display="flex" justifyContent="flex-end" alignItems="center">
                      <Button
                        variant="contained"
                        onClick={async () => {
                          try {
                            await api.post('/condominos/config/batch', [
                              { chave: 'cond_nome', valor: dadosCondominio.nome },
                              { chave: 'cond_endereco', valor: dadosCondominio.endereco },
                              { chave: 'cond_numero', valor: dadosCondominio.numero },
                              { chave: 'cond_complemento', valor: dadosCondominio.complemento },
                              { chave: 'cond_bairro', valor: dadosCondominio.bairro },
                              { chave: 'cond_cidade', valor: dadosCondominio.cidade },
                              { chave: 'cond_estado', valor: dadosCondominio.estado },
                              { chave: 'cond_cep', valor: dadosCondominio.cep },
                              { chave: 'cnpj_condominio', valor: dadosCondominio.cnpj },
                              { chave: 'cond_nome_sindico', valor: dadosCondominio.nomeSindico },
                              { chave: 'cond_tel_sindico', valor: dadosCondominio.telSindico },
                              { chave: 'cond_email_condominio', valor: dadosCondominio.emailCondominio },
                              { chave: 'cond_email_sindico', valor: dadosCondominio.emailSindico },
                              { chave: 'numero_apartamentos', valor: configuracoes.numero_apartamentos || '6' }
                            ]);
                            setMensagem({ tipo: 'success', texto: 'Cadastro do condomínio salvo com sucesso!' });
                            setTimeout(() => setMensagem(null), 3000);
                          } catch (error) {
                            setMensagem({ tipo: 'error', texto: 'Erro ao salvar cadastro do condomínio' });
                          }
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontWeight: 600
                        }}
                      >
                        Salvar Cadastro
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Tab 1: Fundo de Reserva */}
              {abaConfig === 1 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Fundo de Reserva
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Valor Fixo (R$)"
                          type="number"
                          value={configuracoes.fundo_reserva_valor_fixo || '0'}
                          onChange={(e) => setConfiguracoes({ ...configuracoes, fundo_reserva_valor_fixo: e.target.value })}
                          helperText="Se maior que 0, ignora o percentual"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Percentual (%)"
                          type="number"
                          value={configuracoes.fundo_reserva_percentual || '10'}
                          onChange={(e) => setConfiguracoes({ ...configuracoes, fundo_reserva_percentual: e.target.value })}
                          helperText="Aplicado sobre o valor do condomínio de cada apto"
                        />
                      </Grid>
                    </Grid>

                    <Box mt={3}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          try {
                            await api.put('/condominos/config/atualizar', {
                              chave: 'fundo_reserva_valor_fixo',
                              valor: configuracoes.fundo_reserva_valor_fixo || '0'
                            });
                            await api.put('/condominos/config/atualizar', {
                              chave: 'fundo_reserva_percentual',
                              valor: configuracoes.fundo_reserva_percentual || '10'
                            });
                            setMensagem({ tipo: 'success', texto: 'Configurações salvas!' });
                          } catch (err) {
                            setMensagem({ tipo: 'error', texto: 'Erro ao salvar configurações' });
                          }
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          px: 4,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Salvar Configurações
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Tab 2: Dados Bancários */}
              {abaConfig === 2 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Dados Bancários do Condomínio
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome do Banco"
                          value={dadosBanco.nome}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, nome: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Código do Banco"
                          value={dadosBanco.codigo}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, codigo: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Agência"
                          value={dadosBanco.agencia}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, agencia: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Conta"
                          value={dadosBanco.conta}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, conta: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Chave PIX"
                          value={dadosBanco.chavePix}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, chavePix: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome do Favorecido"
                          value={dadosBanco.favorecido}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, favorecido: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Cidade"
                          value={dadosBanco.cidade}
                          onChange={(e) => setDadosBanco({ ...dadosBanco, cidade: e.target.value })}
                        />
                      </Grid>
                    </Grid>

                    <Box mt={3}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          try {
                            // Salvar cada campo de dados bancários
                            const campos = [
                              { chave: 'banco_nome', valor: dadosBanco.nome },
                              { chave: 'banco_codigo', valor: dadosBanco.codigo },
                              { chave: 'banco_agencia', valor: dadosBanco.agencia },
                              { chave: 'banco_conta', valor: dadosBanco.conta },
                              { chave: 'banco_chave_pix', valor: dadosBanco.chavePix },
                              { chave: 'banco_favorecido', valor: dadosBanco.favorecido },
                              { chave: 'banco_cidade', valor: dadosBanco.cidade }
                            ];
                            for (const campo of campos) {
                              await api.put('/condominos/config/atualizar', campo);
                            }
                            setMensagem({ tipo: 'success', texto: 'Dados bancários salvos!' });
                          } catch (err) {
                            setMensagem({ tipo: 'error', texto: 'Erro ao salvar dados bancários' });
                          }
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          px: 4,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Salvar Dados Bancários
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Tab 3: Emails Permitidos */}
              {abaConfig === 3 && (
                <Box>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setDialogEmail(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 2,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Adicionar Email
                    </Button>
                  </Box>

                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Apartamento</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Ações</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {emailsPermitidos.map((e) => (
                            <TableRow key={e.id} sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                              <TableCell>{e.email}</TableCell>
                              <TableCell><Chip label={e.apartamento} size="small" color="primary" /></TableCell>
                              <TableCell>
                                <Chip
                                  label={e.usado ? 'Usado' : 'Pendente'}
                                  size="small"
                                  color={e.usado ? 'default' : 'warning'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removerEmailPermitido(e.id)}
                                  title="Remover email"
                                >
                                  <Delete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Tab 4: Condôminos */}
              {abaConfig === 4 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Cadastro de Condôminos e Moradores
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Delete />}
                          onClick={() => setDialogExcluirIntervalo(true)}
                          sx={{
                            borderColor: '#f44336',
                            color: '#f44336',
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#d32f2f',
                              bgcolor: '#ffebee'
                            }
                          }}
                        >
                          Excluir Intervalo
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setDialogNovoApartamento(true)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          Adicionar Apartamento
                        </Button>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Apto</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Proprietário</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Morador/Inquilino</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Telefone</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {condominos.map((c) => (
                          <TableRow key={c.apartamento}>
                            <TableCell><Chip label={c.apartamento} size="small" color="primary" /></TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Nome do proprietário"
                                value={c.nome_proprietario || ''}
                                onChange={(e) => {
                                  const updated = condominos.map(x =>
                                    x.apartamento === c.apartamento ? { ...x, nome_proprietario: e.target.value } : x
                                  );
                                  setCondominos(updated);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Nome do morador (se diferente)"
                                value={c.nome_morador || ''}
                                onChange={(e) => {
                                  const updated = condominos.map(x =>
                                    x.apartamento === c.apartamento ? { ...x, nome_morador: e.target.value } : x
                                  );
                                  setCondominos(updated);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Telefone"
                                value={c.telefone || ''}
                                onChange={(e) => {
                                  const updated = condominos.map(x =>
                                    x.apartamento === c.apartamento ? { ...x, telefone: e.target.value } : x
                                  );
                                  setCondominos(updated);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Email"
                                value={c.email || ''}
                                onChange={(e) => {
                                  const updated = condominos.map(x =>
                                    x.apartamento === c.apartamento ? { ...x, email: e.target.value } : x
                                  );
                                  setCondominos(updated);
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={async () => {
                                  try {
                                    await api.put(`/condominos/${c.apartamento}`, c);
                                    setMensagem({ tipo: 'success', texto: 'Condômino atualizado!' });
                                  } catch (err) {
                                    setMensagem({ tipo: 'error', texto: 'Erro ao salvar' });
                                  }
                                }}
                              >
                                Salvar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Atas de Reunião */}
          {secaoAtiva === 'atas' && (
            <Box>
              <Typography variant="h4" fontWeight={700} mb={3} sx={{ color: '#1a1a2e' }}>
                Atas de Reunião
              </Typography>

              {/* Upload de Nova Ata */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>
                    Upload de Nova Ata de Reunião
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Data da Reunião"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={novaAta.data_reuniao}
                        onChange={(e) => setNovaAta({ ...novaAta, data_reuniao: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Título (opcional)"
                        placeholder="Ex: Ata de Assembleia Ordinária"
                        value={novaAta.titulo}
                        onChange={(e) => setNovaAta({ ...novaAta, titulo: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        sx={{ height: '56px' }}
                      >
                        {novaAta.arquivo ? novaAta.arquivo.name : 'Selecionar Arquivo'}
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setNovaAta({ ...novaAta, arquivo: e.target.files[0] });
                            }
                          }}
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CloudUpload />}
                        sx={{
                          height: '56px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #63397d 100%)',
                          }
                        }}
                        onClick={async () => {
                          try {
                            if (!novaAta.data_reuniao) {
                              setMensagem({ tipo: 'error', texto: 'Data da reunião é obrigatória' });
                              return;
                            }
                            if (!novaAta.arquivo) {
                              setMensagem({ tipo: 'error', texto: 'Selecione um arquivo' });
                              return;
                            }

                            const formData = new FormData();
                            formData.append('data_reuniao', novaAta.data_reuniao);
                            formData.append('titulo', novaAta.titulo);
                            formData.append('arquivo', novaAta.arquivo);

                            await api.post('/atas/upload', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });

                            setMensagem({ tipo: 'success', texto: 'Ata enviada com sucesso!' });
                            setNovaAta({ data_reuniao: '', titulo: '', arquivo: null });

                            // Recarregar lista de atas
                            const response = await api.get('/atas');
                            setAtas(response.data);
                          } catch (err: any) {
                            setMensagem({ tipo: 'error', texto: err.response?.data?.erro || 'Erro ao enviar ata' });
                          }
                        }}
                      >
                        Enviar
                      </Button>
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Formatos aceitos: PDF, DOC, DOCX (máximo 10MB)
                  </Typography>
                </CardContent>
              </Card>

              {/* Lista de Atas */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>
                    Atas Cadastradas
                  </Typography>
                  {atas.length === 0 ? (
                    <Alert severity="info">
                      Nenhuma ata cadastrada. Use o formulário acima para fazer upload.
                    </Alert>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Data da Reunião</strong></TableCell>
                          <TableCell><strong>Título</strong></TableCell>
                          <TableCell><strong>Arquivo</strong></TableCell>
                          <TableCell><strong>Tamanho</strong></TableCell>
                          <TableCell align="center"><strong>Ações</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {atas.map((ata) => (
                          <TableRow key={ata.id}>
                            <TableCell>
                              {new Date(ata.data_reuniao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{ata.titulo}</TableCell>
                            <TableCell>{ata.nome_arquivo}</TableCell>
                            <TableCell>
                              {ata.tamanho ? `${(ata.tamanho / 1024).toFixed(0)} KB` : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" gap={1} justifyContent="center">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => {
                                    window.open(`${(import.meta as any).env.VITE_API_URL || ''}/atas/download/${ata.id}`, '_blank');
                                  }}
                                  title="Baixar"
                                >
                                  <Download />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={async () => {
                                    if (window.confirm(`Deseja realmente excluir a ata de ${new Date(ata.data_reuniao).toLocaleDateString('pt-BR')}?`)) {
                                      try {
                                        await api.delete(`/atas/${ata.id}`);
                                        setMensagem({ tipo: 'success', texto: 'Ata excluída com sucesso!' });
                                        // Recarregar lista
                                        const response = await api.get('/atas');
                                        setAtas(response.data);
                                      } catch (err: any) {
                                        setMensagem({ tipo: 'error', texto: err.response?.data?.erro || 'Erro ao excluir ata' });
                                      }
                                    }
                                  }}
                                  title="Excluir"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Segurança (Backup e Restaurar) */}
          {secaoAtiva === 'seguranca' && (
            <Box>
              <Typography variant="h4" fontWeight={700} mb={3} sx={{ color: '#1a1a2e' }}>
                Segurança - Backup e Restauração
              </Typography>

              <Grid container spacing={3}>
                {/* Card Backup */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Backup sx={{ fontSize: 70, color: '#28a745', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: '#1a1a2e' }}>
                          Fazer Backup
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                          Salva todos os dados do sistema em um arquivo SQL na pasta de backups.
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => abrirDialogSeguranca('backup')}
                          startIcon={<Backup />}
                          sx={{
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            fontWeight: 600,
                            px: 3,
                            py: 1.2
                          }}
                        >
                          Fazer Backup
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Card Restaurar */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Restore sx={{ fontSize: 70, color: '#ffc107', mb: 2 }} />
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: '#1a1a2e' }}>
                          Restaurar Backup
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                          Restaura os dados de um backup anterior. <strong style={{ color: '#dc3545' }}>⚠️ Substitui todos os dados atuais!</strong>
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => abrirDialogSeguranca('restaurar')}
                          startIcon={<Restore />}
                          sx={{
                            background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                            fontWeight: 600,
                            px: 3,
                            py: 1.2,
                            color: '#000'
                          }}
                        >
                          Restaurar Backup
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Informações de Segurança */}
              <Alert severity="info" sx={{ mt: 3 }}>
                <strong>Nota de Segurança:</strong> Ambas as operações requerem senha de segurança.
                Os backups são salvos em <code>D:\Gestao-de-condominio\Backups\</code>
              </Alert>
            </Box>
          )}

          {/* Fornecedores */}
          {secaoAtiva === 'fornecedores' && (
            <Fornecedores />
          )}

          {/* Mão de Obra */}
          {secaoAtiva === 'mao-de-obra' && (
            <MaoDeObra />
          )}

          {/* Relatórios */}
          {secaoAtiva === 'relatorios' && (
            <Box>
              <Typography variant="h4" fontWeight={700} mb={3} sx={{ color: '#1a1a2e' }}>
                Gerar Relatórios
              </Typography>
              <Grid container spacing={3}>
                {[
                  {
                    numero: '01',
                    tipo: 'sindico',
                    titulo: 'Relatório para o Síndico',
                    desc: 'Relatório completo com extrato, despesas e resumo',
                    icon: <Assessment />,
                    corBotao: '#64B5F6'
                  },
                  {
                    numero: '02',
                    tipo: 'kondor',
                    titulo: 'Relatório Kondor Imóveis',
                    desc: 'Resumo para imobiliária sem dados bancários',
                    icon: <Assessment />,
                    corBotao: '#EF5350'
                  },
                  {
                    numero: '03',
                    tipo: 'extrato',
                    titulo: 'Extrato Bancário',
                    desc: 'Transações bancárias do mês',
                    icon: <AccountBalance />,
                    corBotao: '#4DB6AC'
                  },
                  {
                    numero: '04',
                    tipo: 'despesas',
                    titulo: 'Relatório de Despesas',
                    desc: 'Detalhamento completo das despesas',
                    icon: <Receipt />,
                    corBotao: '#42A5F5'
                  },
                  {
                    numero: '05',
                    tipo: 'gas',
                    titulo: 'Consumo de Gás',
                    desc: 'Histórico de consumo (12 meses)',
                    icon: <LocalFireDepartment />,
                    corBotao: '#FF7043'
                  },
                  {
                    numero: '06',
                    tipo: 'parceladas',
                    titulo: 'Relatório de Configurações',
                    desc: 'Fundo de reserva, condôminos e emails permitidos',
                    icon: <TrendingUp />,
                    corBotao: '#66BB6A'
                  },
                  {
                    numero: '07',
                    tipo: 'historico-apartamentos',
                    titulo: 'Histórico por Apartamento',
                    desc: 'Últimos 12 meses de cada apartamento',
                    icon: <Assessment />,
                    corBotao: '#9C27B0'
                  }
                ].map((relatorio) => (
                  <Grid item xs={12} md={6} key={relatorio.tipo}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        border: `2px solid ${relatorio.corBotao}`,
                        height: '100%',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 8px 32px ${relatorio.corBotao}40`
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="flex-start" mb={2}>
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: '#E3F2FD',
                              color: '#1565C0',
                              mr: 2,
                              fontSize: '28px',
                              position: 'relative'
                            }}
                          >
                            {relatorio.icon}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: relatorio.corBotao,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                            >
                              {relatorio.numero}
                            </Box>
                          </Box>
                          <Box flex={1}>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{ color: '#1a1a2e', mb: 0.5 }}
                            >
                              {relatorio.titulo}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'text.secondary' }}
                            >
                              {relatorio.desc}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => baixarRelatorio(relatorio.tipo)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5,
                            bgcolor: relatorio.corBotao,
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            '&:hover': {
                              bgcolor: relatorio.corBotao,
                              filter: 'brightness(0.9)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }
                          }}
                        >
                          Baixar PDF
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Container>
      </Box>

      {/* Dialogs */}
      <Dialog open={dialogDespesa} onClose={() => { setDialogDespesa(false); setDespesaEditando(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{despesaEditando ? 'Editar Despesa' : 'Adicionar Despesa'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="Descrição"
              value={novaDespesa.descricao}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
            />
            <TextField
              fullWidth
              label="Valor Total"
              type="number"
              value={novaDespesa.valor}
              onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: parseFloat(e.target.value) })}
            />
            {!despesaEditando && (
              <TextField
                fullWidth
                label="Data da Despesa"
                type="date"
                value={novaDespesa.data_transacao}
                onChange={(e) => setNovaDespesa({ ...novaDespesa, data_transacao: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Esta data será usada na transação bancária"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogDespesa(false); setDespesaEditando(null); }}>Cancelar</Button>
          <Button onClick={salvarDespesa} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogTransacao} onClose={() => { setDialogTransacao(false); setTransacaoEditando(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{transacaoEditando ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={novaTransacao.tipo} label="Tipo" onChange={(e) => setNovaTransacao({ ...novaTransacao, tipo: e.target.value as any })}>
                <MenuItem value="debito">Débito</MenuItem>
                <MenuItem value="credito">Crédito</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Descrição"
              value={novaTransacao.descricao}
              onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })}
            />
            <TextField
              fullWidth
              label="Valor"
              type="number"
              value={novaTransacao.valor}
              onChange={(e) => setNovaTransacao({ ...novaTransacao, valor: parseFloat(e.target.value) })}
            />
            <TextField
              fullWidth
              label="Data"
              type="date"
              value={novaTransacao.data_transacao}
              onChange={(e) => setNovaTransacao({ ...novaTransacao, data_transacao: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={<Switch checked={novaTransacao.ratear_condominos} onChange={(e) => setNovaTransacao({ ...novaTransacao, ratear_condominos: e.target.checked })} />}
              label="Ratear com condôminos"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogTransacao(false); setTransacaoEditando(null); }}>Cancelar</Button>
          <Button onClick={salvarTransacao} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogMudarMes} onClose={() => { setDialogMudarMes(false); setTransacaoParaMudar(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Mudar Mês de Cobrança</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            {transacaoParaMudar && (
              <Alert severity="info">
                Movendo transação: <strong>{transacaoParaMudar.descricao}</strong><br />
                De: {transacaoParaMudar.mes}/{transacaoParaMudar.ano}<br />
                Valor: R$ {parseFloat(transacaoParaMudar.valor).toFixed(2)}
              </Alert>
            )}
            <FormControl fullWidth>
              <InputLabel>Novo Mês</InputLabel>
              <Select
                value={novoMesAno.mes}
                label="Novo Mês"
                onChange={(e) => setNovoMesAno({ ...novoMesAno, mes: parseInt(e.target.value as string) })}
              >
                <MenuItem value={1}>Janeiro</MenuItem>
                <MenuItem value={2}>Fevereiro</MenuItem>
                <MenuItem value={3}>Março</MenuItem>
                <MenuItem value={4}>Abril</MenuItem>
                <MenuItem value={5}>Maio</MenuItem>
                <MenuItem value={6}>Junho</MenuItem>
                <MenuItem value={7}>Julho</MenuItem>
                <MenuItem value={8}>Agosto</MenuItem>
                <MenuItem value={9}>Setembro</MenuItem>
                <MenuItem value={10}>Outubro</MenuItem>
                <MenuItem value={11}>Novembro</MenuItem>
                <MenuItem value={12}>Dezembro</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Novo Ano</InputLabel>
              <Select
                value={novoMesAno.ano}
                label="Novo Ano"
                onChange={(e) => setNovoMesAno({ ...novoMesAno, ano: parseInt(e.target.value as string) })}
              >
                {[2023, 2024, 2025, 2026, 2027].map(ano => (
                  <MenuItem key={ano} value={ano}>{ano}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogMudarMes(false); setTransacaoParaMudar(null); }}>Cancelar</Button>
          <Button onClick={mudarMesTransacao} variant="contained" color="primary">Mover</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogGas} onClose={() => setDialogGas(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Registrar Leituras de Gás - {mes}/{ano}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="Valor do m³ (R$)"
              type="number"
              value={valorM3}
              onChange={(e) => setValorM3(parseFloat(e.target.value))}
              helperText="Preço por metro cúbico"
            />
            {listaApartamentos.map(num => {
              const apto = num.toString().padStart(2, '0');
              const leituraAnterior = parseFloat(leiturasAnteriores[apto] || 0);
              const leituraAtual = parseFloat(leiturasInput[apto] || 0);
              const consumo = leituraAtual && leituraAnterior ? leituraAtual - leituraAnterior : 0;
              const valor = consumo && valorM3 ? consumo * valorM3 : 0;

              return (
                <Paper key={apto} elevation={2} sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#667eea', fontWeight: 600 }}>
                    Apartamento {apto}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Leitura Anterior"
                        type="number"
                        value={leiturasAnteriores[apto] || ''}
                        onChange={(e) => setLeiturasAnteriores({ ...leiturasAnteriores, [apto]: e.target.value })}
                        helperText="Default: mês anterior"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Leitura Atual"
                        type="number"
                        value={leiturasInput[apto] || ''}
                        onChange={(e) => setLeiturasInput({ ...leiturasInput, [apto]: e.target.value })}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Consumo (m³)"
                        value={consumo > 0 ? consumo.toFixed(2) : '0.00'}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            bgcolor: '#e8f5e9',
                            fontWeight: 600,
                            color: consumo > 0 ? '#2e7d32' : '#666'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Valor (R$)"
                        value={valor > 0 ? `R$ ${valor.toFixed(2)}` : 'R$ 0.00'}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            bgcolor: '#fff3e0',
                            fontWeight: 600,
                            color: valor > 0 ? '#e65100' : '#666'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogGas(false)}>Cancelar</Button>
          <Button onClick={salvarLeituras} variant="contained">Salvar Todas</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogExcluirIntervalo} onClose={() => setDialogExcluirIntervalo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Excluir Apartamentos em Intervalo</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Atenção!</strong> Esta ação irá excluir permanentemente os apartamentos do intervalo especificado.
          </Alert>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="De (Número)"
              type="text"
              value={intervaloExclusao.de}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '').substring(0, 3);
                setIntervaloExclusao({ ...intervaloExclusao, de: valor });
              }}
              helperText="Número inicial do intervalo (ex: 7)"
            />
            <TextField
              fullWidth
              label="Até (Número)"
              type="text"
              value={intervaloExclusao.ate}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '').substring(0, 3);
                setIntervaloExclusao({ ...intervaloExclusao, ate: valor });
              }}
              helperText="Número final do intervalo (ex: 10)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogExcluirIntervalo(false);
            setIntervaloExclusao({ de: '', ate: '' });
          }}>Cancelar</Button>
          <Button onClick={async () => {
            try {
              if (!intervaloExclusao.de || !intervaloExclusao.ate) {
                setMensagem({ tipo: 'error', texto: 'Preencha ambos os números do intervalo' });
                return;
              }
              const de = parseInt(intervaloExclusao.de);
              const ate = parseInt(intervaloExclusao.ate);
              if (de > ate) {
                setMensagem({ tipo: 'error', texto: 'O número inicial deve ser menor que o final' });
                return;
              }

              // Excluir apartamentos no intervalo
              for (let i = de; i <= ate; i++) {
                const apto = i.toString().padStart(2, '0');
                try {
                  await api.delete(`/condominos/${apto}`);
                } catch (err) {
                  console.log(`Apartamento ${apto} não existe ou já foi excluído`);
                }
              }

              setMensagem({ tipo: 'success', texto: `Apartamentos de ${de} até ${ate} excluídos!` });
              setDialogExcluirIntervalo(false);
              setIntervaloExclusao({ de: '', ate: '' });
              // Recarregar condôminos
              const res = await api.get('/condominos');
              setCondominos(res.data);
            } catch (err) {
              setMensagem({ tipo: 'error', texto: 'Erro ao excluir apartamentos' });
            }
          }} variant="contained" color="error">Excluir Intervalo</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogNovoApartamento} onClose={() => setDialogNovoApartamento(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Novo Apartamento</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="Número do Apartamento"
              type="text"
              value={novoApartamento.numero}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '').substring(0, 3); // Máximo 3 dígitos
                setNovoApartamento({ ...novoApartamento, numero: valor });
              }}
              helperText="Digite o número do apartamento (ex: 10, 15, 101)"
            />
            <TextField
              fullWidth
              label="Nome do Proprietário"
              value={novoApartamento.nome_proprietario}
              onChange={(e) => setNovoApartamento({ ...novoApartamento, nome_proprietario: e.target.value })}
              helperText="Opcional - pode ser preenchido depois"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogNovoApartamento(false);
            setNovoApartamento({ numero: '', nome_proprietario: '' });
          }}>Cancelar</Button>
          <Button onClick={async () => {
            try {
              if (!novoApartamento.numero) {
                setMensagem({ tipo: 'error', texto: 'Número do apartamento é obrigatório' });
                return;
              }
              const apto = novoApartamento.numero.padStart(2, '0');
              await api.put(`/condominos/${apto}`, {
                nome_proprietario: novoApartamento.nome_proprietario || `Proprietário Apto ${apto}`,
                nome_morador: null,
                telefone: null,
                email: null
              });
              setMensagem({ tipo: 'success', texto: 'Apartamento adicionado!' });
              setDialogNovoApartamento(false);
              setNovoApartamento({ numero: '', nome_proprietario: '' });
              // Recarregar condôminos
              const res = await api.get('/condominos');
              setCondominos(res.data);
            } catch (err) {
              setMensagem({ tipo: 'error', texto: 'Erro ao adicionar apartamento' });
            }
          }} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogEmail} onClose={() => setDialogEmail(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Email Permitido</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={novoEmail.email}
              onChange={(e) => setNovoEmail({ ...novoEmail, email: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Apartamento</InputLabel>
              <Select value={novoEmail.apartamento} label="Apartamento" onChange={(e) => setNovoEmail({ ...novoEmail, apartamento: e.target.value })}>
                {listaApartamentos.map(num => {
                  const apto = num.toString().padStart(2, '0');
                  return <MenuItem key={apto} value={apto}>{apto}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEmail(false)}>Cancelar</Button>
          <Button onClick={adicionarEmail} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Restaurar Backup */}
      <Dialog open={dialogRestaurar} onClose={() => setDialogRestaurar(false)} maxWidth="md" fullWidth>
        <DialogTitle>Restaurar Backup do Sistema</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>⚠️ ATENÇÃO:</strong> A restauração irá <strong>substituir TODOS os dados atuais</strong> pelos dados do backup selecionado.
            Esta ação <strong>NÃO pode ser desfeita!</strong>
          </Alert>

          {backupsDisponiveis.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nenhum backup disponível. Faça um backup primeiro.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecione o backup que deseja restaurar:
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Selecione um Backup</InputLabel>
                <Select
                  value={backupSelecionado}
                  onChange={(e) => setBackupSelecionado(e.target.value)}
                  label="Selecione um Backup"
                >
                  {backupsDisponiveis.map((backup) => (
                    <MenuItem key={backup.nome} value={backup.nome}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{backup.nome}</span>
                        <span style={{ color: '#666', fontSize: '0.9em' }}>
                          {new Date(backup.dataModificacao).toLocaleString('pt-BR')} - {(backup.tamanho / 1024).toFixed(2)} KB
                        </span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRestaurar(false)}>Cancelar</Button>
          <Button
            onClick={confirmarRestauracao}
            variant="contained"
            color="warning"
            disabled={!backupSelecionado}
          >
            Restaurar Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Segurança (Senha para Backup ou Restaurar) */}
      <Dialog open={dialogSeguranca} onClose={() => setDialogSeguranca(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {acaoSeguranca === 'backup' ? 'Confirmar Backup do Sistema' : 'Confirmar Restauração de Backup'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Por motivos de segurança, digite a senha para {acaoSeguranca === 'backup' ? 'fazer o backup' : 'restaurar o backup'}.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Senha de Segurança"
            value={senhaSeguranca}
            onChange={(e) => setSenhaSeguranca(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                confirmarSenhaSeguranca();
              }
            }}
            autoFocus
            helperText="Digite a senha de segurança para continuar"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSeguranca(false)}>Cancelar</Button>
          <Button
            onClick={confirmarSenhaSeguranca}
            variant="contained"
            color={acaoSeguranca === 'backup' ? 'success' : 'warning'}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backdrop de Loading para Backup/Restauração */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1000,
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}
        open={loading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {loadingMessage}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Não feche esta janela
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default DashboardAdmin;
