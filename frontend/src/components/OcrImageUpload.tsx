import { useState, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import {
  CameraAlt,
  Close as CloseIcon,
  CheckCircle,
  Warning as WarningIcon
} from '@mui/icons-material';
import Tesseract from 'tesseract.js';

interface OcrImageUploadProps {
  onOcrComplete: (text: string) => void;
  apartamento: string;
}

const OcrImageUpload = ({ onOcrComplete, apartamento }: OcrImageUploadProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [apartamentoWarning, setApartamentoWarning] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para pré-processar a imagem (inverter cores para melhorar OCR de texto branco)
  const preprocessImage = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = img.width;
        canvas.height = img.height;

        // Desenhar imagem original
        ctx.drawImage(img, 0, 0);

        // Obter pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Inverter cores (branco vira preto, preto vira branco)
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];       // R
          data[i + 1] = 255 - data[i + 1]; // G
          data[i + 2] = 255 - data[i + 2]; // B
          // Alpha permanece o mesmo
        }

        // Aplicar imagem processada
        ctx.putImageData(imageData, 0, 0);

        // Converter para base64
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    setError('');
    setApartamentoWarning('');
    setLoading(true);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setImage(imageData);

      try {
        // Pré-processar imagem: inverter cores para texto branco ficar preto
        console.log('Pré-processando imagem (invertendo cores)...');
        const processedImage = await preprocessImage(imageData);

        // Executar OCR na imagem processada
        const result = await Tesseract.recognize(
          processedImage,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
              }
            }
          }
        );

        const text = result.data.text;
        console.log('Texto OCR completo:', text);
        console.log('Texto OCR (caracteres):', text.split('').map(c => `'${c}'(${c.charCodeAt(0)})`).join(' '));

        let leituraEncontrada = '';

        // Extrair todos os números da imagem
        const todosNumeros = text.match(/\d+/g);
        console.log('Todos os números encontrados:', todosNumeros);

        if (todosNumeros) {
          // Estratégia 1: Procurar por sequência de exatamente 4-6 dígitos (não mais que isso)
          // O medidor tem 5 dígitos (73080), outros números são muito maiores
          const sequenciasValidas: string[] = [];

          for (const num of todosNumeros) {
            // Aceitar apenas números de 4 a 6 dígitos (ignora números grandes como código de barras)
            if (num.length >= 4 && num.length <= 6) {
              sequenciasValidas.push(num);
              console.log(`Sequência válida encontrada: ${num} (${num.length} dígitos)`);
            }
          }

          // Se encontrou sequências válidas, pegar a MENOR (medidor é menor que código de barras)
          if (sequenciasValidas.length > 0) {
            // Ordenar por tamanho (menor primeiro)
            sequenciasValidas.sort((a, b) => a.length - b.length);
            const candidato = sequenciasValidas[0];

            console.log(`Candidato escolhido: ${candidato}`);

            // Formatar: se 5-6 dígitos: XX.XXX, se 4: X.XXX
            if (candidato.length === 6) {
              leituraEncontrada = `${candidato.substring(0, 3)}.${candidato.substring(3)}`;
            } else if (candidato.length === 5) {
              leituraEncontrada = `${candidato.substring(0, 2)}.${candidato.substring(2)}`;
            } else if (candidato.length === 4) {
              leituraEncontrada = `${candidato.substring(0, 1)}.${candidato.substring(1)}`;
            }
            console.log('Estratégia 1 - Sequência de dígitos (menor válida):', leituraEncontrada);
          }

          // Estratégia 2: Procurar por dois grupos consecutivos (1-3 dígitos + exatamente 3 dígitos)
          if (!leituraEncontrada) {
            for (let i = 0; i < todosNumeros.length - 1; i++) {
              const num1 = todosNumeros[i];
              const num2 = todosNumeros[i + 1];

              // Verificar padrão: num1 (1-3 dígitos) + num2 (exatamente 3 dígitos)
              if (num1.length >= 1 && num1.length <= 3 && num2.length === 3) {
                leituraEncontrada = `${num1}.${num2}`;
                console.log('Estratégia 2 - Dois grupos consecutivos:', leituraEncontrada);
                break;
              }
            }
          }
        }

        if (leituraEncontrada) {
          setOcrResult(leituraEncontrada.replace('.', ','));
          onOcrComplete(leituraEncontrada);
        } else {
          setError('Não foi possível identificar a leitura. Por favor, digite manualmente.');
        }

        // Validar número do apartamento na imagem
        // Procurar por números pequenos (01-06) que indicam o apartamento
        const aptosNaImagem = text.match(/\b0?[1-6]\b/g);
        if (aptosNaImagem && leituraEncontrada) {
          const aptosFormatados = aptosNaImagem.map(a => a.padStart(2, '0'));
          const apartamentoEsperado = apartamento.padStart(2, '0');

          // Verificar se o apartamento esperado está na imagem
          if (!aptosFormatados.includes(apartamentoEsperado)) {
            const aptosEncontrados = aptosFormatados.join(', ');
            setApartamentoWarning(`⚠️ Apartamento na foto (${aptosEncontrados}) diferente do selecionado (${apartamentoEsperado})`);
          }
        }

      } catch (err) {
        console.error('Erro no OCR:', err);
        setError('Erro ao processar a imagem. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setImage(null);
    setOcrResult('');
    setError('');
    setApartamentoWarning('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {!image ? (
        <Button
          variant="outlined"
          startIcon={<CameraAlt />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          size="small"
          sx={{
            mb: 1,
            borderColor: '#667eea',
            color: '#667eea',
            '&:hover': {
              borderColor: '#764ba2',
              backgroundColor: 'rgba(102, 126, 234, 0.04)'
            }
          }}
        >
          Fotografar Medidor
        </Button>
      ) : (
        <Paper elevation={2} sx={{ p: 1, mb: 1, position: 'relative' }}>
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

          <Box
            component="img"
            src={image}
            alt="Medidor"
            sx={{
              width: '100%',
              height: 120,
              objectFit: 'contain',
              borderRadius: 1,
              mb: 1
            }}
          />

          {loading && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <CircularProgress size={20} />
              <Typography variant="caption" color="text.secondary">
                Lendo números...
              </Typography>
            </Box>
          )}

          {ocrResult && !loading && (
            <Alert
              icon={<CheckCircle fontSize="small" />}
              severity="success"
              sx={{ py: 0, mb: apartamentoWarning ? 1 : 0 }}
            >
              Leitura: {ocrResult} m³
            </Alert>
          )}

          {apartamentoWarning && !loading && (
            <Alert
              icon={<WarningIcon fontSize="small" />}
              severity="warning"
              sx={{ py: 0, fontSize: '0.85rem' }}
            >
              {apartamentoWarning}
            </Alert>
          )}

          {error && !loading && (
            <Alert severity="error" sx={{ py: 0 }}>
              {error}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default OcrImageUpload;
