# Contribuire a Pollix

Grazie per il tuo interesse nel contribuire a Pollix! 🎉

## 🚀 Quick Start

1. Fork il repository
2. Clona il tuo fork
3. Crea un branch per la tua feature
4. Fai le modifiche
5. Testa le modifiche
6. Crea una Pull Request

## 📋 Tipi di Contributi

### 🐛 Bug Report
- Usa il template "Bug Report" nelle Issues
- Includi passi per riprodurre il bug
- Specifica browser/OS

### ✨ Feature Request
- Usa il template "Feature Request" nelle Issues
- Descrivi il caso d'uso
- Proponi una soluzione

### 📝 Documentazione
- Correggi errori di battitura
- Migliora spiegazioni
- Aggiungi esempi

### 💻 Codice
- Correggi bug
- Implementa nuove feature
- Migliora performance

## 🔧 Setup Sviluppo

```bash
# Fork e clona
git clone https://github.com/YOUR_USERNAME/planora.git
cd planora

# Installa dipendenze
pnpm install

# Crea branch
git checkout -b feature/my-feature

# Avvia sviluppo
pnpm dev
```

## 📐 Linee Guida Codice

### Stile
- Usa TypeScript strict mode
- Segui ESLint rules
- Formatta con Prettier (`pnpm format`)

### Naming
- **Componenti**: PascalCase (`PollCard.tsx`)
- **Utility**: camelCase (`formatDate.ts`)
- **Costanti**: UPPER_SNAKE_CASE
- **CSS classes**: kebab-case via Tailwind

### Commit Messages
Segui [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add poll duplication feature
fix: resolve voting on closed polls
docs: update installation guide
style: format code with prettier
refactor: simplify poll creation logic
test: add unit tests for vote service
chore: update dependencies
```

### Branch Naming
```
feature/add-poll-export
fix/voting-error-handling
docs/api-documentation
```

## ✅ Checklist PR

Prima di aprire una PR:

- [ ] Il codice compila senza errori (`pnpm build`)
- [ ] I test passano (`pnpm test`)
- [ ] Il linting è ok (`pnpm lint`)
- [ ] Ho aggiunto test per nuove feature
- [ ] Ho aggiornato la documentazione
- [ ] Ho seguito le convenzioni di commit

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

## 📁 Struttura Codice

```
apps/
├── web/              # Frontend Next.js
│   ├── app/          # Pages (App Router)
│   ├── components/   # React components
│   └── lib/          # Utility e hooks
└── api/              # Backend NestJS
    └── src/          # Controllers e Services
```

## 🔍 Code Review

Le PR verranno revisionate per:
- Correttezza funzionale
- Qualità del codice
- Test coverage
- Performance
- Sicurezza
- Documentazione

## 💬 Comunicazione

- **Issues**: Per bug e feature request
- **Discussions**: Per domande generali
- **PR Comments**: Per feedback sul codice

## 📜 Codice di Condotta

Questo progetto segue il [Contributor Covenant](https://www.contributor-covenant.org/).
Sii rispettoso e inclusivo.

---

Grazie per contribuire! 🙏
