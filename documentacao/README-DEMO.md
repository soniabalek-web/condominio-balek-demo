# 🎯 Sistema de Gestão de Condomínio - Ambiente DEMO

> **Ambiente de demonstração do Residencial Balek**
> Este é um ambiente separado para testes e treinamento

---

## 🌐 Acessar o Sistema

**URL:** https://demo.balek.de

**Credenciais de Acesso:**
- **Email:** admin@residencialbalek.com
- **Senha:** Demo@2025

---

## 📊 Sobre Este Ambiente

Este é um **ambiente de demonstração** completamente separado do sistema de produção.

### Características:

- ✅ **Isolado:** Não afeta o sistema real
- ✅ **Dados Reais:** Cópia dos dados do sistema de produção
- ✅ **Livre para Testar:** Explore todas as funcionalidades
- ✅ **Resetável:** Os dados podem ser restaurados a qualquer momento
- ✅ **Gratuito:** Hospedado no Render.com (plano free)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Vite)       │
│  https://demo.balek.de                      │
│  Hospedado: Render Static Site              │
└────────────────┬────────────────────────────┘
                 │
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────┐
│  Backend (Node.js + Express + TypeScript)   │
│  https://balek-demo-backend.onrender.com    │
│  Hospedado: Render Web Service              │
└────────────────┬────────────────────────────┘
                 │
                 │ SQL Queries
                 ▼
┌─────────────────────────────────────────────┐
│  Database (PostgreSQL 16)                   │
│  balek-demo-db                              │
│  Hospedado: Render PostgreSQL               │
└─────────────────────────────────────────────┘
```

---

## 🚀 Stack Tecnológico

### Backend
- Node.js 18+
- TypeScript 5.3
- Express 4.18
- PostgreSQL (pg 8.11)
- JWT para autenticação
- bcrypt para senhas
- PDFKit para relatórios
- Multer para uploads

### Frontend
- React 18.2
- TypeScript 5.3
- Vite 5.0
- Material-UI 5.15
- Axios para HTTP
- Recharts para gráficos
- React Router 6.20

### Infraestrutura
- **Hospedagem:** Render.com (Oregon, US West)
- **Banco de Dados:** PostgreSQL 16
- **Domínio:** demo.balek.de (IONOS)
- **SSL/HTTPS:** Automático via Render
- **Deploy:** Automático via GitHub

---

## 📁 Estrutura do Projeto

```
condominio-balek-demo/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (DB)
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── middleware/      # Autenticação
│   │   ├── routes/          # Rotas da API
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilitários
│   │   └── server.ts        # Entry point
│   ├── uploads/             # Arquivos enviados
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos (Auth)
│   │   ├── pages/           # Páginas principais
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Roteamento
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── render-demo.yaml         # Configuração Render
```

---

## 🔐 Segurança

### Implementado:

- ✅ Autenticação JWT com expiração
- ✅ Senhas criptografadas (bcrypt, 10 rounds)
- ✅ Middleware de proteção de rotas
- ✅ CORS configurado (whitelist)
- ✅ Headers de segurança (CSP, X-Frame-Options, etc.)
- ✅ Validação de tipos de arquivo em uploads
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ HTTPS obrigatório em produção

### ⚠️ Atenção:

Este ambiente usa credenciais de **demonstração**:
- JWT_SECRET simplificado (não use em produção!)
- Senha admin padrão: `Demo@2025`
- Logs habilitados para debug

**NÃO use este código para produção real sem revisar a segurança!**

---

## 📚 Funcionalidades

### Para Administradores:

1. **Gestão de Despesas**
   - Despesas fixas mensais
   - Despesas parceladas
   - Categorias personalizadas
   - Rateio automático por apartamento

2. **Controle Bancário**
   - Lançamento de transações
   - Conferência de saldo
   - Histórico mensal
   - Relatórios financeiros

3. **Gestão de Gás**
   - Registro de leituras
   - Cálculo automático de consumo
   - Histórico por apartamento
   - Relatórios de 12 meses

4. **Documentos**
   - Upload de recibos/notas
   - Organização por mês
   - Download de documentos

5. **Relatórios em PDF**
   - Extrato bancário
   - Relatório de despesas
   - Relatório de gás
   - Relatório de devedores

6. **Boletos**
   - Geração de boletos
   - QR Code PIX integrado
   - Personalização por apartamento

### Para Moradores:

1. **Visualização de Cobranças**
   - Valor do condomínio
   - Consumo de gás
   - Fundo de reserva
   - Total a pagar

2. **Histórico**
   - Últimos 12 meses
   - Gráficos de consumo
   - Despesas detalhadas

3. **Documentos**
   - Download de recibos
   - Notas fiscais

4. **Boletos**
   - Download do boleto mensal
   - QR Code PIX para pagamento

---

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Git

### Instalação

```bash
# Clonar repositório
git clone https://github.com/soniabalek-web/condominio-balek-demo.git
cd condominio-balek-demo

