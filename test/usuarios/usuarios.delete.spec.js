'use strict';

const { StatusCodes } = require('http-status-codes');

const usuariosApi = require('../../src/api/usuarios.api');
const usuarioFactory = require('../../src/factories/usuario.factory');
const Messages = require('../../src/constants/messages');

/**
 * DELETE /usuarios/{_id}
 *
 * Técnicas aplicadas (detalhadas em docs/test-design/02-usuarios.md,
 * incluindo a tabela de decisão completa do endpoint):
 *  - Tabela de decisão para o parâmetro de rota `_id`: existente com formato
 *    válido / inexistente com formato válido / formato inválido;
 *  - Suposição de Erro (Error Guessing) na condição de formato do `_id`,
 *    que revelou o comportamento não-óbvio de a API responder 200 (em vez
 *    de 400/404) mesmo para um id claramente mal formado.
 *
 * Observação de escopo: a regra de negócio "não é permitido excluir usuário
 * com carrinho cadastrado" (400) depende do recurso /carrinhos, que está
 * fora do escopo de endpoints definido no desafio. A condição é documentada
 * na tabela de decisão, mas intencionalmente não automatizada aqui.
 */
describe('DELETE /usuarios/{_id} - exclusão de usuário', () => {
  it('deve excluir com sucesso um usuário existente', async () => {
    // Arrange
    const cadastro = await usuariosApi
      .criarUsuario(usuarioFactory.build())
      .expectStatus(StatusCodes.CREATED)
      .toss();

    // Act & Assert
    await usuariosApi
      .excluirUsuario(cadastro.body._id)
      .expectStatus(StatusCodes.OK)
      .expectJsonLike({ message: Messages.DELETE_SUCCESS })
      .toss();
  });

  it('deve retornar "Nenhum registro excluído" ao excluir um _id de formato válido porém inexistente', async () => {
    // Arrange: 16 caracteres alfanuméricos, no formato aceito, mas nunca gerado pela API.
    const idInexistente = 'a1b2c3d4e5f6a7b8';

    // Act & Assert
    await usuariosApi
      .excluirUsuario(idInexistente)
      .expectStatus(StatusCodes.OK)
      .expectJsonLike({ message: Messages.DELETE_NONE })
      .toss();
  });

  it('deve retornar "Nenhum registro excluído" ao excluir um _id de formato inválido', async () => {
    // Arrange: o schema de validação de DELETE /usuarios/{_id} exige apenas
    // uma string não vazia (sem checagem de formato/tamanho), então um id
    // curto passa na validação de schema e cai na regra de "não encontrado".
    const idFormatoInvalido = '123';

    // Act & Assert
    await usuariosApi
      .excluirUsuario(idFormatoInvalido)
      .expectStatus(StatusCodes.OK)
      .expectJsonLike({ message: Messages.DELETE_NONE })
      .toss();
  });
});
