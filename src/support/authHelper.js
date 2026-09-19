'use strict';

const { StatusCodes } = require('http-status-codes');
const usuariosApi = require('../api/usuarios.api');
const loginApi = require('../api/login.api');
const usuarioFactory = require('../factories/usuario.factory');

/**
 * Cria um usuário administrador e efetua login, retornando o header de
 * autorização pronto para uso em rotas protegidas (ex.: POST /produtos).
 *
 * Centraliza esse fluxo de "Arrange" recorrente para evitar repetir a
 * criação + login de um admin em cada suíte que precisa de um token válido.
 */
async function criarAdminAutenticado() {
  const dadosAdmin = usuarioFactory.buildAdmin();

  const cadastroResponse = await usuariosApi
    .criarUsuario(dadosAdmin)
    .expectStatus(StatusCodes.CREATED)
    .toss();

  const loginResponse = await loginApi
    .login({ email: dadosAdmin.email, password: dadosAdmin.password })
    .expectStatus(StatusCodes.OK)
    .toss();

  return {
    usuario: { ...dadosAdmin, _id: cadastroResponse.body._id },
    authorizationHeader: loginResponse.body.authorization,
  };
}

module.exports = { criarAdminAutenticado };
