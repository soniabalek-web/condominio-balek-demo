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

  // Função para pré-processar a imagem (inverter cores, aumentar contraste e binarizar)
  const preprocessImage = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Aumentar escala para melhorar OCR
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Desenhar imagem original em escala maior
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Obter pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Passo 1: Inverter cores + Aumentar contraste + Binarização
        for (let i = 0; i < data.length; i += 4) {
          // Inverter cores
          let r = 255 - data[i];
          let g = 255 - data[i + 1];
          let b = 255 - data[i + 2];

          // Converter para escala de cinza
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Binarização com threshold (preto ou branco puro)
          // Threshold ajustado para destacar texto que era branco (agora preto após inversão)
          const threshold = 128;
          const binarized = gray < threshold ? 0 : 255;

          data[i] = binarized;     // R
          data[i + 1] = binarized; // G
          data[i + 2] = binarized; // B
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
          // Estratégia 1: Procurar por 8 dígitos que começam com zeros (00073080)
          // Este é o padrão mais confiável do medidor LAO
          for (const num of todosNumeros) {
            if (num.length === 8 && num.startsWith('000')) {
              // Remover zeros à esquerda dos primeiros 5 dígitos
              const parte1 = num.substring(0, 5); // 00073
              const parte2 = num.substring(5, 8); // 080
              const parte1Limpa = parseInt(parte1, 10).toString(); // 73

              leituraEncontrada = `${parte1Limpa}.${parte2}`;
              console.log(`✓ Estratégia 1 - Número de 8 dígitos com zeros: ${num} → ${leituraEncontrada}`);
              break;
            }
          }

          // Estratégia 2: Procurar por 5-6 dígitos que começam com zero
          if (!leituraEncontrada) {
            for (const num of todosNumeros) {
              if ((num.length === 5 || num.length === 6) && num.startsWith('0')) {
                // Remover zeros à esquerda
                const numLimpo = num.replace(/^0+/, '');

                if (numLimpo.length === 4 || numLimpo.length === 5) {
                  const parteInteira = numLimpo.substring(0, numLimpo.length - 3);
                  const parteDecimal = numLimpo.substring(numLimpo.length - 3);

                  leituraEncontrada = `${parteInteira}.${parteDecimal}`;
                  console.log(`✓ Estratégia 2 - Número de ${num.length} dígitos com zero inicial: ${num} → ${leituraEncontrada}`);
                  break;
                }
              }
            }
          }

          // Estratégia 3: Procurar por 5 dígitos sem zero inicial (73080)
          if (!leituraEncontrada) {
            for (const num of todosNumeros) {
              if (num.length === 5 && !num.startsWith('0')) {
                const parteInteira = num.substring(0, 2);
                const parteDecimal = num.substring(2, 5);

                leituraEncontrada = `${parteInteira}.${parteDecimal}`;
                console.log(`✓ Estratégia 3 - Número de 5 dígitos: ${num} → ${leituraEncontrada}`);
                break;
              }
            }
          }

          // Estratégia 4: Procurar por dois grupos consecutivos (2-3 dígitos + 3 dígitos)
          if (!leituraEncontrada) {
            for (let i = 0; i < todosNumeros.length - 1; i++) {
              const num1 = todosNumeros[i];
              const num2 = todosNumeros[i + 1];

              // Padrão: num1 (2-3 dígitos) + num2 (exatamente 3 dígitos)
              // Evitar número do apartamento (01-06) pegando apenas se num1 >= 2 dígitos
              if (num1.length >= 2 && num1.length <= 3 && num2.length === 3) {
                // Remover zeros à esquerda de num1
                const num1Limpo = parseInt(num1, 10).toString();

                leituraEncontrada = `${num1Limpo}.${num2}`;
                console.log(`✓ Estratégia 4 - Dois grupos: ${num1} + ${num2} → ${leituraEncontrada}`);
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
