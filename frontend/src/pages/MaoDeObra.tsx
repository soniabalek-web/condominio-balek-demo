import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import api from '../services/api';

interface MaoDeObra {
  id: number;
  tipo: string;
  nome: string;
  endereco?: string;
  contato?: string;
  telefone?: string;
  email?: string;
  pessoa_contato?: string;
  observacoes?: string;
}

const MaoDeObra = () => {
  const [profissionais, setProfissionais] = useState<MaoDeObra[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);

  // Função para obter cor do tipo (cores pasteis suaves)
  const getCorTipo = (tipo: string) => {
    const cores: { [key: string]: { bg: string; text: string } } = {
      'Informática': { bg: '#E0F2F1', text: '#004D40' },
      'Jardinagem': { bg: '#E8F5E9', text: '#2E7D32' },
      'Construção': { bg: '#FFF3E0', text: '#E65100' },
      'Pedreiros': { bg: '#EFEBE9', text: '#4E342E' },
      'Eletricistas': { bg: '#FFFDE7', text: '#F57F17' },
      'Encanador': { bg: '#E1F5FE', text: '#01579B' },
      'Pintor': { bg: '#F3E5F5', text: '#6A1B9A' },
      'Faz Tudo': { bg: '#FFE0E0', text: '#C62828' },
      'Manutenção em Geral': { bg: '#EDE7F6', text: '#4A148C' },
      'Outros': { bg: '#F5F5F5', text: '#616161' }
    };
    return cores[tipo] || { bg: '#F5F5F5', text: '#616161' };
  };

  const [dialogAberto, setDialogAberto] = useState(false);
  const [profissionalEditando, setProfissionalEditando] = useState<MaoDeObra | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    nome: '',
    endereco: '',
    contato: '',
    telefone: '',
    email: '',
    pessoa_contato: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarProfissionais();
    carregarTipos();
  }, []);

  const carregarProfissionais = async () => {
    try {
      const response = await api.get('/mao-de-obra');
      setProfissionais(response.data);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const carregarTipos = async () => {
    try {
      const response = await api.get('/mao-de-obra/tipos');
      setTipos(response.data);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    }
  };

  const abrirDialog = (profissional?: MaoDeObra) => {
    if (profissional) {
      setProfissionalEditando(profissional);
      setFormData({
        tipo: profissional.tipo,
        nome: profissional.nome,
        endereco: profissional.endereco || '',
        contato: profissional.contato || '',
        telefone: profissional.telefone || '',
        email: profissional.email || '',
        pessoa_contato: profissional.pessoa_contato || '',
        observacoes: profissional.observacoes || ''
      });
    } else {
      setProfissionalEditando(null);
      setFormData({
        tipo: '',
        nome: '',
        endereco: '',
        contato: '',
        telefone: '',
        email: '',
        pessoa_contato: '',
        observacoes: ''
      });
    }
    setDialogAberto(true);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    setProfissionalEditando(null);
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const salvar = async () => {
    try {
      if (profissionalEditando) {
        await api.put(`/mao-de-obra/${profissionalEditando.id}`, formData);
      } else {
        await api.post('/mao-de-obra', formData);
      }
      carregarProfissionais();
      fecharDialog();
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
    }
  };

  const excluir = async (id: number) => {
    if (window.confirm('Deseja realmente excluir este profissional?')) {
      try {
        await api.delete(`/mao-de-obra/${id}`);
        carregarProfissionais();
      } catch (error) {
        console.error('Erro ao excluir profissional:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon /> Mão de Obra
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => abrirDialog()}
        >
          Novo Profissional de Mão de Obra
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profissionais.map((profissional) => {
              const cor = getCorTipo(profissional.tipo);
              return (
                <TableRow key={profissional.id}>
                  <TableCell>
                    <Chip
                      label={profissional.tipo}
                      size="small"
                      sx={{
                        backgroundColor: cor.bg,
                        color: cor.text,
                        fontWeight: 600,
                        width: '180px',
                        justifyContent: 'center',
                        '& .MuiChip-label': {
                          px: 2,
                          display: 'block',
                          textAlign: 'center'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{profissional.nome}</TableCell>
                  <TableCell>{profissional.contato || '-'}</TableCell>
                  <TableCell>{profissional.telefone || '-'}</TableCell>
                  <TableCell>{profissional.email || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => abrirDialog(profissional)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => excluir(profissional.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {profissionalEditando ? 'Editar Profissional' : 'Novo Profissional de Mão de Obra'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo *</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  label="Tipo *"
                >
                  {tipos.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome *"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contato"
                name="contato"
                value={formData.contato}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pessoa de Contato"
                name="pessoa_contato"
                value={formData.pessoa_contato}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                name="observacoes"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog}>Cancelar</Button>
          <Button onClick={salvar} variant="contained" disabled={!formData.tipo || !formData.nome}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaoDeObra;
