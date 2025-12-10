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
  Store as StoreIcon
} from '@mui/icons-material';
import api from '../services/api';

interface Fornecedor {
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

const Fornecedores = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);
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
    carregarFornecedores();
    carregarTipos();
  }, []);

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/fornecedores');
      setFornecedores(response.data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const carregarTipos = async () => {
    try {
      const response = await api.get('/fornecedores/tipos');
      setTipos(response.data);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    }
  };

  const abrirDialog = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setFornecedorEditando(fornecedor);
      setFormData({
        tipo: fornecedor.tipo,
        nome: fornecedor.nome,
        endereco: fornecedor.endereco || '',
        contato: fornecedor.contato || '',
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        pessoa_contato: fornecedor.pessoa_contato || '',
        observacoes: fornecedor.observacoes || ''
      });
    } else {
      setFornecedorEditando(null);
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
    setFornecedorEditando(null);
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const salvar = async () => {
    try {
      if (fornecedorEditando) {
        await api.put(`/fornecedores/${fornecedorEditando.id}`, formData);
      } else {
        await api.post('/fornecedores', formData);
      }
      carregarFornecedores();
      fecharDialog();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  };

  const excluir = async (id: number) => {
    if (window.confirm('Deseja realmente excluir este fornecedor?')) {
      try {
        await api.delete(`/fornecedores/${id}`);
        carregarFornecedores();
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon /> Fornecedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => abrirDialog()}
        >
          Novo Fornecedor
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
            {fornecedores.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell>
                  <Chip label={fornecedor.tipo} size="small" color="primary" />
                </TableCell>
                <TableCell>{fornecedor.nome}</TableCell>
                <TableCell>{fornecedor.contato || '-'}</TableCell>
                <TableCell>{fornecedor.telefone || '-'}</TableCell>
                <TableCell>{fornecedor.email || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => abrirDialog(fornecedor)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => excluir(fornecedor.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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

export default Fornecedores;
