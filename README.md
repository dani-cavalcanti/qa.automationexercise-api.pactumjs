# QA · ServeRest API · PactumJS

Suíte de testes de API (funcionais e de contrato) para a API pública
[ServeRest](https://serverest.dev/#/), desenvolvida como parte de um desafio
técnico.

**Stack:** [PactumJS](https://pactumjs.github.io/) · [Mocha](https://mochajs.org/) ·
[Joi](https://joi.dev/) · [Mochawesome](https://github.com/adamgruber/mochawesome) ·
Node.js

---

## Índice

- [Escopo do desafio](#escopo-do-desafio)
- [Por que essa stack](#por-que-essa-stack)
- [Arquitetura do projeto](#arquitetura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de ambiente](#configuração-de-ambiente)
- [Executando os testes](#executando-os-testes)
- [Relatório de execução](#relatório-de-execução)
- [Lint e formatação](#lint-e-formatação)
- [Integração contínua (GitHub Actions)](#integração-contínua-github-actions)
- [Estratégia e design de testes (CTFL)](#estratégia-e-design-de-testes-ctfl)
- [Como e por que usei IA neste desafio](#como-e-por-que-usei-ia-neste-desafio)

---

## Escopo do desafio

Endpoints automatizados, conforme especificado no desafio:

| Endpoint                 | Cenários                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| `POST /login`            | Login (sucesso, credenciais inválidas, payload inválido) + contrato |
| `POST /usuarios`         | Criação de usuário + contrato de sucesso                            |
| `DELETE /usuarios/{_id}` | Exclusão de usuário por id                                          |
| `POST /produtos`         | Cadastro de produto (protegido por token de admin) + contrato       |

A sintaxe Gherkin não é utilizada em nenhum lugar do projeto, e todos os
testes de contrato validam o schema exclusivamente com **Joi** (não com o
validador nativo de JSON Schema do Pactum).

## Por que essa stack

- **PactumJS** — exigência do desafio; framework enxuto para testes de API
  REST/HTTP, com suporte nativo a _mocking_, _data management_ e _expect
  handlers_ customizáveis (usados aqui para plugar o Joi).
- **Mocha** — test runner recomendado pela própria documentação/exemplos do
  Pactum, sem impor sintaxe Gherkin, com suporte a _root hook plugins_ para
  configuração global da suíte.
- **Joi** — exigência do desafio para os testes de contrato.
- **Mochawesome** — relatório HTML legível, sem infraestrutura externa
  (SaaS/serviço de terceiros) — importante para um projeto que também deve
  rodar em CI sem segredos adicionais.
- **@faker-js/faker** — geração de massa de dados sempre única, necessária
  porque o ServeRest é uma base **compartilhada** entre todos que a usam
  para estudo/prática (ver [`docs/test-strategy.md`](docs/test-strategy.md)).
- **http-status-codes / pactum-matchers** — eliminam números mágicos e
  permitem asserções de formato (regex) usando a própria linguagem de
  matchers do Pactum, sem precisar de uma lib de assertions adicional.

## Arquitetura do projeto

```
src/
  api/          # "clientes" HTTP por recurso (Pactum spec pronta para receber expects)
  config/       # leitura de variáveis de ambiente (.env)
  constants/    # endpoints e mensagens da API (sem strings mágicas nos specs)
  factories/    # geração de massa de dados de teste (Faker)
  schemas/      # contratos Joi para os testes de contrato
  support/      # expect handler do Joi + helper de autenticação de admin
test/
  login/        # test/login/login.spec.js
  usuarios/     # test/usuarios/usuarios.create.spec.js, usuarios.delete.spec.js
  produtos/     # test/produtos/produtos.create.spec.js
  setup.js      # root hooks do Mocha (base URL, timeout, registro do handler Joi)
docs/
  test-strategy.md     # visão geral da estratégia e das técnicas CTFL usadas
  architecture.md       # convenções de código, AAA, integração Joi + Pactum
  test-design/           # particionamento / valor limite / tabela de decisão, por endpoint
.github/workflows/ci.yml # pipeline de CI
```

O racional completo de cada decisão de arquitetura (por que Mocha, como o
padrão **AAA (Triple A)** foi adaptado à sintaxe fluente do Pactum, como o
Joi foi integrado sem violar os padrões do framework) está em
[`docs/architecture.md`](docs/architecture.md).

## Pré-requisitos

- Node.js `>= 18` (testado com Node 24)
- npm `>= 9`
- Acesso à internet (a suíte roda contra a API pública `https://serverest.dev`)

## Instalação

**1. Clone o repositório**

Copie o projeto do [GitHub](https://github.com/dani-cavalcanti/qa.automationexercise-api.pactumjs) para a sua máquina:

```bash
git clone https://github.com/dani-cavalcanti/qa.automationexercise-api.pactumjs.git
```

**2. Acesse a pasta do projeto**

```bash
cd qa.automationexercise-api.pactumjs
```

**3. Instale as dependências**

```bash
npm install
```

## Configuração de ambiente

O projeto já roda com valores padrão (aponta para `https://serverest.dev`)
sem nenhuma configuração adicional. Para customizar (ex.: apontar para um
ambiente de homologação ou aumentar o timeout), copie o arquivo de exemplo:

```bash
cp .env.example .env
```

| Variável          | Padrão                  | Descrição                            |
| ----------------- | ----------------------- | ------------------------------------ |
| `BASE_URL`        | `https://serverest.dev` | URL base da API sob teste            |
| `REQUEST_TIMEOUT` | `10000`                 | Timeout (ms) de cada requisição HTTP |

## Executando os testes

```bash
npm test                # roda toda a suíte (39 testes)
npm run test:login      # apenas a suíte de login
npm run test:usuarios   # apenas as suítes de usuários (criação + exclusão)
npm run test:produtos   # apenas a suíte de produtos
```

Como a suíte roda contra a API real (não há mocks), o tempo de execução
depende da latência de rede — tipicamente ~9-10s para os 39 testes, já que
cada `it` faz no máximo 1-2 chamadas HTTP e os specs de um mesmo arquivo
rodam em série (Mocha), evitando estourar o rate limit da API pública.

## Relatório de execução

O projeto usa **Mochawesome**. Para gerar o relatório HTML:

```bash
npm run test:report     # roda os testes e já gera o HTML em reports/html/index.html
npm run report:open     # abre o relatório gerado (macOS)
```

O JSON bruto fica em `reports/mochawesome/results.json` e o HTML final em
`reports/html/index.html`. A pasta `reports/` é ignorada pelo Git — em CI,
o relatório é publicado como artefato do workflow (ver abaixo).

## Lint e formatação

```bash
npm run lint        # ESLint (eslint:recommended + eslint-plugin-mocha)
npm run lint:fix     # ESLint com autofix
npm run format       # Prettier em todo o código
```

## Integração contínua (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em
todo `push`/`pull request` para `main`, e também de forma agendada
(dias úteis) para monitorar a saúde da API externa independentemente de
haver commits novos. Etapas: instalar dependências → lint → executar a
suíte → gerar o relatório Mochawesome → publicar o relatório HTML como
artefato do workflow.

## Estratégia e design de testes (CTFL)

Todo o racional de teste — particionamento de equivalência, análise de
valor limite e tabelas de decisão, com o mapeamento completo entrada →
partição/regra → status HTTP → teste automatizado — está documentado em:

- [`docs/test-strategy.md`](docs/test-strategy.md) — visão geral
- [`docs/test-design/01-login.md`](docs/test-design/01-login.md)
- [`docs/test-design/02-usuarios.md`](docs/test-design/02-usuarios.md)
- [`docs/test-design/03-produtos.md`](docs/test-design/03-produtos.md)

---

## Como e por que usei IA neste desafio

Usei o **Claude Code** (Anthropic) como par de desenvolvimento durante todo
o desafio, mas de forma supervisionada — validando cada etapa antes de
seguir para a próxima, em vez de aceitar a primeira saída gerada. Este é um
resumo honesto de onde a IA ajudou, onde eu direcionei/critiquei o
resultado, e por quê.

### 1. Pesquisa de contrato real da API (antes de escrever qualquer teste)

Em vez de confiar na minha memória sobre o comportamento do ServeRest (ou na
"memória" do modelo, que pode estar desatualizada ou simplesmente errada),
pedi para o Claude consultar o **código-fonte público** do ServeRest no
GitHub (`github.com/ServeRest/ServeRest`) — controllers, models (schemas Joi
do próprio back-end) e o middleware de autenticação. Isso me deu, com
certeza, e não por suposição:

- as mensagens exatas de sucesso/erro (ex.: `"Este email já está sendo
usado"`, `"Nenhum registro excluído"`);
- a confirmação de que `DELETE /usuarios/{_id}` retorna **200** (não 404)
  tanto para id inexistente quanto para id malformado — um comportamento não
  óbvio que virou um teste dedicado;
- a confirmação de que `POST /produtos` exige um token de **administrador**
  (middleware `checkAdm`), o que moldou a tabela de decisão de
  autenticação/autorização.

Essa etapa foi decisiva: gerar testes "de memória" sobre uma API pública tão
usada quanto o ServeRest é um risco real de assertar mensagens ou status
codes errados. Pedir para a IA buscar a fonte primária, em vez de assumir,
foi a decisão de uso mais importante do desafio.

### 2. Estruturação do projeto e redação dos testes

Direcionei explicitamente a arquitetura (camadas `api/` × `factories/` ×
`schemas/` × `support/`, motivo de cada uma, convenção de nomes em
português para os arquivos de teste/domínio) e a forma de conciliar o
padrão **AAA** exigido pelo desafio com a sintaxe fluente do Pactum (onde
"Act" e "Assert" naturalmente se misturam, porque o framework declara as
expectativas antes de disparar a requisição). Pedi para a IA implementar
essa estrutura de forma consistente em todos os specs, e revisei arquivo por
arquivo o resultado.

### 3. Verificação ativa, não confiança cega

Cada decisão técnica potencialmente arriscada foi checada contra a fonte,
não assumida:

- a assinatura exata do `addExpectHandler` do Pactum (nomes dos campos
  `ctx.res.json` / `ctx.data`) foi conferida lendo o **código-fonte
  instalado** em `node_modules/pactum`, não apenas a documentação;
- a suíte completa (39 testes) foi **executada contra a API real**
  (`https://serverest.dev`) diversas vezes durante o desenvolvimento — a
  primeira execução após a implementação inicial já passou 100%, e as
  execuções seguintes validaram cada ajuste incremental (troca do reporter,
  troca da configuração de lint, etc.);
- `ESLint` e `Prettier` foram rodados e corrigidos antes de considerar
  qualquer arquivo "pronto";
- removi dependências que a IA sugeriu inicialmente (`chai`,
  `mochawesome-merge`) assim que ficou claro, na prática, que eram
  redundantes com o que o próprio Pactum já oferecia ou desnecessárias para
  uma suíte que roda em um único processo Mocha — prefiro menos dependências
  a dependências "por precaução".

### 4. O que eu fiz, e o que a IA fez

| Decisão                                                                  | Quem definiu                                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Escopo, técnicas CTFL a aplicar (particionamento, valor limite, decisão) | Eu, a partir do enunciado do desafio                                                                        |
| Pesquisa do comportamento real da API no código-fonte oficial            | IA, sob minha orientação, com validação minha do resultado                                                  |
| Estrutura de pastas e convenções de código                               | Eu, com a IA implementando conforme a diretriz                                                              |
| Redação de cada caso de teste e das tabelas de decisão                   | IA, revisado e ajustado por mim (remoção de deps, ajuste de config, correção do bug de root hooks do Mocha) |
| Validação final (rodar a suíte, lint, revisar diffs)                     | Eu                                                                                                          |

Em resumo: usei a IA como acelerador de execução e como uma forma de
consultar fontes primárias rapidamente (código-fonte da API), mas mantive o
julgamento técnico — o que testar, como estruturar, o que simplificar — comigo,
validando o resultado a cada etapa em vez de aceitá-lo às cegas.
