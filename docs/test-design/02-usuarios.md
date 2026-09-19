# Design de Testes — Recurso `/usuarios`

## Parte 1 — `POST /usuarios` (criação de usuário)

Técnica aplicada: **Particionamento de Equivalência**.

### Contrato do endpoint

- **Requisição:** `{ nome: string, email: string, password: string, administrador: "true" | "false" }`
- **Sucesso (201):** `{ message: "Cadastro realizado com sucesso", _id: string(16) }`
- **Falha (400):** e-mail duplicado ou payload que não atende ao schema.

### Classes de equivalência

| # | Campo/Regra      | Classe                                         | Válida/Inválida | Exemplo                          | Status esperado | Mensagem esperada                       | Automatizado |
| - | ----------------- | ------------------------------------------------ | ----------------- | ------------------------------------ | ------------------ | ---------------------------------------- | -------------- |
| 1 | Payload completo  | Todos os campos válidos, `administrador="false"`  | Válida            | usuário comum gerado via factory       | 201               | `Cadastro realizado com sucesso`         | Sim            |
| 2 | Payload completo  | Todos os campos válidos, `administrador="true"`   | Válida            | usuário administrador                  | 201               | `Cadastro realizado com sucesso`         | Sim            |
| 3 | `email`           | E-mail já cadastrado (unicidade)                  | Inválida           | reaproveita e-mail de outro cadastro   | 400               | `Este email já está sendo usado`         | Sim            |
| 4 | `email`           | Formato inválido (sem `@`)                        | Inválida           | `email-sem-arroba.com`               | 400               | erro de validação de schema              | Sim            |
| 5 | `nome`            | Ausente                                           | Inválida           | chave `nome` removida do payload      | 400               | erro de validação de schema              | Sim            |
| 6 | `nome`            | Presente, porém vazio (`""`)                      | Inválida           | `nome: ""`                            | 400               | erro de validação de schema              | Sim            |
| 7 | `email`           | Ausente                                           | Inválida           | chave `email` removida                | 400               | erro de validação de schema              | Sim            |
| 8 | `password`        | Ausente                                           | Inválida           | chave `password` removida             | 400               | erro de validação de schema              | Sim            |
| 9 | `password`        | Presente, porém vazio (`""`)                      | Inválida           | `password: ""`                        | 400               | erro de validação de schema              | Sim            |
| 10| `administrador`   | Ausente                                           | Inválida           | chave `administrador` removida        | 400               | erro de validação de schema              | Sim            |
| 11| `administrador`   | Fora do domínio permitido (`"true"`/`"false"`)    | Inválida           | `administrador: "sim"`                | 400               | erro de validação de schema              | Sim            |

> **Nota sobre as classes 5 vs. 6 (e 7/8 vs. 9):** "campo ausente" e "campo
> presente mas vazio" são propositalmente tratadas como classes de
> equivalência **distintas**. O schema de validação da API (Joi, no
> back-end) trata as duas situações com regras diferentes (`required()` vs.
> string não vazia por padrão), então vale a pena confirmar ambos os
> caminhos — um erro comum de implementação é validar apenas a ausência da
> chave e esquecer o caso de string vazia.

O cenário de sucesso (classe 1) também é validado por **contrato (Joi)**,
garantindo o formato do `_id` retornado e a ausência de campos extras.

Implementação: [`test/usuarios/usuarios.create.spec.js`](../../test/usuarios/usuarios.create.spec.js).

---

## Parte 2 — `DELETE /usuarios/{_id}` (exclusão de usuário)

Técnica aplicada: **Tabela de Decisão**.

### Condições identificadas

- **C1 — O `_id` informado tem formato de ID válido do ServeRest?**
  (16 caracteres alfanuméricos — o endpoint não valida isso via schema, mas é
  relevante para a análise de partição do parâmetro de rota)
- **C2 — Existe um usuário com esse `_id` na base?**
- **C3 — O usuário possui um carrinho de compras vinculado?**

### Tabela de decisão

| Regra | C1: formato válido | C2: usuário existe | C3: possui carrinho | Ação/Status esperado | Mensagem esperada                                       | Automatizado |
| ----- | -------------------- | --------------------- | ---------------------- | ------------------------ | ---------------------------------------------------------- | -------------- |
| R1    | Sim                   | Sim                    | Não                     | 200 — exclui              | `Registro excluído com sucesso`                             | Sim            |
| R2    | Sim                   | Não                    | —                       | 200 — nada a excluir      | `Nenhum registro excluído`                                  | Sim            |
| R3    | Não                   | (irrelevante)          | —                       | 200 — nada a excluir      | `Nenhum registro excluído`                                  | Sim            |
| R4    | Sim                   | Sim                    | Sim                     | 400 — bloqueado           | `Não é permitido excluir usuário com carrinho cadastrado`   | **Não** — depende de `/carrinhos`, fora do escopo do desafio (documentado como risco conhecido) |

### Observações

- A condição **C1** (formato do `_id`) não veio da especificação do
  endpoint — ela surgiu de **Suposição de Erro (Error Guessing)**: a
  experiência de que APIs REST costumam confiar demais no formato de um
  parâmetro de rota motivou testar um `_id` deliberadamente mal formado. O
  resultado (regra **R3**) foi um achado relevante: como o schema de
  validação de `DELETE /usuarios/{_id}` (no back-end) exige apenas uma
  `string` não vazia — sem checagem de formato/tamanho — um `_id` mal
  formado **não** retorna 400/404, e sim 200 com `Nenhum registro
  excluído`, pois cai na mesma lógica de "não encontrado" de R2. Uma vez
  identificada, a condição foi formalizada na tabela de decisão acima e
  coberta por um teste dedicado, para não regredir silenciosamente caso a
  API passe a validar o formato do `_id` no futuro.
- A regra **R4** foi deixada de fora da automação porque monta uma
  pré-condição (criar um carrinho) usando o recurso `/carrinhos`, que não
  está entre os endpoints definidos no escopo do desafio. Ela permanece
  documentada aqui para evidenciar que a regra de negócio foi identificada e
  avaliada, ainda que conscientemente não implementada.

Implementação: [`test/usuarios/usuarios.delete.spec.js`](../../test/usuarios/usuarios.delete.spec.js).
