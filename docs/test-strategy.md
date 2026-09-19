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

## 2. Técnicas de design de teste (CTFL v4.0)

O syllabus CTFL v4.0 organiza as técnicas de teste em quatro categorias
(capítulo 4 — Análise e Modelagem de Teste): caixa-preta (baseadas em
especificação), caixa-branca (baseadas em estrutura), baseadas em
experiência, e abordagens colaborativas. A tabela abaixo mapeia
explicitamente cada categoria/técnica do syllabus a este projeto — inclusive
as que **não** se aplicam, com a justificativa — para deixar claro que a
ausência é uma decisão consciente, não uma lacuna.

| Categoria (CTFL v4.0) | Técnica | Aplicada? | Onde / por quê |
| --- | --- | --- | --- |
| Caixa-preta (K3) | Particionamento de Equivalência | Sim | Classes válidas/inválidas de cada campo de entrada (formato de e-mail, domínio de `administrador`, presença/ausência de campos obrigatórios). Ver `test-design/01`, `02`, `03`. |
| Caixa-preta (K3) | Análise de Valor Limite | Sim | Fronteiras dos campos numéricos de `POST /produtos` (`preco > 0`, `quantidade >= 0`), testando os limites exatos (0/1, -1/0). Ver `test-design/03`. |
| Caixa-preta (K3) | Tabela de Decisão | Sim | Regra de autenticação/autorização de `POST /produtos` (token ausente × inválido × não-admin × admin) e o comportamento de `DELETE /usuarios/{_id}` (id existente × inexistente × com carrinho). Ver `test-design/02` e `03`. |
| Caixa-preta (K3) | Transição de Estado | Não aplicável | Nenhum dos quatro endpoints do escopo do desafio expõe uma máquina de estados (ex.: um recurso cujo comportamento dependa de um histórico de estados anteriores, como um pedido "Aprovado → Enviado"). O próprio ServeRest tem esse tipo de fluxo em `/carrinhos` (ex.: estoque reabastecido, carrinho concluído), mas esse recurso está fora do escopo definido. |
| Caixa-branca (K2) | Teste de Instrução / Teste de Ramificação | Não aplicável | Este projeto testa o ServeRest como um **consumidor externo de uma API pública** (caixa-preta), sem instrumentação de cobertura sobre o código do serviço. O código-fonte do ServeRest foi consultado durante o design (ver seção "Como e por que usei IA" no README), mas **apenas como fonte de verdade documental** — para confirmar mensagens de erro e regras de negócio exatas — nunca para guiar cobertura de instrução/ramificação, o que exigiria rodar a suíte contra uma instância local instrumentada (fora do escopo do desafio). |
| Baseada em experiência (K2) | Suposição de Erro (Error Guessing) | Sim | Vários casos não derivam de uma partição/limite formal, e sim da experiência com bugs comuns de APIs REST: campo presente-porém-vazio vs. ausente (`nome: ""` vs. sem `nome`), envio de um número decimal onde a API exige inteiro (`preco: 10.5`), e um `_id` de formato claramente inválido em `DELETE /usuarios/{_id}` — que revelou o comportamento não-óbvio de retornar 200 em vez de 400/404. Ver as seções "Suposição de Erro" em `test-design/02` e `03`. |
| Baseada em experiência (K2) | Teste Exploratório | Não formalmente aplicado | O desafio pede uma suíte de regressão determinística; não há uma sessão de exploração documentada com *test charter*. A investigação do comportamento real da API (seção "Pesquisa de contrato real" no README) teve o mesmo espírito investigativo, mas foi estruturada como leitura de código-fonte, não como uma sessão exploratória cronometrada. |
| Baseada em experiência (K2) | Teste Baseado em Checklist | Sim (nível de projeto) | A lista "Itens que Serão Avaliados" do próprio enunciado do desafio foi tratada como checklist de aceitação do projeto — ver [`docs/checklist-aceitacao.md`](./checklist-aceitacao.md), que mapeia cada item do enunciado ao artefato que o satisfaz. |
| Colaborativa (v4.0) | ATDD / BDD | Não aplicável (por exigência do desafio) | O enunciado veda explicitamente a sintaxe Gherkin. Como BDD é indissociável desse formato (Dado/Quando/Então) no contexto de teste automatizado, a técnica não foi usada — os mesmos cenários de aceitação foram expressos em Mocha/Pactum com nomes de teste descritivos em português, sem o vocabulário Gherkin. |

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
