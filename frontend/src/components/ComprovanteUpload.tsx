import { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import {
  AttachFile,
  Close as CloseIcon,
  PictureAsPdf,
  Image as ImageIcon,
  Description
} from '@mui/icons-material';

interface ComprovanteUploadProps {
  onComprovanteChange: (comprovante: string | null, nome: string | null, tipo: string | null) => void;
  comprovanteInicial?: string | null;
  nomeInicial?: string | null;
  tipoInicial?: string | null;
}

const ComprovanteUpload = ({
  onComprovanteChange,
  comprovanteInicial,
  nomeInicial,
  tipoInicial
}: ComprovanteUploadProps) => {
  const [comprovante, setComprovante] = useState<string | null>(comprovanteInicial || null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(nomeInicial || null);
  const [tipoArquivo, setTipoArquivo] = useState<string | null>(tipoInicial || null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar tipo de arquivo
    const tiposAceitos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!tiposAceitos.includes(file.type)) {
      setError('Por favor, selecione uma imagem (JPG, PNG, GIF) ou PDF');
      return;
    }

    // Verificar tamanho (limite de 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setError('');

    // Ler arquivo como base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setComprovante(base64);
      setNomeArquivo(file.name);
      setTipoArquivo(file.type);
      onComprovanteChange(base64, file.name, file.type);
    };

    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setComprovante(null);
    setNomeArquivo(null);
    setTipoArquivo(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onComprovanteChange(null, null, null);
  };

  const getIconeArquivo = () => {
    if (!tipoArquivo) return <AttachFile />;

    if (tipoArquivo === 'application/pdf') {
      return <PictureAsPdf sx={{ color: '#d32f2f' }} />;
    } else if (tipoArquivo.startsWith('image/')) {
      return <ImageIcon sx={{ color: '#1976d2' }} />;
    }
    return <Description />;
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {!comprovante ? (
        <Button
          variant="outlined"
          startIcon={<AttachFile />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          size="small"
          sx={{
            borderColor: '#667eea',
            color: '#667eea',
            '&:hover': {
              borderColor: '#764ba2',
              backgroundColor: 'rgba(102, 126, 234, 0.04)'
            }
          }}
        >
          Anexar Comprovante
        </Button>
      ) : (
        <Paper elevation={2} sx={{ p: 1.5, position: 'relative' }}>
          <IconButton
            size="small"
            onClick={handleClear}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'white' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box display="flex" alignItems="center" gap={1}>
            {getIconeArquivo()}
            <Box flex={1}>
              <Typography variant="body2" fontWeight="500">
                {nomeArquivo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tipoArquivo === 'application/pdf' ? 'PDF' : 'Imagem'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1, py: 0 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ComprovanteUpload;
