# DevNotes — Blog Estático de Artigos Markdown

Site estático para renderizar artigos `.md` com cabeçalho YAML (frontmatter).

## Como usar

### 1. Servir localmente

```bash
# Com Node.js
npx serve .

# Com Python
python3 -m http.server 8080

# Com PHP
php -S localhost:8080
```

Abra `http://localhost:3000` (ou a porta exibida).

> **⚠️ Não abra o `index.html` diretamente no browser** (protocolo `file://`), pois o fetch de arquivos locais é bloqueado por CORS. Sempre sirva via servidor HTTP.

---

### 2. Adicionar um novo artigo

**Passo 1:** Crie o arquivo `.md` em `articles/` com o frontmatter:

```markdown
---
title: Meu Novo Artigo
difficulty: iniciante
author: Seu Nome
date: 2025-05-10
tags: tema1, tema2
---

## Introdução

Conteúdo em Markdown aqui...
```

**Passo 2:** Registre o arquivo em `articles/manifest.json`:

```json
[
  "meu-novo-artigo.md",
  "introducao-ao-rust.md",
  "css-grid-vs-flexbox.md",
  "arquitetura-hexagonal-go.md"
]
```

Pronto! O artigo aparece automaticamente na listagem.

---

## Campos do frontmatter

| Campo        | Obrigatório | Descrição                                      |
|--------------|-------------|------------------------------------------------|
| `title`      | ✅           | Título do artigo                               |
| `difficulty` | ✅           | `iniciante`, `intermediário` ou `avançado`     |
| `author`     | ✅           | Nome do autor                                  |
| `date`       | ✅           | Data no formato `YYYY-MM-DD`                   |
| `tags`       | Opcional    | Lista separada por vírgulas                    |

---

## Estrutura do projeto

```
/
├── index.html            ← Página principal (lista + artigo)
├── js/
│   └── app.js            ← Lógica do app (fetch, parse, render)
└── articles/
    ├── manifest.json     ← Lista de arquivos .md
    ├── introducao-ao-rust.md
    ├── css-grid-vs-flexbox.md
    └── arquitetura-hexagonal-go.md
```

## Deploy

Funciona em qualquer hospedagem estática:
- **GitHub Pages** — commit + push, habilitar Pages nas configurações
- **Netlify / Vercel** — arrastar a pasta ou conectar o repositório
- **Cloudflare Pages** — idem

Nenhum build necessário. Zero dependências locais.
