# 🗳️ Planora

**Planora** è una piattaforma web collaborativa per creare e gestire sondaggi, votazioni e pianificazione di eventi. Semplifica l'organizzazione di riunioni, decisioni di team e raccolta disponibilità.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/umbertocicero/planora)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/umbertocicero/planora)

---

## 📋 Indice

- [Funzionalità](#-funzionalità)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Prerequisiti](#-prerequisiti)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Sviluppo](#-sviluppo)
- [Struttura Progetto](#-struttura-progetto)
- [Deploy](#-deploy)
- [API Reference](#-api-reference)
- [Contribuire](#-contribuire)
- [Roadmap](#-roadmap)
- [Licenza](#-licenza)

---

## ✨ Funzionalità

### Tipi di Sondaggio
| Tipo | Descrizione |
|------|-------------|
| **Scelta Singola** | I partecipanti selezionano una sola opzione |
| **Scelta Multipla** | Selezione di più opzioni con limiti configurabili |
| **Calendario** | Raccolta disponibilità con date e fasce orarie |

### Caratteristiche Principali
- 🔗 **Link condivisibili** - Condividi via link, QR code, email, WhatsApp
- 👤 **Votazione guest** - Partecipa senza registrazione
- 📊 **Risultati real-time** - Aggiornamenti istantanei con Supabase Realtime
- 🌍 **Multilingua** - Italiano e Inglese
- 🌙 **Dark mode** - Tema chiaro/scuro automatico
- 📱 **Mobile-first** - Design responsive ottimizzato
- 🔒 **Privacy** - Protezione password opzionale
- 📤 **Export** - Scarica risultati in CSV

### Dashboard Utente
- Gestione sondaggi attivi, chiusi e bozze
- Statistiche di partecipazione
- Duplicazione e archiviazione sondaggi

---

## 🎬 Live

> 🌍 Online disponibile su: [planora-poll.vercel.app](https://planora-poll.vercel.app/)

### Screenshot

| Home | Crea Sondaggio | Vota |
|------|----------------|------|
| ![Home](docs/screenshots/home.png) | ![Create](docs/screenshots/create.png) | ![Vote](docs/screenshots/vote.png) |

---

## 🛠️ Tech Stack

### Frontend
| Tecnologia | Versione | Descrizione |
|------------|----------|-------------|
| [Next.js](https://nextjs.org/) | 14.x | React framework con App Router |
| [React](https://react.dev/) | 18.x | UI library |
| [TailwindCSS](https://tailwindcss.com/) | 3.x | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com/) | latest | Componenti UI accessibili |
| [next-intl](https://next-intl-docs.vercel.app/) | 3.x | Internazionalizzazione |
| [React Hook Form](https://react-hook-form.com/) | 7.x | Gestione form |
| [Zod](https://zod.dev/) | 3.x | Validazione schema |

### Backend
| Tecnologia | Versione | Descrizione |
|------------|----------|-------------|
| [NestJS](https://nestjs.com/) | 10.x | Node.js framework |
| [Supabase](https://supabase.com/) | 2.x | Database + Auth + Realtime |
| [PostgreSQL](https://www.postgresql.org/) | 15.x | Database relazionale |

### Infrastruttura
| Servizio | Piano | Costo |
|----------|-------|-------|
| [Vercel](https://vercel.com/) | Hobby | Gratuito |
| [Supabase](https://supabase.com/) | Free | Gratuito (500MB) |
| [GitHub Codespaces](https://github.com/features/codespaces) | Free | 60h/mese |
| [Resend](https://resend.com/) | Free | 3000 email/mese |

**💰 Costo totale MVP: €0/mese**

---

## 📋 Prerequisiti

### Opzione A: GitHub Codespaces (Consigliato) ⭐
**Nessuna installazione locale richiesta!**
- Account GitHub
- Browser moderno

### Opzione B: Sviluppo Locale
- Node.js 18+ 
- pnpm 8+
- Git

---

## 🚀 Installazione

### Metodo 1: GitHub Codespaces (Senza installazioni)

1. **Fork o crea il repository**
   ```
   https://github.com/umbertocicero/planora
   ```

2. **Apri in Codespaces**
   - Vai al tuo repository su GitHub
   - Clicca **Code** → **Codespaces** → **Create codespace on main**
   - Attendi 2-3 minuti per il setup automatico

3. **Configura le variabili d'ambiente**
   ```bash
   # Crea il file .env.local nella cartella apps/web/
   cp .env.example apps/web/.env.local
   # Poi modifica apps/web/.env.local con le tue credenziali Supabase
   ```

4. **Avvia l'applicazione**
   ```bash
   pnpm dev
   ```

### Metodo 2: Installazione Locale

```bash
# 1. Clona il repository
git clone https://github.com/umbertocicero/planora.git
cd planora

# 2. Installa pnpm (se non presente)
npm install -g pnpm

# 3. Installa dipendenze
pnpm install

# 4. Crea le variabili d'ambiente (IMPORTANTE: in apps/web/)
cp .env.example apps/web/.env.local

# 5. Modifica apps/web/.env.local con le tue credenziali Supabase

# 6. Avvia in sviluppo
pnpm dev
```

---

## ⚙️ Configurazione

### 1. Configurare Supabase

1. **Crea account gratuito** su [supabase.com](https://supabase.com)

2. **Crea nuovo progetto**
   - Nome: `planora`
   - Password database: (genera una sicura)
   - Regione: EU West (o più vicina)

3. **Copia le credenziali** da Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

4. **Esegui la migration** nel SQL Editor:
   - Vai su SQL Editor nel dashboard Supabase
   - Copia il contenuto di `supabase/migrations/001_initial_schema.sql`
   - Esegui la query

### 2. Configurare Autenticazione

Nel dashboard Supabase → Authentication → Providers:

#### Email/Password
- Già abilitato di default

#### Google OAuth
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea progetto → Credentials → OAuth 2.0 Client
3. Authorized redirect: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copia Client ID e Secret in Supabase

### 3. Configurare Resend (Email)

1. Crea account su [resend.com](https://resend.com)
2. Genera API Key
3. Aggiungi a `apps/web/.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### 4. File .env.local completo

> ⚠️ **IMPORTANTE**: Il file `.env.local` deve essere creato in **`apps/web/.env.local`**, NON nella root del progetto!

---

## 💻 Sviluppo

### Comandi Disponibili

```bash
# Avvia tutti i servizi in sviluppo
pnpm dev

# Solo frontend (porta 3000)
pnpm --filter @planora/web dev

# Solo backend (porta 3001)
pnpm --filter @planora/api dev

# Build produzione
pnpm build

# Lint
pnpm lint

# Test
pnpm test

# Formattazione codice
pnpm format

# Genera tipi Supabase
pnpm db:generate
```

### Porte di Sviluppo

| Servizio | URL |
|----------|-----|
| Frontend Next.js | http://localhost:3000 |
| Backend NestJS | http://localhost:3001 |
| Supabase Studio | http://localhost:54322 |

### Hot Reload

Tutti i servizi supportano hot reload. Modifica il codice e vedrai le modifiche istantaneamente.

---

## 📁 Struttura Progetto

```
planora/
├── 📁 .devcontainer/          # Configurazione GitHub Codespaces
│   └── devcontainer.json
│
├── 📁 .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD
│
├── 📁 .vscode/                # Impostazioni VS Code
│   ├── extensions.json
│   └── settings.json
│
├── 📁 apps/
│   ├── 📁 web/                # 🌐 Frontend Next.js
│   │   ├── app/               # App Router pages
│   │   │   ├── layout.tsx     # Layout principale
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── login/         # Pagina login
│   │   │   ├── dashboard/     # Dashboard utente
│   │   │   ├── polls/
│   │   │   │   ├── create/    # Creazione sondaggio
│   │   │   │   └── [id]/      # Visualizzazione/voto
│   │   │   └── auth/
│   │   │       └── callback/  # OAuth callback
│   │   │
│   │   ├── components/
│   │   │   ├── layout/        # Header, Footer, Navigation
│   │   │   ├── providers/     # Context providers
│   │   │   └── ui/            # Componenti shadcn/ui
│   │   │
│   │   ├── lib/
│   │   │   ├── i18n/          # Configurazione i18n
│   │   │   ├── supabase/      # Client Supabase
│   │   │   └── utils.ts       # Utility functions
│   │   │
│   │   ├── messages/          # Traduzioni
│   │   │   ├── en.json
│   │   │   └── it.json
│   │   │
│   │   ├── middleware.ts      # Auth middleware
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── 📁 api/                # 🔧 Backend NestJS
│       └── src/
│           ├── main.ts        # Entry point
│           ├── app.module.ts  # Root module
│           ├── auth/          # Modulo autenticazione
│           ├── polls/         # Modulo sondaggi
│           │   ├── polls.controller.ts
│           │   ├── polls.service.ts
│           │   └── dto/
│           ├── votes/         # Modulo voti
│           └── supabase/      # Client Supabase
│
├── 📁 packages/
│   └── 📁 shared/             # 📦 Codice condiviso
│       └── src/
│           ├── index.ts
│           ├── types/         # TypeScript types
│           └── schemas/       # Zod schemas
│
├── 📁 supabase/
│   └── migrations/            # 🗃️ Migrazioni database
│       └── 001_initial_schema.sql
│
├── .env.example               # Template variabili ambiente
├── .gitignore
├── .prettierrc
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # Configurazione monorepo
├── turbo.json                 # Configurazione Turborepo
└── README.md
```

---

## 🚢 Deploy

### Deploy Frontend su Vercel

1. **Connetti Repository**
   - Vai su [vercel.com](https://vercel.com)
   - Import Git Repository → seleziona `planora`

2. **Configura Build**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: pnpm build
   Install Command: pnpm install
   ```

3. **Aggiungi Environment Variables**
   - Copia tutte le variabili da `.env.local`

4. **Deploy!**
   - Vercel builderà e deployerà automaticamente
   - Ogni push su `main` triggera un nuovo deploy

### Deploy Backend (Opzionale)

Il backend NestJS è opzionale se usi solo le API di Supabase. Per deployarlo:

**Railway.app** (gratuito):
```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

**Render.com** (gratuito):
1. Connetti repository
2. Seleziona `apps/api` come root
3. Build command: `pnpm build`
4. Start command: `node dist/main`

---

## 📚 API Reference

---

## 🔎 SEO e Google Search Console

Questa sezione spiega cosa configurare per rendere il sito indicizzabile e verificabile da Google (Search Console, Sitemap, robots, Google Analytics). Attenzione: il repository è pubblico — non inserire mai chiavi o segreti nel codice.

1) Variabili d'ambiente richieste
- `NEXT_PUBLIC_APP_URL` — URL pubblico della tua app (es. `https://planora-poll.vercel.app`). Usata nei metadata, sitemap e schema.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — stringa di verifica (se usi il meta tag per Search Console). Non è un segreto sensibile, ma gestiscila come variabile d'ambiente.
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` — ID di Google Analytics (es. `G-XXXXXXXXXX`) per lo snippet `gtag.js`.

2) Verifica sito su Google Search Console
- Metodo file HTML (consigliato semplice): copiare il file di verifica `google<id>.html` nella cartella `apps/web/public/` e deployare. Google cercherà `https://TUO_DOMINIO/google<id>.html`.
- Metodo meta tag: impostare `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` e deployare — il progetto aggiunge automaticamente la meta `verification.google` nei metadata.
- Metodo Google Analytics: se il sito è collegato a una proprietà GA con permessi di modifica, puoi usare il metodo "Google Analytics".
- Metodo DNS: aggiungi il record TXT richiesto presso il tuo DNS.

3) robots.txt e sitemap
- Il file pubblico è `apps/web/public/robots.txt` e contiene la direttiva `Sitemap: https://planora-poll.vercel.app/sitemap.xml` per impostazione predefinita.
- Se il tuo dominio è diverso, assicurati che `NEXT_PUBLIC_APP_URL` sia impostato sul dominio corretto prima del deploy, oppure modifica `apps/web/public/robots.txt` di conseguenza.
- Dopo il deploy, controlla:
   - `https://TUO_DOMINIO/robots.txt`
   - `https://TUO_DOMINIO/sitemap.xml`

4) Google Analytics (verifica e raccolta dati)
- Aggiungi `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` nelle env di Vercel; il progetto include lo snippet `gtag.js` automaticamente se la variabile è impostata.
- Per usare il metodo "Google Analytics" in Search Console devi avere i permessi di modifica sulla proprietà GA.

5) Istruzioni veloci per test locale e deploy
- Localmente puoi controllare che tutto sia presente eseguendo:
   ```bash
   pnpm dev
   # poi apri http://localhost:3000/robots.txt e http://localhost:3000/sitemap.xml
   ```
- Dopo il deploy, apri `https://TUO_DOMINIO/` e verifica:
   - presenza del meta tag di verifica (se usi il metodo tag)
   - presenza del file `google<id>.html` alla root (se usi il metodo file)
   - presenza dello snippet `gtag/js?id=...` nel `<head>` (se hai impostato GA)

6) Nota importante per fork pubblici
- Questo repository è pubblico: chiunque può forkare la repo. Non mettere mai chiavi segrete o credenziali nel sorgente.
- Quando fai fork e deploy su Vercel / altro, configura le variabili d'ambiente nel pannello del progetto (Settings → Environment Variables). Non commitare `.env.local` nel fork.
- Se vuoi che altri verifichino il loro deployment con Google Search Console, devono usare il loro dominio di deploy (es. `https://nome-fork.vercel.app`) e ripetere la procedura di verifica (file HTML o meta tag o DNS) per il loro dominio.

Se vuoi, posso generare una checklist passo-passo personalizzata per il tuo dominio e aiutarti a verificare i file dopo il deploy.


### Endpoints Principali

#### Polls

```http
POST /api/polls
```
Crea un nuovo sondaggio.

**Request Body:**
```json
{
  "title": "Quale logo preferisci?",
  "description": "Stiamo ridisegnando il brand",
  "pollType": "single_choice",
  "options": [
    { "text": "Logo A" },
    { "text": "Logo B" }
  ],
  "allowAnonymous": true,
  "requireName": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "shortId": "abc123",
  "title": "Quale logo preferisci?",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

```http
GET /api/polls/:shortId
```
Ottieni dettagli sondaggio con opzioni e voti.

---

```http
POST /api/votes
```
Registra un voto.

**Request Body:**
```json
{
  "pollId": "uuid",
  "optionIds": ["uuid1"],
  "voterName": "Mario Rossi"
}
```

---

### Autenticazione

Tutte le richieste autenticate richiedono header:
```http
Authorization: Bearer <supabase_jwt_token>
```

---

## 🤝 Contribuire

I contributi sono benvenuti! 

### Come Contribuire

1. **Fork** il repository
2. **Crea branch** per la feature
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Committa** le modifiche
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** sul branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Apri Pull Request**

### Linee Guida

- Segui lo stile di codice esistente
- Aggiungi test per nuove funzionalità
- Aggiorna documentazione se necessario
- Un commit = una modifica logica

---

## 🗺️ Roadmap

### MVP (Completato) ✅
- [x] Sondaggi scelta singola/multipla
- [x] Sondaggi calendario con date picker avanzato
- [x] Link condivisibili + QR
- [x] Votazione guest con tracciamento anonimo
- [x] Modifica/eliminazione voti (utenti loggati e anonimi)
- [x] Dashboard separata: I miei sondaggi / Sondaggi votati
- [x] Risultati real-time con Supabase Realtime
- [x] Multilingua IT/EN con rilevamento automatico browser
- [x] Dark mode
- [x] SEO Google
- [x] Google Analytics

### v1.1 (In Sviluppo) 🚧
- [ ] Flag per aggiungere possibilibà di scelta di votare la non disponibilità in una data
- [ ] Flag Commenti al voto
- [ ] Allineare pulsanti toolbar a sinistra
- [ ] Rimuovere cognome dalla toolbar

### v1.2 (Pianificato) 📋
- [ ] Integrazione Google Calendar
- [ ] Webhook per notifiche
- [ ] Statistiche avanzate
- [ ] Monitizzare tramite pubblicità
- [ ] Notificare vincitore sondaggio
- [ ] Identificare mobile e suggerire il salvataggio su schermata home
- [ ] Export CSV/PDF
- [ ] Protezione password sondaggi
- [ ] Scadenza automatica
- [ ] Notifiche email (verificare costi)
- [ ] Moglioramenti UX/UI Mobile
- [ ] Modifica dati utente per utenti registrati tramite email

### v2.0 (Futuro) 🔮
- [ ] AI: suggerimento slot migliori chiedendo le disponibilità e orari con LLM
- [ ] Sondaggi con ranking
- [ ] Enterprise SSO
- [ ] App mobile (React Native)
- [ ] UX/UI pisxel stile/minecraft (o Star Wars) + animazioni al click

---

## 📄 Licenza

Distribuito sotto licenza **MIT**. Vedi `LICENSE` per maggiori informazioni.

---

## 👤 Autore

**Il Tuo Nome**
- GitHub: [@yourusername](https://github.com/umbertocicero)
- LinkedIn: [Il Tuo Profilo](https://www.linkedin.com/in/umberto-antonio-cicero/)

---

## 🙏 Ringraziamenti

- [shadcn/ui](https://ui.shadcn.com/) - Componenti UI
- [Supabase](https://supabase.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Hosting
- [Lucide Icons](https://lucide.dev/) - Icone

---

<div align="center">

⭐ **Se ti piace il progetto, lascia una stella!** ⭐

</div>
