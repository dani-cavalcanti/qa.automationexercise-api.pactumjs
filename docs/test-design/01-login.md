# Design de Testes — `POST /login`

Técnica aplicada: **Particionamento de Equivalência**.

## 1. Contrato do endpoint

- **Requisição:** `{ email: string, password: string }`
- **Sucesso (200):** `{ message: "Login realizado com sucesso", authorization: "Bearer <jwt>" }`
- **Falha de autenticação (401):** `{ message: "Email e/ou senha inválidos" }`
- **Falha de validação de schema (400):** payload que não atende ao formato
  exigido (campo ausente ou e-mail com formato inválido).

## 2. Classes de equivalência

| # | Classe                                            | Válida/Inválida | Exemplo                              | Status esperado | Mensagem esperada                  | Automatizado |
| - | -------------------------------------------------- | ----------------- | --------------------------------------- | ------------------ | ---------------------------------- | -------------- |
| 1 | E-mail cadastrado + senha correta                   | Válida            | credenciais de um usuário criado no setup | 200               | `Login realizado com sucesso`      | Sim            |
| 2 | E-mail cadastrado + senha incorreta                 | Inválida           | senha aleatória para e-mail existente     | 401               | `Email e/ou senha inválidos`        | Sim            |
| 3 | E-mail com formato válido, porém não cadastrado     | Inválida           | `nao.cadastrado@teste.com`              | 401               | `Email e/ou senha inválidos`        | Sim            |
| 4 | E-mail com formato inválido (sem `@`)               | Inválida           | `email-invalido`                        | 400               | erro de validação de schema        | Sim            |
| 5 | Campo `email` ausente                               | Inválida           | `{ password: "123456" }`                | 400               | erro de validação de schema        | Sim            |
| 6 | Campo `password` ausente                            | Inválida           | `{ email: "qa@teste.com" }`             | 400               | erro de validação de schema        | Sim            |
| 7 | Payload vazio (ambos os campos ausentes)            | Inválida           | `{}`                                    | 400               | erro de validação de schema        | Sim            |

## 3. Observações de projeto

- As classes 2 e 3 são tecnicamente distintas do ponto de vista de negócio
  (senha errada vs. usuário inexistente), mas a API **intencionalmente**
  retorna a mesma mensagem genérica (`Email e/ou senha inválidos`) para
  ambas — um comportamento correto de segurança (evita enumeração de
  usuários por e-mail). O teste automatizado cobre as duas classes
  separadamente para documentar esse comportamento, mesmo compartilhando o
  mesmo resultado esperado.
- A classe 1 (sucesso) também é coberta por um **teste de contrato** (Joi),
  garantindo o formato de `authorization` (`Bearer <token>`) e que nenhum
  campo além de `message`/`authorization` seja retornado.
- Implementação: [`test/login/login.spec.js`](../../test/login/login.spec.js).
