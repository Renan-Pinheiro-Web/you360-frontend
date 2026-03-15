# YOU360 — Sistema E-Commerce

**Cosméticos & Estética Premium**

Stack: **Next.js 14 + PHP REST API + MySQL** hospedado na **Hostinger**

---

## 📁 Estrutura do Projeto

```
you360/
├── backend/                  ← API PHP (sobe para a Hostinger)
│   ├── index.php             ← Ponto de entrada da API
│   ├── .htaccess             ← Rewrite para index.php
│   ├── config/
│   │   └── config.php        ← DB, JWT, upload, admin
│   ├── database/
│   │   └── Database.php      ← Conexão MySQL via PDO (Singleton)
│   ├── utils/
│   │   ├── uuid.php          ← Gerador UUID v4
│   │   └── response.php      ← Helpers JSON + sanitização
│   ├── middlewares/
│   │   └── Auth.php          ← JWT sem biblioteca externa
│   ├── routes/
│   │   └── router.php        ← Todas as rotas da API
│   └── controllers/
│       ├── AuthController.php
│       ├── ProductController.php
│       ├── HeroController.php
│       ├── LinhasController.php
│       ├── DepoimentosController.php
│       ├── VendasController.php
│       ├── ClientesController.php
│       ├── GaleriaController.php
│       └── UploadController.php
│
├── pages/                    ← Frontend Next.js
│   ├── index.js              ← Loja pública
│   ├── _app.js
│   ├── produto/
│   │   └── [id].js           ← Página de produto
│   └── admin/
│       ├── login.js          ← Login admin
│       └── index.js          ← Painel admin completo
│
├── lib/
│   └── apiClient.js          ← Cliente da API PHP (substitui Supabase)
│
├── database-setup.sql        ← Script completo do banco MySQL
├── .env.local                ← Variáveis de ambiente (não commitar)
├── .env.example              ← Modelo de variáveis
└── README.md
```

---

## 🗄️ Banco de Dados (MySQL)

### Tabelas criadas

| Tabela | Descrição |
|---|---|
| `admins` | Usuários do painel admin |
| `products` | Produtos da loja |
| `hero_config` | Produto destacado no hero |
| `linhas_config` | 3 banners de coleções |
| `depoimentos` | Depoimentos de clientes |
| `clientes` | Cadastro de clientes |
| `vendas` | Pedidos registrados |
| `venda_itens` | Itens de cada pedido |
| `product_gallery` | Fotos extras de produtos |
| `price_history` | Histórico de preços |

### Executar o setup

**Opção 1 — phpMyAdmin (recomendado para Hostinger):**
1. Acesse o painel Hostinger → MySQL Databases
2. Crie um banco de dados (ex: `u123456_you360`)
3. Abra o phpMyAdmin
4. Selecione o banco → aba **SQL**
5. Cole e execute o conteúdo de `database-setup.sql`

**Opção 2 — CLI:**
```bash
mysql -u seu_usuario -p nome_do_banco < database-setup.sql
```

---

## ⚙️ Backend PHP

### Configuração

Edite `backend/config/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_you360');   // nome do banco na Hostinger
define('DB_USER', 'u123456_admin');    // usuário do banco
define('DB_PASS', 'SUA_SENHA');        // senha do banco

define('JWT_SECRET', 'CHAVE_SECRETA_LONGA_E_UNICA');

define('ADMIN_EMAIL', 'seu@email.com');
```

### Endpoints da API

#### Autenticação
```
POST   /api/auth/login       → login admin
GET    /api/auth/me          → dados do admin logado
POST   /api/auth/logout      → logout
```

#### Produtos (público)
```
GET    /api/products          → listar ativos
GET    /api/products/:id      → detalhe de produto
GET    /api/products/:id/gallery → galeria do produto
```

#### Produtos (admin)
```
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
PATCH  /api/admin/products/:id/toggle
POST   /api/admin/products/:id/duplicate
PUT    /api/admin/products/reorder
GET    /api/admin/products/:id/price-history
POST   /api/admin/products/:id/gallery
DELETE /api/admin/products/:id/gallery/:imgId
```

#### Configurações
```
GET    /api/hero
PUT    /api/admin/hero
GET    /api/linhas
PUT    /api/admin/linhas/:id
GET    /api/depoimentos
GET    /api/admin/depoimentos
POST   /api/admin/depoimentos
PUT    /api/admin/depoimentos/:id
DELETE /api/admin/depoimentos/:id
```

