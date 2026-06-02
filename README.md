# web-jv

App pessoal de organização: Viagens, Finanças, Projetos, Agenda e Wishlist.

---

## Setup completo

### 1. Google Cloud — OAuth + Calendar

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e crie um projeto.
2. Ative a **Google Calendar API** em _APIs e serviços > Biblioteca_.
3. Em _APIs e serviços > Credenciais_, clique em **Criar credenciais > ID do cliente OAuth**.
4. Tipo de aplicativo: **Aplicativo Web**.
5. Origens JavaScript autorizadas: `http://localhost:3000` (dev) e `https://seu-dominio.vercel.app` (prod).
6. URIs de redirecionamento autorizados:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://seu-dominio.vercel.app/api/auth/callback/google`
7. Copie o **Client ID** e o **Client Secret** → `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
8. Em _Tela de consentimento OAuth_, adicione os escopos:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/calendar`

### 2. Amadeus — Monitor de passagens

1. Crie conta em [developers.amadeus.com](https://developers.amadeus.com) (Self-Service).
2. Crie um app e copie **API Key** → `AMADEUS_CLIENT_ID` e **API Secret** → `AMADEUS_CLIENT_SECRET`.
3. O free tier oferece 2.000 requisições/mês na API de Flight Offers Search.

### 3. Telegram Bot

1. Abra o Telegram e inicie uma conversa com **@BotFather**.
2. Envie `/newbot` e siga as instruções. Copie o token → `TELEGRAM_BOT_TOKEN`.
3. Para obter o `chat_id`: inicie uma conversa com o bot, depois acesse:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
   Pegue o valor de `result[0].message.chat.id` → `TELEGRAM_CHAT_ID`.

### 4. Resend — E-mails

1. Crie conta em [resend.com](https://resend.com).
2. Gere uma API Key → `RESEND_API_KEY`.
3. Adicione e verifique seu domínio (ou use `@resend.dev` para testes).

### 5. Neon — Banco de dados

1. Crie conta em [neon.tech](https://neon.tech) e crie um projeto Postgres.
2. Na aba **Connection string**, copie:
   - A string com **pgbouncer** (pooled) → `DATABASE_URL`
   - A string direta (sem pooler) → `DIRECT_URL`
3. Copie `.env.example` para `.env` e preencha todas as variáveis.
4. Rode as migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

### 6. Deploy na Vercel

1. Faça push para o GitHub.
2. Importe o repositório na [Vercel](https://vercel.com/new).
3. Adicione todas as variáveis de ambiente do `.env.example` nas configurações do projeto.
4. Para o cron diário (monitor de passagens), adicione o `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/check-prices",
         "schedule": "0 8 * * *"
       }
     ]
   }
   ```
5. O endpoint de cron lê `Authorization: Bearer <CRON_SECRET>` — configure o mesmo valor na Vercel.

---

## Desenvolvimento local

```bash
cp .env.example .env
# Preencha o .env

npm install
npx prisma migrate dev
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).
