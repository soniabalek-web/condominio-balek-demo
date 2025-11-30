# 🎯 AMBIENTE DEMO - Residencial Balek

> **Cópia independente do sistema para demonstração e testes**

---

## 📁 Estrutura Organizada

```
demo/
├── backend/              # Código backend (API Node.js)
│   ├── src/             # Código-fonte TypeScript
│   ├── dist/            # Código compilado
│   ├── uploads/         # Arquivos enviados
│   ├── .env.demo        # Variáveis de ambiente DEMO
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            # Código frontend (React)
│   ├── src/            # Código-fonte TypeScript
│   ├── dist/           # Build de produção
│   ├── .env.demo       # Variáveis de ambiente DEMO
│   ├── package.json
│   └── vite.config.ts
│
├── documentacao/        # 📖 LEIA AQUI PRIMEIRO!
│   ├── GUIA-DEPLOY-DEMO.md              # Guia completo passo-a-passo
│   ├── RESUMO-AMBIENTE-DEMO.txt         # Resumo rápido
│   ├── CHECKLIST-DEPLOY-DEMO.txt        # Checklist para imprimir
│   ├── README-DEMO.md                   # README do GitHub
│   └── ARQUIVOS-CRIADOS-PARA-DEMO.txt   # Lista de arquivos
│
├── scripts/             # Scripts de importação/exportação
│   ├── EXPORTAR-DADOS-PARA-DEMO.bat     # Exportar dados (Windows)
│   ├── exportar-dados-para-demo.sh      # Exportar dados (Linux/Mac)
│   └── IMPORTAR-DADOS-NO-DEMO.bat       # Importar dados (Windows)
│
├── render-demo.yaml     # Configuração do Render.com
└── README.md            # Este arquivo
```

---

## 🚀 Como Começar?

### 1️⃣ Leia a Documentação (10 min)

```bash
# Primeiro, leia o resumo
cat documentacao/RESUMO-AMBIENTE-DEMO.txt

# Depois, leia o guia completo
# Abra: documentacao/GUIA-DEPLOY-DEMO.md
```

### 2️⃣ Imprima o Checklist (opcional)

```bash
# Imprima para riscar conforme avança
# Arquivo: documentacao/CHECKLIST-DEPLOY-DEMO.txt
```

### 3️⃣ Siga os 6 Passos do Guia (30-40 min)

O guia tem tudo detalhado:
- Criar repositório GitHub
- Subir código
- Configurar Render.com
- Importar dados
- Configurar domínio demo.balek.de
- Testar tudo

---

## 🎯 O Que Você Terá no Final

```
Sistema REAL (produção)
├── URL: https://condominio.balek.de
├── Banco: balek-condominio-db
└── Uso: Seus dados reais

Sistema DEMO (testes)
├── URL: https://demo.balek.de
├── Banco: balek-demo-db
└── Uso: Usuários podem testar
```

**Ambos 100% independentes e funcionais!**

---

## 📊 Diferenças: Real vs Demo

| Item | Sistema Real | Sistema Demo |
|------|-------------|--------------|
| URL | condominio.balek.de | demo.balek.de |
| Backend | balek-backed.onrender.com | balek-demo-backend.onrender.com |
| Banco | balek-condominio-db | balek-demo-db |
| Senha Admin | Balek@Admin2025!Seguro | Demo@2025 |
| Dados | Reais (seu uso) | Cópia dos reais |
| Finalidade | Produção | Demonstração |

---

## 🔄 Como Usar os Scripts

### Exportar Dados do Sistema Real

**Windows:**
```bash
cd demo/scripts
EXPORTAR-DADOS-PARA-DEMO.bat
```

**Linux/Mac:**
```bash
cd demo/scripts
chmod +x exportar-dados-para-demo.sh
./exportar-dados-para-demo.sh
```

Isso cria um arquivo: `dados-para-demo-YYYYMMDD-HHMMSS.sql`

### Importar Dados no Sistema Demo

**Windows:**
```bash
cd demo/scripts
IMPORTAR-DADOS-NO-DEMO.bat
```

Siga as instruções na tela!

---

## ⚙️ Configurações Importantes

### Backend (.env.demo)

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=demo_jwt_secret_key_12345
ADMIN_DEFAULT_PASSWORD=Demo@2025
CORS_ORIGIN=https://demo.balek.de
```

### Frontend (.env.demo)

```env
VITE_API_URL=https://balek-demo-backend.onrender.com
```

### Render (render-demo.yaml)

Configuração automática para:
- Backend: balek-demo-backend
- Frontend: balek-demo-frontend
- Banco: balek-demo-db

---

## 📝 Ordem de Leitura Recomendada

1. **Este arquivo** (README.md) - Você está aqui! ✅
2. **documentacao/RESUMO-AMBIENTE-DEMO.txt** - Entender o conceito
3. **documentacao/GUIA-DEPLOY-DEMO.md** - Passos detalhados
4. **documentacao/CHECKLIST-DEPLOY-DEMO.txt** - Acompanhar progresso

---

## ⚠️ Lembretes Importantes

### Renovação Mensal do Banco

Assim como o banco real, o banco DEMO precisa renovação mensal:

```
📅 Todo dia 27 de cada mês:
1. Acesse: https://dashboard.render.com/
2. Clique em "balek-demo-db"
3. Clique em "Renew for free"
4. Pronto! ✅
```

### Resetar Dados do Demo

Se quiser voltar aos dados originais:

```bash
1. Execute: scripts/EXPORTAR-DADOS-PARA-DEMO.bat
2. Execute: scripts/IMPORTAR-DADOS-NO-DEMO.bat
3. Pronto! Dados resetados! ✅
```

---

## 🆘 Precisa de Ajuda?

1. Releia a documentação em `documentacao/`
2. Veja a seção "Problemas Comuns" no guia
3. Chame o Claude AI que ele te ajuda! 🤖

---

## ✅ Checklist Rápido

Antes de começar, certifique-se que você tem:

- [ ] Conta no GitHub (soniabalek-web)
- [ ] Conta no Render.com
- [ ] Acesso ao IONOS (para configurar demo.balek.de)
- [ ] PostgreSQL client instalado (para importar dados)
- [ ] 30-40 minutos disponíveis
- [ ] Café ou água ☕

---

## 🎉 Resultado Final

Quando terminar, você terá dois sistemas completamente independentes:

```
✅ condominio.balek.de (produção - seus dados)
✅ demo.balek.de (demonstração - cópia para testes)
```

Ambos:
- 🌐 Com domínio próprio
- 🔒 Com HTTPS automático
- ☁️ Hospedados gratuitamente
- 💯 Totalmente funcionais

---

**🚀 Bom trabalho e sucesso no deploy!**

---

*Criado automaticamente por Claude AI*
*Data: 30/11/2025*
