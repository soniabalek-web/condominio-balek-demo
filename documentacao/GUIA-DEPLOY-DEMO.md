# 🚀 GUIA COMPLETO - DEPLOY AMBIENTE DEMO

## 📋 Resumo do que vamos fazer

Vamos criar uma **cópia completa** do seu sistema em `demo.balek.de`:
- ✅ Backend separado (API)
- ✅ Frontend separado (interface)
- ✅ Banco de dados separado (com seus dados copiados)
- ✅ 100% independente do sistema real
- ✅ Totalmente automático (sem precisar do seu computador ligado)

---

## ⏱️ Tempo estimado: 30-40 minutos

---

# PARTE 1: CRIAR REPOSITÓRIO NO GITHUB

## Passo 1.1: Acessar GitHub

1. Abra o navegador
2. Acesse: https://github.com
3. Faça login com sua conta: **soniabalek-web**

## Passo 1.2: Criar novo repositório

1. No canto superior direito, clique no **+** (mais)
2. Clique em **"New repository"**

## Passo 1.3: Configurar o repositório

Preencha os campos:

```
Repository name: condominio-balek-demo
Description: Sistema de Gestão de Condomínio - Ambiente DEMO para testes
```

**⚠️ IMPORTANTE:**
- ✅ Deixe **PÚBLICO** (Public)
- ✅ NÃO marque "Add a README file"
- ✅ NÃO adicione .gitignore
- ✅ NÃO adicione license

Clique em **"Create repository"**

## Passo 1.4: Copiar a URL do repositório

Você verá uma página com comandos. **Copie** a URL que aparece, algo como:

```
https://github.com/soniabalek-web/condominio-balek-demo.git
```

**✅ Pronto! Repositório criado!**

---

# PARTE 2: SUBIR O CÓDIGO PARA O GITHUB

## Passo 2.1: Abrir terminal (prompt de comando)

**Windows:**
1. Pressione `Win + R`
2. Digite: `cmd`
3. Pressione Enter

## Passo 2.2: Navegar até a pasta do projeto DEMO

Cole este comando no terminal:

```bash
cd /d D:\Gestao-de-condominio\demo
```

Pressione Enter.

**⚠️ IMPORTANTE:** Agora estamos trabalhando dentro da pasta `demo/`, que tem tudo organizado e separado do sistema real!

## Passo 2.3: Inicializar Git (se ainda não estiver)

Cole estes comandos, **um de cada vez**:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Código inicial para ambiente demo"
```

## Passo 2.4: Conectar com o repositório do GitHub

**⚠️ IMPORTANTE:** Substitua a URL abaixo pela URL que você copiou no Passo 1.4!

```bash
git remote add demo https://github.com/soniabalek-web/condominio-balek-demo.git
```

## Passo 2.5: Enviar o código

```bash
git push demo main
```

Se pedir usuário e senha:
- **Username:** soniabalek-web
- **Password:** Cole o token de acesso pessoal que você criou (ou crie um novo em https://github.com/settings/tokens)

**✅ Código enviado para o GitHub!**

Para verificar, acesse:
```
https://github.com/soniabalek-web/condominio-balek-demo
```

Você deve ver todos os arquivos do projeto lá!

---

# PARTE 3: CRIAR SERVIÇOS NO RENDER.COM

## Passo 3.1: Acessar Render

1. Abra: https://dashboard.render.com/
2. Faça login com sua conta

## Passo 3.2: Criar o BANCO DE DADOS DEMO

1. No dashboard, clique em **"New +"** (canto superior direito)
2. Selecione **"PostgreSQL"**

### Configurações do Banco:

```
Name: balek-demo-db
Database: residencial_balek_demo
User: balek_demo_admin
Region: Oregon (US West)
PostgreSQL Version: 16 (ou a mais recente)
Plan: Free
```

3. Clique em **"Create Database"**

⏳ **Aguarde 2-3 minutos** enquanto o banco é criado.

4. Quando aparecer "Available", clique no nome do banco **"balek-demo-db"**

5. **IMPORTANTE:** Na página do banco, você verá:
   - Internal Database URL
   - External Database URL

6. **COPIE E SALVE** a "External Database URL" em um bloco de notas. Ela será algo como:
   ```
   postgresql://balek_demo_admin:SENHA_AQUI@dpg-XXXXX.oregon-postgres.render.com/residencial_balek_demo
   ```

**✅ Banco DEMO criado!**

---

## Passo 3.3: Criar o BACKEND DEMO

1. Volte ao dashboard: https://dashboard.render.com/
2. Clique em **"New +"**
3. Selecione **"Web Service"**

### Conectar ao GitHub:

1. Clique em **"Build and deploy from a Git repository"**
2. Clique em **"Next"**
3. Procure por **"condominio-balek-demo"** na lista
4. Clique em **"Connect"**

### Configurações do Backend:

```
Name: balek-demo-backend
Region: Oregon (US West)
Branch: main
Root Directory: (deixe vazio)
Runtime: Node
Build Command: cd backend && npm install && npm run build
Start Command: cd backend && npm start
Plan: Free
```

### Environment Variables (Variáveis de Ambiente):

Clique em **"Add Environment Variable"** para cada uma abaixo:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | `demo_jwt_secret_key_12345_not_for_production_use_demo_only` |
| `ADMIN_DEFAULT_PASSWORD` | `Demo@2025` |
| `CORS_ORIGIN` | `https://demo.balek.de,https://balek-demo-frontend.onrender.com` |
| `DATABASE_URL` | *Cole aqui a URL do banco que você copiou no passo 3.2* |

