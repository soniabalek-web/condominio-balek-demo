import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  PictureAsPdf,
  Download as DownloadIcon
} from '@mui/icons-material';

interface ComprovanteViewerProps {
  open: boolean;
  onClose: () => void;
  comprovante: string | null;
  nomeArquivo: string | null;
  tipoArquivo: string | null;
}

const ComprovanteViewer = ({
  open,
  onClose,
  comprovante,
  nomeArquivo,
  tipoArquivo
}: ComprovanteViewerProps) => {
  if (!comprovante || !tipoArquivo) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = comprovante;
    link.download = nomeArquivo || 'comprovante';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = tipoArquivo === 'application/pdf';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            {isPdf && <PictureAsPdf sx={{ color: '#d32f2f' }} />}
            <Typography variant="h6">{nomeArquivo || 'Comprovante'}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            width: '100%',
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            borderRadius: 1
          }}
        >
          {isPdf ? (
            <iframe
              src={comprovante}
              style={{
                width: '100%',
                height: '600px',
                border: 'none'
              }}
              title={nomeArquivo || 'Comprovante PDF'}
            />
          ) : (
            <img
              src={comprovante}
              alt={nomeArquivo || 'Comprovante'}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                objectFit: 'contain'
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
          Baixar
        </Button>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComprovanteViewer;
