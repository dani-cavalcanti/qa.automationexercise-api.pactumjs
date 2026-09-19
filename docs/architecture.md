# Arquitetura e Convenções

## 1. Estrutura de pastas

```
src/
  api/          # "clientes" HTTP por recurso (monta method + path + body do Pactum)
  config/       # leitura de variáveis de ambiente (.env)
  constants/    # endpoints e mensagens da API, sem strings mágicas nos specs
  factories/    # geração de massa de dados de teste (Faker)
  schemas/      # contratos Joi usados nos testes de contrato
  support/      # infraestrutura de teste (expect handler do Joi, helper de autenticação)
test/
  login/
  usuarios/
  produtos/
  setup.js      # root hooks do Mocha (base URL, timeout, registro do handler Joi)
docs/
  test-strategy.md       # visão geral da estratégia e técnicas CTFL usadas
  test-design/            # particionamento / valor limite / tabela de decisão por endpoint
  architecture.md         # este documento
```

A separação por camada (`api` × `factories` × `schemas` × `test`) existe para
que o crescimento do projeto — novos endpoints do ServeRest (`/carrinhos`,
`GET`/`PUT` de usuários e produtos, etc.) — não exija duplicar a montagem de
requisições ou os dados de teste: basta adicionar um novo arquivo em cada
camada seguindo o padrão já estabelecido.

## 2. Por que PactumJS + Mocha (sem Gherkin)

O desafio veda o uso de Gherkin. O PactumJS é *framework-agnostic* quanto ao
executor de testes — funciona com Mocha, Jest ou Cucumber. Optou-se por
**Mocha**, por ser o test runner mais usado na documentação e nos exemplos
oficiais do próprio PactumJS, e por oferecer *root hook plugins*
(`exports.mochaHooks`) que permitem configurar o Pactum uma única vez antes
de toda a suíte sem acoplar esse setup a nenhum arquivo de teste específico.

## 3. Convenção de estrutura de teste (Triple A / AAA)

Cada `it()` segue três blocos comentados: `// Arrange`, `// Act`, `// Assert`.

Uma particularidade do PactumJS é que ele expressa as expectativas
(`.expectStatus()`, `.expectJsonLike()`, `.expect(handler, data)`) **antes**
de `.toss()` — o método que efetivamente dispara a requisição e resolve a
Promise. Ou seja, a "montagem" da asserção e a "execução" fazem parte da
mesma cadeia fluente, por design do framework. Para não brigar com essa
idiomática (o desafio pede explicitamente para seguir os padrões do
framework), adotou-se a convenção:

```js
it('...', async () => {
  // Arrange
  const payload = usuarioFactory.build();

  // Act & Assert
  // (o Pactum dispara a requisição em .toss(); as expectativas abaixo
  // compõem a fase de "Assert", avaliada sobre a resposta recebida)
  await usuariosApi
    .criarUsuario(payload)
    .expectStatus(201)
    .expectJsonLike({ message: Messages.POST_SUCCESS })
    .toss();
});
```

O `Arrange` isola sempre a preparação de dados/estado (massa de teste,
usuário administrador autenticado, etc.), tornando explícito o que é
pré-condição do cenário antes mesmo de olhar para a chamada HTTP.

## 4. Testes de contrato com Joi dentro do Pactum

O desafio exige o uso do Joi (e não o validador nativo do Pactum, baseado em
JSON Schema/AJV). Em vez de validar o schema "por fora" da spec do Pactum
(o que quebraria a cadeia fluente e a convenção acima), foi registrado um
*custom expect handler* (`src/support/joiExpectHandler.js`) via
`pactum.handler.addExpectHandler`:

```js
pactum.handler.addExpectHandler('validarContratoJoi', (ctx) => {
  const { schema } = ctx.data;
  const { error } = schema.validate(ctx.res.json, { abortEarly: false });
  if (error) throw new Error(`Contrato inválido (Joi): ${error.message}`);
});
```

Uso em um teste de contrato:

```js
await usuariosApi
  .criarUsuario(payload)
  .expectStatus(201)
  .expect('validarContratoJoi', { schema: usuarioCreatedSchema })
  .toss();
```

Essa é a extensão documentada oficialmente pelo PactumJS para plugar
validadores de terceiros — o que atende simultaneamente aos dois requisitos
do desafio: usar Joi e seguir os padrões do framework.

## 5. Isolamento e limpeza de dados

Ver [`docs/test-strategy.md`](./test-strategy.md#4-ambiente-de-testes-e-massa-de-dados)
para o racional completo. Em resumo: dados sempre gerados via Faker com
sufixo único, e limpeza via `DELETE /usuarios/{_id}` sempre que aplicável.

## 6. Qualidade de código

- **ESLint** (`eslint:recommended` + `eslint-plugin-mocha`) para erros de
  lógica e boas práticas específicas de suítes Mocha (ex.: nunca deixar um
  `it` sem asserção, não duplicar títulos de teste).
- **Prettier** para formatação consistente, desacoplada das regras de lint
  (`eslint-config-prettier` desliga qualquer regra de estilo conflitante).
- Nenhuma dependência é mantida no `package.json` sem uso real no código —
  por exemplo, o projeto **não** usa uma lib de asserção genérica (ex. Chai)
  porque as capacidades nativas do Pactum (`expectStatus`, `expectJsonLike`,
  `expectJsonMatch` com `pactum-matchers`) já cobrem 100% dos casos, o que
  reduz uma dependência e mantém uma única "linguagem" de asserção em toda a
  suíte.