**⚠️ ATENÇÃO:** Para o `DATABASE_URL`, cole a URL completa que você salvou do banco!

3. Clique em **"Create Web Service"**

⏳ **Aguarde 5-10 minutos** enquanto o backend é criado e deployado.

**✅ Backend DEMO criado!**

Quando terminar, a URL será algo como:
```
https://balek-demo-backend.onrender.com
```

Para testar, abra no navegador:
```
https://balek-demo-backend.onrender.com/api/health
```

Deve retornar: `{ "status": "ok" }`

---

## Passo 3.4: Criar o FRONTEND DEMO

1. Volte ao dashboard: https://dashboard.render.com/
2. Clique em **"New +"**
3. Selecione **"Static Site"**

### Conectar ao GitHub:

1. Procure novamente por **"condominio-balek-demo"**
2. Clique em **"Connect"**

### Configurações do Frontend:

```
Name: balek-demo-frontend
Region: Oregon (US West)
Branch: main
Root Directory: (deixe vazio)
Build Command: cd frontend && npm install && VITE_API_URL=https://balek-demo-backend.onrender.com npm run build
Publish Directory: ./frontend/dist
```

**⚠️ IMPORTANTE:** No `Build Command`, substitua `https://balek-demo-backend.onrender.com` pela URL real do seu backend (a que apareceu no passo 3.3)!

3. Clique em **"Create Static Site"**

⏳ **Aguarde 5-10 minutos** enquanto o frontend é criado.

**✅ Frontend DEMO criado!**

A URL temporária será algo como:
```
https://balek-demo-frontend.onrender.com
```

---

# PARTE 4: IMPORTAR DADOS NO BANCO DEMO

Agora vamos copiar os dados do sistema real para o demo.

## Passo 4.1: Exportar dados do banco real

**No seu computador**, execute o script que está em `demo/scripts/`:

**Windows:**
```
Navegue até: D:\Gestao-de-condominio\demo\scripts
Clique duas vezes em: EXPORTAR-DADOS-PARA-DEMO.bat
```

**Ou manualmente no terminal:**
```bash
cd D:\Gestao-de-condominio\demo\scripts
EXPORTAR-DADOS-PARA-DEMO.bat
```

Isso criará um arquivo na pasta `demo/scripts/`: `dados-para-demo-YYYYMMDD-HHMMSS.sql`

## Passo 4.2: Importar dados no banco demo

**⚠️ IMPORTANTE:** Você precisa ter o PostgreSQL instalado no seu computador.

Se não tiver, baixe aqui:
- https://www.postgresql.org/download/windows/
- Instale apenas "Command Line Tools"

### Opção 1: Usando o script automático (RECOMENDADO)

1. Navegue até a pasta scripts:
   ```bash
   cd D:\Gestao-de-condominio\demo\scripts
   ```

2. Execute o script:
   ```bash
   IMPORTAR-DADOS-NO-DEMO.bat
   ```

3. Siga as instruções na tela (cole host, senha, selecione arquivo)

### Opção 2: Manualmente no terminal (cmd)

1. Navegue até a pasta:
   ```bash
   cd D:\Gestao-de-condominio\demo\scripts
   ```

2. Execute (substitua `NOME_DO_ARQUIVO.sql` pelo nome real do arquivo criado):
   ```bash
   set PGPASSWORD=SENHA_DO_BANCO_DEMO
   psql -h dpg-XXXXX.oregon-postgres.render.com -U balek_demo_admin -d residencial_balek_demo -f dados-para-demo-20250130-143000.sql
   ```

**⚠️ Onde pegar a senha e o host?**
- Volte ao Render: https://dashboard.render.com/
- Clique em **"balek-demo-db"**
- Copie:
  - **Host:** (exemplo: dpg-xxxxx.oregon-postgres.render.com)
  - **Password:** (a senha gerada automaticamente)

**✅ Dados importados!**

---