#### Vendas
```
POST   /api/vendas            → pedido público (loja)
GET    /api/admin/vendas
POST   /api/admin/vendas
PUT    /api/admin/vendas/:id
DELETE /api/admin/vendas/:id
```

#### Clientes
```
GET    /api/admin/clientes
POST   /api/admin/clientes
PUT    /api/admin/clientes/:id
DELETE /api/admin/clientes/:id
GET    /api/admin/clientes/:id/historico
```

#### Upload
```
POST   /api/admin/upload      → upload de imagem (multipart)
```

---

## 🖥️ Frontend Next.js

### Variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=https://seudominio.com.br/api
NEXT_PUBLIC_WHATSAPP=5588993668921
NEXT_PUBLIC_BRAND_NAME=YOU360
```

### Instalar e rodar localmente

```bash
npm install
npm run dev
# Acesse http://localhost:3000
```

### Build para produção

```bash
npm run build
npm start
```

### Login Admin

```
URL:   /admin/login
Email: admin@you360.com.br
Senha: admin123   ← TROQUE IMEDIATAMENTE!
```

---

## 🚀 Deploy na Hostinger

### Passo 1 — Backend PHP

1. No painel Hostinger, acesse **Gerenciador de Arquivos**
2. Navegue até `public_html/`
3. Crie a pasta `api/` (ou `backend/`)
4. Faça upload de **todo o conteúdo da pasta `backend/`** para `public_html/api/`
5. Crie a pasta `public_html/uploads/` com permissão **755**

> A API ficará em: `https://seudominio.com.br/api`

### Passo 2 — Banco de Dados

1. Painel Hostinger → **MySQL Databases**
2. Crie banco + usuário e anote as credenciais
3. Execute `database-setup.sql` no phpMyAdmin
4. Edite `backend/config/config.php` com as credenciais reais

### Passo 3 — Frontend Next.js

**Opção A — Vercel (recomendado para Next.js):**
```bash
npx vercel --prod
```
Defina a variável `NEXT_PUBLIC_API_URL` no painel da Vercel.

**Opção B — Hostinger (build estático):**
```bash
# Em next.config.js, adicione:
# output: 'export'
npm run build
```
Faça upload da pasta `out/` para `public_html/` na Hostinger.

**Opção C — Hostinger com Node.js:**
1. Painel Hostinger → **Node.js**
2. Configure a versão 18+, diretório `public_html/`
3. Rode `npm install && npm run build && npm start`

### Passo 4 — Variáveis de ambiente no servidor

Na Vercel, adicione em **Settings → Environment Variables**:
```
NEXT_PUBLIC_API_URL = https://seudominio.com.br/api
NEXT_PUBLIC_WHATSAPP = 5588993668921
```

---

## 🔐 Segurança

- **Troque a senha admin** após o primeiro acesso em `/admin/login`
- **Troque o JWT_SECRET** em `config.php` por uma string longa e aleatória
- Use **HTTPS** obrigatoriamente em produção
- O arquivo `config.php` nunca deve ser acessível publicamente

Para gerar um JWT_SECRET seguro:
```bash
openssl rand -hex 64
```

---

## 🏗️ Arquitetura

```
Browser (Next.js)
      │
      │  fetch() com JWT
      ▼
PHP REST API (Hostinger)
      │
      │  PDO + Prepared Statements
      ▼
MySQL (Hostinger)
```

**Sem Supabase. Sem dependências externas de banco.**  
O frontend se comunica exclusivamente com a API PHP via JSON.

---

## 📝 Checklist de Deploy

- [ ] Executar `database-setup.sql` no MySQL
- [ ] Configurar credenciais em `backend/config/config.php`
- [ ] Fazer upload do backend para `public_html/api/`
- [ ] Criar pasta `public_html/uploads/` com permissão 755
- [ ] Configurar `.env.local` com a URL da API
- [ ] Fazer deploy do frontend (Vercel ou Hostinger Node.js)
- [ ] Acessar `/admin/login` e **trocar a senha padrão**
- [ ] Testar uma compra completa na loja
- [ ] Verificar se os pedidos aparecem no painel admin

---

© 2024 YOU360. Todos os direitos reservados.
#   y o u 3 6 0 - f r o n t e n d  
 