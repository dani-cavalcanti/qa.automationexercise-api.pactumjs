# Estratégia de Testes

## 1. Objetivo

Automatizar, com testes funcionais e de contrato, os endpoints da API pública
[ServeRest](https://serverest.dev/#/) definidos no escopo do desafio:

| Recurso  | Endpoint                  | Tipo de teste                          |
| -------- | -------------------------- | --------------------------------------- |
| Login    | `POST /login`               | Funcional + Contrato (Joi)              |
| Usuários | `POST /usuarios`            | Funcional + Contrato (Joi)              |
| Usuários | `DELETE /usuarios/{_id}`    | Funcional                               |
| Produtos | `POST /produtos`            | Funcional + Contrato (Joi)              |

## 2. Técnicas de design de teste (CTFL)

Cada endpoint foi analisado com pelo menos uma técnica de caixa-preta do
syllabus CTFL, documentada individualmente em `docs/test-design/`:

- **Particionamento de equivalência (Equivalence Partitioning)** — usado para
  identificar classes de entrada válidas e inválidas (ex.: formato de e-mail,
  domínio do campo `administrador`, presença/ausência de campos obrigatórios).
- **Análise de valor limite (Boundary Value Analysis)** — usado nos campos
  numéricos de `POST /produtos` (`preco` deve ser inteiro positivo;
  `quantidade` deve ser inteiro ≥ 0), explorando os limites 0/1 e -1/0.
- **Tabela de decisão (Decision Table Testing)** — usada para modelar regras
  de negócio com múltiplas condições combinadas: a matriz de
  autenticação/autorização de `POST /produtos` (token ausente × inválido ×
  não-admin × admin) e o comportamento de `DELETE /usuarios/{_id}`
  (id existente × inexistente × com carrinho vinculado).

O detalhamento de cada partição/limite/regra, incluindo o resultado esperado
e o status HTTP, está nos documentos:

- [`docs/test-design/01-login.md`](./test-design/01-login.md)
- [`docs/test-design/02-usuarios.md`](./test-design/02-usuarios.md)
- [`docs/test-design/03-produtos.md`](./test-design/03-produtos.md)

## 3. Testes de contrato

Conforme exigido, os testes de contrato usam exclusivamente a biblioteca
[Joi](https://joi.dev/) para validar o schema da resposta de sucesso — e não
o validador de JSON Schema nativo do PactumJS. Para isso, um *expect handler*
customizado (`src/support/joiExpectHandler.js`) integra o Joi à cadeia
fluente do Pactum (`.expect('validarContratoJoi', { schema })`), permitindo
validar o contrato sem abrir mão da sintaxe idiomática do framework.

Os schemas ficam em `src/schemas/*.schema.js` e validam:

- tipo e obrigatoriedade de cada campo;
- valores fixos esperados (ex.: `message` deve ser exatamente a string de
  sucesso documentada);
- formato do `_id` gerado pela API (`/^[a-zA-Z0-9]{16}$/`);
- ausência de campos extras não documentados (comportamento padrão do Joi,
  que rejeita chaves desconhecidas em `Joi.object({...})`).

## 4. Ambiente de testes e massa de dados

O ServeRest é uma API pública, compartilhada por todos os candidatos e
estudantes que a utilizam simultaneamente para prática. Isso impõe duas
decisões de design:

1. **Dados sempre únicos.** Toda massa de dados é gerada dinamicamente com
   `@faker-js/faker` (`src/factories/`), incluindo um sufixo UUID em campos
   com restrição de unicidade (`email` de usuário, `nome` de produto), para
   eliminar colisões entre execuções concorrentes de outros usuários da API.
2. **Limpeza dos dados criados.** Sempre que o endpoint necessário está no
   escopo do desafio, os specs removem os registros que criaram (`after`/
   `afterEach` chamando `DELETE /usuarios/{_id}`). Como não há um endpoint
   `DELETE /produtos` no escopo definido, os produtos de teste permanecem no
   ambiente — trade-off assumido e documentado também em
   [`docs/test-design/03-produtos.md`](./test-design/03-produtos.md).

## 5. Fora de escopo (documentado, não automatizado)

- Regra de negócio "não é permitido excluir usuário com carrinho cadastrado"
  (400 em `DELETE /usuarios/{_id}`): depende do recurso `/carrinhos`, que não
  faz parte da lista de endpoints do desafio. A condição está documentada na
  tabela de decisão do endpoint, mas não foi automatizada para não introduzir
  dependência em um endpoint fora do escopo solicitado.