# PARTE 5: CONFIGURAR DOMÍNIO demo.balek.de

## Passo 5.1: Configurar no IONOS

1. Acesse: https://www.ionos.com/
2. Faça login
3. Vá em **"Domínios"** → **"balek.de"**
4. Clique em **"DNS"** ou **"Configurações DNS"**

## Passo 5.2: Adicionar registro CNAME

Adicione um novo registro:

```
Tipo: CNAME
Nome: demo
Valor: balek-demo-frontend.onrender.com
TTL: 3600
```

**⚠️ IMPORTANTE:** Substitua `balek-demo-frontend.onrender.com` pelo nome real do seu frontend no Render!

Clique em **"Salvar"**

## Passo 5.3: Configurar domínio customizado no Render

1. Volte ao Render: https://dashboard.render.com/
2. Clique em **"balek-demo-frontend"**
3. Vá na aba **"Settings"**
4. Role até **"Custom Domains"**
5. Clique em **"Add Custom Domain"**
6. Digite: `demo.balek.de`
7. Clique em **"Save"**

⏳ **Aguarde 10-30 minutos** para o DNS propagar.

**✅ Domínio configurado!**

---

# PARTE 6: TESTAR O SISTEMA DEMO

## Passo 6.1: Acessar o sistema

Abra no navegador:
```
https://demo.balek.de
```

## Passo 6.2: Fazer login como Admin

```
Email: admin@residencialbalek.com
Senha: Demo@2025
```

## Passo 6.3: Verificar se os dados foram copiados

1. Verifique se os apartamentos estão lá
2. Verifique se as despesas foram copiadas
3. Verifique se o histórico de gás está presente
4. Teste criar uma nova despesa
5. Teste gerar um relatório

**✅ TUDO FUNCIONANDO!**

---

# 📊 RESUMO FINAL

Você agora tem **2 sistemas completamente separados**:

## Sistema REAL (Produção)
```
URL: https://condominio.balek.de
Backend: https://balek-backed.onrender.com
Banco: balek-condominio-db
Senha Admin: Balek@Admin2025!Seguro
```

## Sistema DEMO (Testes)
```
URL: https://demo.balek.de
Backend: https://balek-demo-backend.onrender.com
Banco: balek-demo-db
Senha Admin: Demo@2025
```

---

# ⚠️ LEMBRETES IMPORTANTES

## Renovação Mensal do Banco DEMO

Assim como o banco real, o banco DEMO também precisa ser renovado todo mês:

1. Todo dia **27 de cada mês**
2. Acesse: https://dashboard.render.com/
3. Clique em **"balek-demo-db"**
4. Clique em **"Renew for free"**
5. Pronto! ✅

## Resetar Dados do Demo

Se quiser resetar os dados do demo e voltar aos dados originais:

1. Execute novamente: `EXPORTAR-DADOS-PARA-DEMO.bat`
2. Importe no banco demo novamente

Ou no Render:
1. Delete o banco **"balek-demo-db"**
2. Crie novamente
3. Importe os dados

---

# 🆘 PROBLEMAS COMUNS

## Backend não funciona

**Verificar:**
- Health check: `https://balek-demo-backend.onrender.com/api/health`
- No Render, veja os "Logs" do backend
- Verifique se o `DATABASE_URL` está correto

## Frontend não carrega

**Verificar:**
- Build Command tem a URL correta do backend?
- No Render, veja os "Logs" do frontend
- O domínio demo.balek.de está apontado corretamente?

## Dados não aparecem

**Verificar:**
- A importação do SQL funcionou?
- No Render, acesse o banco e verifique as tabelas
- Execute: `\dt` no psql para listar tabelas

---

# 🎯 PRÓXIMOS PASSOS (OPCIONAL)

## Adicionar usuários demo

Crie emails permitidos para usuários de teste:

```
demo1.apto01@email.com
demo2.apto02@email.com
```

## Customizar mensagens

Adicione um aviso no login:
"🎯 Este é um ambiente de DEMONSTRAÇÃO. Sinta-se livre para explorar!"

---

# ✅ CHECKLIST FINAL

Marque conforme completar:

- [ ] Repositório GitHub criado
- [ ] Código enviado para o GitHub
- [ ] Banco de dados DEMO criado no Render
- [ ] Backend DEMO criado no Render
- [ ] Frontend DEMO criado no Render
- [ ] Dados importados no banco DEMO
- [ ] Domínio demo.balek.de configurado no IONOS
- [ ] Domínio customizado configurado no Render
- [ ] Sistema testado e funcionando
- [ ] Lembrete de renovação mensal configurado

---

**🎉 PARABÉNS! Você agora tem um ambiente DEMO completo!**

Se tiver qualquer dúvida durante o processo, me chame que eu te ajudo! 😊