# Backend
cd backend
npm install
cp .env.demo .env
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
cp .env.demo .env
npm run dev
```

### Variáveis de Ambiente

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=demo_jwt_secret_key
ADMIN_DEFAULT_PASSWORD=Demo@2025
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
```

---

## 🔄 Deploy

### Deploy Automático

Este projeto está configurado para deploy automático no Render.com via `render-demo.yaml`.

Qualquer push para a branch `main` dispara um novo deploy.

### Deploy Manual

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Servir ./dist com servidor estático
```

---

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/registrar` - Registro de morador
- `GET /api/auth/emails-permitidos` - Listar emails
- `POST /api/auth/emails-permitidos` - Adicionar email

### Despesas
- `GET /api/despesas/condominio/:mes/:ano` - Listar
- `POST /api/despesas/condominio` - Criar
- `PUT /api/despesas/condominio/:id` - Atualizar
- `DELETE /api/despesas/condominio/:id` - Excluir

### Banco
- `GET /api/banco/transacoes/:mes/:ano` - Listar
- `POST /api/banco/transacoes` - Criar
- `GET /api/banco/saldo/:mes/:ano` - Obter saldo
- `POST /api/banco/conferir-saldo/:mes/:ano` - Conferir

### Gás
- `GET /api/gas/leituras/:mes/:ano` - Listar
- `POST /api/gas/leituras` - Registrar
- `POST /api/gas/leituras/lote` - Registrar em lote

### Documentos
- `POST /api/documentos/upload` - Upload
- `GET /api/documentos/:mes/:ano` - Listar
- `GET /api/documentos/download/:id` - Download

### Relatórios
- `GET /api/relatorios/extrato-bancario/:mes/:ano`
- `GET /api/relatorios/despesas/:mes/:ano`
- `GET /api/relatorios/gas-12meses`

### Boletos
- `GET /api/boletos/pdf/:mes/:ano/:apartamento`

---

## 🔧 Manutenção

### Renovação Mensal do Banco

O banco PostgreSQL no plano gratuito precisa ser renovado mensalmente:

1. Acesse: https://dashboard.render.com/
2. Clique em `balek-demo-db`
3. Clique em **"Renew for free"**
4. Pronto! Renovado por mais 30 dias

⏰ **Configure lembrete para dia 27 de cada mês!**

### Resetar Dados

Para voltar aos dados originais:

1. Execute no sistema real: `EXPORTAR-DADOS-PARA-DEMO.bat`
2. Execute: `IMPORTAR-DADOS-NO-DEMO.bat`
3. Dados restaurados!

---

## 🆘 Suporte

### Problemas Comuns

**Backend não inicia:**
- Verifique se o `DATABASE_URL` está correto
- Verifique os logs no Render Dashboard

**Frontend não carrega:**
- Verifique se `VITE_API_URL` aponta para o backend correto
- Verifique se o build foi bem-sucedido

**Dados não aparecem:**
- Verifique se a importação dos dados foi concluída
- Acesse o banco via psql e verifique as tabelas

### Logs

**Ver logs do backend:**
```bash
# No Render Dashboard
Clique em "balek-demo-backend" → Aba "Logs"
```

**Ver logs do frontend:**
```bash
# No Render Dashboard
Clique em "balek-demo-frontend" → Aba "Logs"
```

---

## 📄 Licença

MIT

---

## 👥 Equipe

Desenvolvido para o **Residencial Balek**

---

## 🔗 Links Úteis

- **Sistema Demo:** https://demo.balek.de
- **Sistema Real:** https://condominio.balek.de
- **Dashboard Render:** https://dashboard.render.com/
- **GitHub Repo:** https://github.com/soniabalek-web/condominio-balek-demo

---

**Última atualização:** Novembro 2025
