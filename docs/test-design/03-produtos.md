# Design de Testes — `POST /produtos`

## Contrato do endpoint

- **Requisição:** `{ nome: string, preco: number, descricao: string, quantidade: number, imagem?: string }`
- **Header obrigatório:** `Authorization: Bearer <token>` de um usuário
  **administrador** (rota protegida por `checkAdm`).
- **Sucesso (201):** `{ message: "Cadastro realizado com sucesso", _id: string(16) }`
- **Falhas possíveis:** `401` (token ausente/inválido), `403` (token válido
  de usuário não-admin), `400` (nome duplicado ou payload fora do schema).

## Parte 1 — Tabela de decisão: autenticação e autorização

Técnica aplicada: **Tabela de Decisão**.

### Condições

- **C1 — Header `Authorization` foi enviado?**
- **C2 — O token enviado é válido (assinatura/formato reconhecidos pela API)?**
- **C3 — O usuário dono do token é administrador (`administrador: "true"`)?**

### Tabela de decisão

| Regra | C1: header enviado | C2: token válido | C3: é admin | Status esperado | Mensagem esperada                                                              | Automatizado |
| ----- | --------------------- | ------------------- | ------------- | ------------------ | --------------------------------------------------------------------------------- | -------------- |
| R1    | Não                    | —                    | —             | 401                 | `Token de acesso ausente, inválido, expirado ou usuário do token não existe mais` | Sim            |
| R2    | Sim                    | Não                  | —             | 401                 | `Token de acesso ausente, inválido, expirado ou usuário do token não existe mais` | Sim            |
| R3    | Sim                    | Sim                  | Não           | 403                 | `Rota exclusiva para administradores`                                             | Sim            |
| R4    | Sim                    | Sim                  | Sim           | 201                 | `Cadastro realizado com sucesso`                                                   | Sim            |

Implementação: describe `tabela de decisão: autenticação e autorização` em
[`test/produtos/produtos.create.spec.js`](../../test/produtos/produtos.create.spec.js).

## Parte 2 — Análise de Valor Limite (campos numéricos)

Técnica aplicada: **Boundary Value Analysis**.

### Campo `preco` (regra: número inteiro **positivo**, i.e. `> 0`)

| Valor  | Partição             | Resultado esperado | Automatizado |
| ------ | ---------------------- | --------------------- | -------------- |
| `-1`   | Inválida (negativo)     | 400                   | Sim            |
| `0`    | Inválida (limite — não é positivo) | 400   | Sim            |
| `1`    | Válida (menor valor positivo — limite) | 201 | Sim          |
| `10.5` | Inválida (não é inteiro) | 400                  | Sim            |

### Campo `quantidade` (regra: número inteiro **maior ou igual a zero**, i.e. `>= 0`)

| Valor | Partição                          | Resultado esperado | Automatizado |
| ----- | ----------------------------------- | --------------------- | -------------- |
| `-1`  | Inválida (limite — abaixo do mínimo) | 400                  | Sim            |
| `0`   | Válida (menor valor permitido — limite) | 201               | Sim            |

Implementação: describes `análise de valor limite: campo "preco"` e `campo
"quantidade"` em
[`test/produtos/produtos.create.spec.js`](../../test/produtos/produtos.create.spec.js).

## Parte 3 — Particionamento de equivalência (demais regras)

| # | Regra                                              | Classe   | Status esperado | Mensagem esperada          | Automatizado |
| - | ---------------------------------------------------- | ---------- | ------------------ | ---------------------------- | -------------- |
| 1 | Nome de produto já cadastrado                        | Inválida   | 400                 | `Já existe produto com esse nome` | Sim       |
| 2 | Campo `nome` ausente                                 | Inválida   | 400                 | erro de validação de schema  | Sim            |
| 3 | Campo `preco` ausente                                | Inválida   | 400                 | erro de validação de schema  | Sim            |
| 4 | Campo `descricao` ausente                            | Inválida   | 400                 | erro de validação de schema  | Sim            |
| 5 | Campo `quantidade` ausente                           | Inválida   | 400                 | erro de validação de schema  | Sim            |

## Observações de escopo

O ServeRest não expõe (no escopo definido pelo desafio) um `DELETE
/produtos`, portanto os produtos criados pelos testes de sucesso permanecem
no ambiente compartilhado. Essa é uma decisão consciente — ver
[`docs/test-strategy.md`](../test-strategy.md#4-ambiente-de-testes-e-massa-de-dados)
— e não afeta a determinicidade dos testes, já que cada nome de produto é
gerado com um sufixo único (UUID) por execução.
