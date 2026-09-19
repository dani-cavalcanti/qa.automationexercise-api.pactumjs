# Checklist de Aceitação do Desafio

Técnica aplicada: **Teste Baseado em Checklist** (CTFL v4.0, categoria
baseada em experiência). Cada item abaixo reproduz um requisito literal do
enunciado do desafio e aponta o artefato do repositório que o satisfaz —
para que a verificação da entrega não dependa de reler o código inteiro.

## Requisitos técnicos obrigatórios

| # | Requisito do desafio | Onde está atendido |
| - | --- | --- |
| 1 | Framework de testes deve ser o PactumJS | Todos os specs em `test/**/*.spec.js` e os clientes HTTP em `src/api/*.js` usam exclusivamente `pactum.spec()`. |
| 2 | Sintaxe Gherkin NÃO deve ser utilizada | Nenhuma dependência de Cucumber/Gherkin no `package.json`; specs escritos em Mocha (`describe`/`it`) com nomes descritivos em português. |
| 3 | Joi deve validar o schema nos testes de contrato | `src/schemas/*.schema.js` (Joi) + `src/support/joiExpectHandler.js`, usados nos testes marcados como "contrato" em cada spec. |
| 4 | Automatizar `POST /login` | [`test/login/login.spec.js`](../test/login/login.spec.js) |
| 5 | Automatizar `POST /usuarios` + contrato de sucesso | [`test/usuarios/usuarios.create.spec.js`](../test/usuarios/usuarios.create.spec.js) |
| 6 | Automatizar `DELETE /usuarios/{_id}` | [`test/usuarios/usuarios.delete.spec.js`](../test/usuarios/usuarios.delete.spec.js) |
| 7 | Automatizar `POST /produtos` + contrato de sucesso | [`test/produtos/produtos.create.spec.js`](../test/produtos/produtos.create.spec.js) |
| 8 | Documentação de testes com uma técnica CTFL (valor limite, particionamento ou tabela de decisão) | `docs/test-strategy.md` + `docs/test-design/*.md` — as três técnicas foram usadas (não apenas uma), com mapeamento completo às categorias do CTFL v4.0 em `docs/test-strategy.md#2-técnicas-de-design-de-teste-ctfl-v40`. |
| 9 | Seguir os padrões definidos pelo framework | `docs/architecture.md` explica a integração do Joi via *custom expect handler* do Pactum e o uso de `pactum-matchers` em vez de uma lib de assertions externa. |
| 10 | Projeto organizado para crescer / reduzir duplicação | Camadas `src/api` / `src/factories` / `src/schemas` / `src/support` — ver `docs/architecture.md#1-estrutura-de-pastas`. |

## Itens que serão avaliados

| # | Item avaliado | Onde está atendido |
| - | --- | --- |
| 1 | Código de fácil entendimento | Nomes de teste descritivos em português (o "o quê" e o "porquê" do cenário), constantes em vez de strings/números mágicos (`src/constants`). |
| 2 | Estrutura de teste Triple A (AAA) | Todo `it()` segue `// Arrange` / `// Act & Assert`; a nuance de como o Pactum funde Act+Assert na própria cadeia fluente está explicada em `docs/architecture.md#3-convenção-de-estrutura-de-teste-triple-a--aaa`. |
| 3 | Documentação dos métodos (não linha a linha) | JSDoc nos módulos de `src/` (`api/`, `factories/`, `schemas/`, `support/`) explicando o propósito de cada função — sem comentários redundantes dentro dos specs. |
| 4 | Código segue um padrão | ESLint (`eslint:recommended` + `eslint-plugin-mocha`) e Prettier configurados e sem erros (`npm run lint`). |
| 5 | Testes organizados em suítes | Uma pasta por recurso (`test/login`, `test/usuarios`, `test/produtos`), com `describe` aninhados por técnica/regra de negócio dentro de cada spec. |
| 6 | Performance de execução | Specs de um mesmo recurso rodam em série de propósito (evita rate limit da API pública); suíte completa (39 testes) roda em ~9s. Ver `README.md#executando-os-testes`. |
| 7 | Organização de código/testes/pastas | Ver `docs/architecture.md#1-estrutura-de-pastas`. |
| 8 | Integração com relatório | Mochawesome — `npm run test:report` gera `reports/html/index.html`. Ver `README.md#relatório-de-execução`. |
| 9 | Pipeline no GitHub Actions | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — lint, testes e publicação do relatório como artefato. |
| 10 | README explica configuração, instalação e execução | `README.md` (seções "Pré-requisitos", "Instalação", "Configuração de ambiente", "Executando os testes"). |
| 11 | Conhecimento teórico aplicado ao design dos testes funcionais | `docs/test-strategy.md` e `docs/test-design/*.md` — particionamento de equivalência, valor limite, tabela de decisão e suposição de erro (CTFL v4.0), com justificativa explícita para as técnicas do syllabus que **não** se aplicam a este escopo (transição de estado, caixa-branca, ATDD/BDD). |
