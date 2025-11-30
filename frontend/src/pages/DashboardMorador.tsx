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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  Avatar,
  Stack,
  Divider,
  TableContainer,
  Button
} from '@mui/material';
import {
  Logout,
  TrendingUp,
  AccountBalance,
  LocalFireDepartment,
  Description,
  Home as HomeIcon,
  CalendarMonth,
  PictureAsPdf
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { DespesaCondominio, ResumoMensal, Documento } from '../types';

interface Condomino {
  apartamento: string;
  nome_proprietario: string;
  email_proprietario: string;
  nome_morador: string;
  email_morador: string;
  telefone_proprietario: string;
  telefone_morador: string;
}

interface HistoricoMensal {
  mes: number;
  ano: number;
  valor_condominio: number;
  fundo_reserva: number;
  valor_gas: number;
  total: number;
}

const DashboardMorador: React.FC = () => {
  const { usuario, logout } = useAuth();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [despesas, setDespesas] = useState<DespesaCondominio[]>([]);
  const [resumo, setResumo] = useState<ResumoMensal | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [nomeCondominio, setNomeCondominio] = useState('Residencial Balek');
  const [condomino, setCondomino] = useState<Condomino | null>(null);
  const [historicoMensal, setHistoricoMensal] = useState<HistoricoMensal[]>([]);

  // Carregar nome do condomínio e dados do condômino ao montar componente
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const [configRes, condominoRes] = await Promise.all([
          api.get('/condominos/config/todas'),
          api.get(`/condominos/${usuario?.apartamento}`)
        ]);

        const nome = configRes.data.cond_nome || 'Residencial Balek';
        setNomeCondominio(nome);
        setCondomino(condominoRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    carregarDadosIniciais();
    carregarHistoricoMensal();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [mes, ano]);

  const carregarHistoricoMensal = async () => {
    try {
      // Gerar últimos 12 meses a partir da data atual
      const hoje = new Date();
      const mesesParaBuscar: { mes: number; ano: number }[] = [];

      for (let i = 0; i < 12; i++) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        mesesParaBuscar.push({
          mes: data.getMonth() + 1,
          ano: data.getFullYear()
        });
      }

      // Buscar dados de cada mês
      const historico: HistoricoMensal[] = [];

      for (const mesAno of mesesParaBuscar) {
        try {
          const resumoRes = await api.get(`/despesas/resumo/${mesAno.mes}/${mesAno.ano}`);

          const meuResumo = resumoRes.data.find(
            (r: ResumoMensal) => r.apartamento === usuario?.apartamento
          );

          if (meuResumo) {
            const valorCondominio = parseFloat(String(meuResumo.valor_condominio)) || 0;

            // Só adiciona se tiver valor de condomínio maior que zero
            if (valorCondominio > 0) {
              historico.push({
                mes: mesAno.mes,
                ano: mesAno.ano,
                valor_condominio: valorCondominio,
                fundo_reserva: parseFloat(String(meuResumo.fundo_reserva)) || 0,
                valor_gas: parseFloat(String(meuResumo.valor_gas)) || 0,
                total: parseFloat(String(meuResumo.total)) || 0
              });
            }
          }
        } catch (error) {
          // Se não houver dados para este mês, apenas pula para o próximo
        }
      }

      setHistoricoMensal(historico.reverse());
    } catch (error) {
      console.error('Erro ao carregar histórico mensal:', error);
    }
  };

  const carregarDados = async () => {
    try {
      const [despesasRes, resumoRes, docsRes] = await Promise.all([
        api.get(`/despesas/condominio/${mes}/${ano}`),
        api.get(`/despesas/resumo/${mes}/${ano}`),
        api.get(`/documentos/${mes}/${ano}`)
      ]);

      setDespesas(despesasRes.data);

      const meuApto = usuario?.apartamento;
      const meuResumo = resumoRes.data.find((r: any) => r.apartamento === meuApto);

      setResumo(meuResumo || null);

      setDocumentos(docsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const downloadDocumento = async (id: number) => {
    try {
      const response = await api.get(`/documentos/download/${id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documento-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
    }
  };

  const downloadBoletoPDF = async (mes: number, ano: number) => {
    try {
      console.log('Baixando boleto:', { apartamento: usuario?.apartamento, mes, ano });
      const url = `/boletos/pdf/${mes}/${ano}/${usuario?.apartamento}`;
      console.log('URL do boleto:', url);

      const response = await api.get(url, {
        responseType: 'blob'
      });

      console.log('Resposta recebida:', response);

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `boleto-apto${usuario?.apartamento}-${mes}-${ano}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      console.log('Boleto baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar boleto:', error);
      alert('Erro ao baixar boleto. Verifique se existe boleto para este mês.');
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <HomeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {nomeCondominio}
          </Typography>
          {condomino && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Apartamento {condomino.apartamento}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {condomino.nome_proprietario || condomino.nome_morador || usuario?.nome}
                </Typography>
                {condomino.email_proprietario && (
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {condomino.email_proprietario}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Informações do Acesso */}
        {condomino && (
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            bgcolor: '#fff5f7',
            mb: 3,
            border: '1px solid #ffe0e6'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem', color: '#000' }}>
                      Usuário Logado
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#000' }}>
                      {condomino.nome_proprietario || condomino.nome_morador || usuario?.nome}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                      Apartamento {condomino.apartamento} • {condomino.email_proprietario || condomino.email_morador || usuario?.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem', color: '#000' }}>
                      Acesso em
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#000' }}>
                      {new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#333' }}>
                      {new Date().toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box mb={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mês</InputLabel>
                <Select
                  value={mes}
                  label="Mês"
                  onChange={(e) => setMes(Number(e.target.value))}
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                >
                  {meses.map((m, i) => (
                    <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ano</InputLabel>
                <Select
                  value={ano}
                  label="Ano"
                  onChange={(e) => setAno(Number(e.target.value))}
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                >
                  {[2024, 2025, 2026, 2027].map((a) => (
                    <MenuItem key={a} value={a}>{a}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ color: '#667eea' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                  {meses[mes - 1]} de {ano}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {resumo && (
          <Grid container spacing={2} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#e3f2fd' }}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                    Condomínio+Água
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {formatarMoeda(resumo.valor_condominio)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#f1f8e9' }}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                    Fundo Reserva
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#388e3c' }}>
                    {formatarMoeda(resumo.fundo_reserva || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#ffebee' }}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                    Gás
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#d32f2f' }}>
                    {formatarMoeda(resumo.valor_gas)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: '#fff3e0' }}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                    Total a Pagar
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#e65100' }}>
                    {formatarMoeda(resumo.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Detalhamento das Despesas */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1a1a2e', mb: 3 }}>
              Detalhamento das Despesas - {meses[mes - 1]}/{ano}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#ffebee' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>Descrição</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f' }}>Valor Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f' }}>Sua Parte</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {despesas.map((despesa, index) => (
                    <TableRow key={despesa.id} sx={{ bgcolor: index % 2 === 0 ? '#ffffff' : '#fff5f5' }}>
                      <TableCell>{despesa.descricao}</TableCell>
                      <TableCell align="right">{formatarMoeda(despesa.valor)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatarMoeda(despesa.valor_por_apto)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Subtotal Condomínio */}
                  <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1565c0' }}>SUBTOTAL CONDOMÍNIO</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>
                      {formatarMoeda(despesas.reduce((sum, d) => sum + parseFloat(String(d.valor)), 0))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>
                      {resumo ? formatarMoeda(resumo.valor_condominio) : '-'}
                    </TableCell>
                  </TableRow>

                  {/* Fundo de Reserva */}
                  {resumo && (
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#555' }}>Fundo de Reserva</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#333' }}>
                        {formatarMoeda(Number(resumo.fundo_reserva || 0))}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Gás */}
                  {resumo && (
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#555' }}>Gás</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#333' }}>
                        {formatarMoeda(resumo.valor_gas)}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Total Geral */}
                  {resumo && (
                    <TableRow sx={{ bgcolor: '#fff3e0' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#e65100' }}>
                        TOTAL GERAL
                      </TableCell>
                      <TableCell align="right"></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#e65100' }}>
                        {formatarMoeda(resumo.total)}
                      </TableCell>
                    </TableRow>
                  )}

                  {despesas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Nenhuma despesa lançada para este período
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Histórico Mensal - 12 meses */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1a1a2e', mb: 3 }}>
              Histórico de Cobranças - Últimos 12 Meses
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1565c0' }}>Mês/Ano</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>Cond.+Água</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>F. Reserva</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>Gás</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#1565c0' }}>Boleto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historicoMensal.length > 0 ? (
                    <>
                      {historicoMensal.map((h, index) => (
                        <TableRow key={index} sx={{ bgcolor: index % 2 === 0 ? '#ffffff' : '#f5f5f5' }}>
                          <TableCell>
                            <Chip
                              label={`${meses[h.mes - 1]}/${h.ano}`}
                              size="small"
                              sx={{ fontWeight: 600, bgcolor: '#e3f2fd', color: '#1565c0' }}
                            />
                          </TableCell>
                          <TableCell align="right">{formatarMoeda(h.valor_condominio)}</TableCell>
                          <TableCell align="right">{formatarMoeda(h.fundo_reserva)}</TableCell>
                          <TableCell align="right">{formatarMoeda(h.valor_gas)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatarMoeda(h.total)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => downloadBoletoPDF(h.mes, h.ano)}
                              title="Baixar Boleto PDF"
                              size="small"
                            >
                              <PictureAsPdf />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Linha de Totais */}
                      <TableRow sx={{ bgcolor: '#bbdefb' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1565c0' }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>
                          {formatarMoeda(
                            historicoMensal.reduce((sum, h) => sum + h.valor_condominio, 0)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>
                          {formatarMoeda(
                            historicoMensal.reduce((sum, h) => sum + h.fundo_reserva, 0)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0' }}>
                          {formatarMoeda(
                            historicoMensal.reduce((sum, h) => sum + h.valor_gas, 0)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1565c0' }}>
                          {formatarMoeda(
                            historicoMensal.reduce((sum, h) => sum + h.total, 0)
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Nenhum histórico disponível
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Documentos e Recibos */}
        {documentos.length > 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Description sx={{ mr: 1, color: '#667eea' }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: '#1a1a2e' }}>
                  Documentos e Recibos
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {documentos.map((doc) => (
                  <Paper
                    key={doc.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#f8f9fa',
                        cursor: 'pointer',
                        borderColor: '#667eea'
                      }
                    }}
                    onClick={() => downloadDocumento(doc.id)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {doc.nome_arquivo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.tipo} • {doc.descricao || 'Sem descrição'}
                        </Typography>
                      </Box>
                      <PictureAsPdf color="primary" />
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default DashboardMorador;
