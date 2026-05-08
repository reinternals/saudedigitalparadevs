# Como Contribuir

A contribuição da comunidade é um dos maiores pilares deste projeto. Sinta-se à vontade para trazer seu conhecimento, sugestões e melhorias.

Todas as contribuições são enviadas por meio de pull requests no GitHub. Assim mantemos um histórico claro de alterações, revisão coletiva e discussões sobre o que deve ser publicado.

## Requisitos mínimos

Para contribuir com este projeto você precisa de:

* Um computador com conexão à internet.
* Conta no GitHub.
* Editor de texto ou IDE para editar arquivos Markdown.
* Git instalado.
* Navegador para abrir o repositório e criar pull requests.

## Passo a passo

Siga este fluxo para enviar sua contribuição:

### 1 - Clonar o repositório

No terminal, execute:

```bash
git clone https://github.com/<seu-usuario>/<nome-do-repositorio>.git
```

Depois acesse a pasta:

```bash
cd <nome-do-repositorio>
```

### 2 - Criar uma branch

Crie uma branch nova para a sua alteração. Use um nome descritivo:

```bash
git checkout -b minha-contribuicao
```

### 3 - Definir o contexto e localizar o diretório

Identifique em qual seção do projeto sua contribuição se encaixa. O conteúdo do site está em:

* `content/pages/` — páginas de conteúdo em Markdown
* `content/summary.json` — estrutura de navegação e ordem das páginas

Procure a pasta e o arquivo que fazem sentido para sua alteração.

### 4 - Escrever o conteúdo

Abra o arquivo `.md` correspondente no editor de texto e adicione ou atualize o conteúdo.

Dicas:

* Use títulos (`#`, `##`, `###`) para organizar o texto.
* Mantenha a linguagem clara e simples.
* Verifique a ortografia e a formatação do Markdown.

### 5 - Atualizar o sumário

Se você criar uma nova página, adicione uma entrada em `content/summary.json` na seção correta.

A estrutura do `content/summary.json` é semelhante a:

```json
{
  "sections": [
    {
      "title": "Boas-vindas",
      "pages": [
        {
          "title": "Como Contribuir",
          "path": "content/pages/boas-vindas/como-contribuir.md"
        }
      ]
    }
  ]
}
```

### 6 - Commitar as alterações

Salve as alterações e depois faça commit:

```bash
git add .
git commit -m "feat/fix/refactor: descrição breve"
```

### 7 - Enviar para o GitHub e criar pull request

Envie sua branch para o GitHub:

```bash
git push origin minha-contribuicao
```

Depois, abra o repositório no GitHub e crie um Pull Request da sua branch para a branch principal (`main` ou `master`).

### 8 - Revisão e ajustes

Aguarde o feedback dos mantenedores. Se precisarem de ajustes, faça as alterações na mesma branch e envie novamente.

## Boas práticas

* Explique claramente o objetivo da sua contribuição no PR.
* Prefira alterações pequenas e focadas.
* Verifique se o Markdown renderiza corretamente.
* Use exemplos e referências quando necessário.

Obrigado por querer contribuir! Sua participação ajuda a tornar o projeto mais completo e útil para toda a comunidade.

