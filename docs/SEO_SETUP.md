# Planora - Guida Google Search Console & SEO

## 1️⃣ Preparazione (Completata ✅)

I seguenti file sono stati creati:
- ✅ `apps/web/app/sitemap.ts` - Sitemap XML dinamica
- ✅ `apps/web/app/robots.ts` - Robots.txt dinamico
- ✅ `apps/web/public/robots.txt` - Robots.txt statico (backup)
- ✅ `apps/web/app/layout.tsx` - Metadata SEO + Schema.org
- ✅ Verifica Google abilitata (variabile d'ambiente)

---

## 2️⃣ Configurare variabili d'ambiente

### In `apps/web/.env.local`:

```env
# Google Search Console Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code_here
```

**Come ottenere il codice:**
1. Vai a [Google Search Console](https://search.google.com/search-console)
2. Clicca "Aggiungi proprietà"
3. Scegli "URL prefix": `https://planora-jet.vercel.app`
4. Nella sezione "Verifica", seleziona "Meta tag HTML"
5. Copia il `content` del tag meta (la stringa dopo `content="`)

Esempio:
```html
<!-- Google genera qualcosa del genere -->
<meta name="google-site-verification" content="abc123def456ghi789" />

<!-- Allora in .env.local metti: -->
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=abc123def456ghi789
```

---

## 3️⃣ Registrazione su Google Search Console

### Step-by-Step:

#### 1. Accedi a Google Search Console
- URL: https://search.google.com/search-console
- Accedi con il tuo account Google

#### 2. Aggiungi proprietà
- Clicca il bottone **"Aggiungi proprietà"**
- Scegli **"Prefisso URL"**
- Incolla: `https://planora-jet.vercel.app`

#### 3. Verifica proprietà (2 opzioni)

**Opzione A: Meta tag (CONSIGLIATO - Automatico)**
1. Seleziona "Meta tag HTML"
2. Copia il codice di verifica
3. Mettilo in `.env.local`: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...`
4. Fai deploy su Vercel
5. Torna in GSC e clicca "Verifica"
6. Google leggerà il meta tag dal layout.tsx

**Opzione B: File HTML (Alternativa)**
1. Scarica il file HTML
2. Salva in `apps/web/public/google_verification_file.html`
3. Deploy su Vercel
4. Verifica in GSC

#### 4. Invia la Sitemap
1. Una volta verificato, vai in GSC → **Sitemap**
2. Clicca "Aggiungi/Testa Sitemap"
3. Incolla: `https://planora-jet.vercel.app/sitemap.xml`
4. Clicca "Invia"
5. Google inizierà a scansionare le pagine

---

## 4️⃣ Verifica i file SEO

Dopo il deploy, visita questi URL per confermare:

```bash
# Robots.txt
https://planora-jet.vercel.app/robots.txt

# Sitemap
https://planora-jet.vercel.app/sitemap.xml

# Meta tag verificazione (inspector)
# Apri DevTools (F12) → Head → cerca "google-site-verification"
```

---

## 5️⃣ Monitoraggio in Google Search Console

Una volta verificato, avrai accesso a:

- **Performance**: Impressioni, click, posizione media da Google Search
- **Coverage**: Pagine indicizzate e errori
- **Mobile Usability**: Problemi di mobile
- **Enhancements**: Rich snippets, breadcrumbs
- **Links**: Backlink verso il tuo sito
- **Crawl Stats**: Numero di pagine scansionate

---

## 6️⃣ Google Analytics (Opzionale ma Consigliato)

Per tracciare il traffico dal sito:

### Crea un account:
1. Vai a [Google Analytics](https://analytics.google.com)
2. Crea proprietà per `planora-jet.vercel.app`
3. Copia il Measurement ID (formato: `G-XXXXXXXXXX`)

### Aggiungi al progetto:

Aggiungi in `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

Poi crea il componente `apps/web/components/analytics.tsx`:

```typescript
'use client';

import Script from 'next/script';

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
```

Poi aggiungi in `layout.tsx`:

```typescript
import { GoogleAnalytics } from '@/components/analytics';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        {/* ... resto del head */}
      </head>
      <body>
        {/* ... rest */}
      </body>
    </html>
  );
}
```

---

## 7️⃣ Checklist Finale

### On-Page SEO ✅
- [x] Metadata title/description
- [x] Keywords nel HTML
- [x] Open Graph per social media
- [x] Canonical URL
- [x] Mobile-friendly (Tailwind responsive)
- [x] Alt text su immagini

### Technical SEO ✅
- [x] Robots.txt presente
- [x] Sitemap.xml generato
- [x] HTTPS (Vercel ✓)
- [x] Schema.org JSON-LD
- [x] Verifica Google Search Console

### Performance 🚀
- Next.js App Router (SSR/SSG)
- Image optimization
- Code splitting
- CSS minified (Tailwind)

### Content 📝
- Homepage descrittiva
- Call-to-action chiaro
- Metadati per ogni pagina

---

## 8️⃣ Timeline di Indexing

| Giorno | Azione |
|--------|--------|
| 0 | Deploy su Vercel + Sitemap in GSC |
| 1-3 | Google crawla il sito |
| 3-7 | Prime pagine in search results |
| 7-14 | Ranking stabilizzato |
| 30+ | Dati completi in Analytics |

---

## ❓ Domande Comuni

**Q: Quanto tempo prima che appaia nei risultati?**
A: 1-2 settimane. Più backlink e condivisioni sociali = più veloce.

**Q: Come faccio a ranking più alto?**
A:
- Content di qualità
- Backlink autorevoli
- Mobile-friendly
- Velocità pagina (Core Web Vitals)
- Social signals

**Q: Posso accelerare l'indexing?**
A: Sì! In GSC → Ispeziona URL → Richiedi indicizzazione

**Q: Robots.txt blocca le ricerche?**
A: No, è solo una "richiesta" ai bot. GSC non è bloccato.

---

## 📞 Supporto

Se hai problemi:
1. Controlla GSC → Coverage (errori di indexing)
2. Verifica robots.txt/sitemap
3. Usa Google's Mobile-Friendly Test
4. Check Core Web Vitals
