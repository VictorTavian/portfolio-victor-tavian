# Portfólio — Victor Tavian (Next.js)

Versão em Next.js (App Router) do portfólio. Visual, textos PT/EN, vídeo de fundo,
galeria em cilindro, abertura com progresso e escolha de idioma, e cursor em rastro
foram mantidos da versão estática.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm start
```

Requer Node.js 18.18 ou superior.

## Estrutura

- `app/layout.tsx` — `<html>`, metadados, fontes (Unbounded)
- `app/globals.css` — estilos do site (inclui abertura, galeria, rodapé e cursor)
- `app/page.tsx` — monta a página: marcação, cursor e scripts
- `content/body.html` — marcação das seções, rodapé e abertura
- `content/meta.json` — título e descrição (SEO)
- `components/SiteBody.tsx` — insere a marcação
- `components/TrailCursor.tsx` — cursor: rastro em degradê ciano → violeta; engrossa sobre links, botões e projetos
- `components/SiteScripts.tsx` — carrega `public/js/site.js`
- `public/js/site.js` — vídeo de fundo, revelar, progresso, abertura, idioma (PT/EN) e proteções de imagem
- `public/js/gallery.js` — galeria em cilindro (carrega three.js do cdnjs)
- `public/assets/bg.mp4` — vídeo de fundo

## Textos

- Marcação em português: `content/body.html`
- Traduções para inglês: dicionário `EN` em `public/js/site.js`

## Segurança

Cabeçalhos em `next.config.mjs` (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc.).
`X-Powered-By` desligado. O único script externo é o three.js, do cdnjs.
