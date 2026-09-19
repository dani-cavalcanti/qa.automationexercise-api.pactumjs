'use strict';

const pactum = require('pactum');
const Endpoints = require('../constants/endpoints');

/**
 * Encapsula as chamadas HTTP do recurso /usuarios. Cada função devolve a
 * `spec` do Pactum pronta para receber expectativas do chamador, mantendo
 * a montagem da requisição (método, path, corpo) em um único lugar.
 */

function criarUsuario(payload) {
  return pactum.spec().name('POST /usuarios').post(Endpoints.USUARIOS).withJson(payload);
}

function excluirUsuario(id) {
  return pactum.spec().name('DELETE /usuarios/{_id}').delete(Endpoints.USUARIO_BY_ID(id));
}

module.exports = { criarUsuario, excluirUsuario };
