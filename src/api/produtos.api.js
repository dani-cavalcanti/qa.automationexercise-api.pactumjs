'use strict';

const pactum = require('pactum');
const Endpoints = require('../constants/endpoints');

/**
 * Encapsula as chamadas HTTP do recurso /produtos.
 * POST /produtos exige um token de administrador (ver
 * middlewares/authentication-middleware.js do ServeRest), por isso
 * `criarProduto` aceita o header de autorização já formatado
 * (ex.: "Bearer <token>"), quando aplicável.
 */

function criarProduto(payload, authorizationHeader) {
  const spec = pactum.spec().name('POST /produtos').post(Endpoints.PRODUTOS).withJson(payload);

  if (authorizationHeader) {
    spec.withHeaders('Authorization', authorizationHeader);
  }

  return spec;
}

module.exports = { criarProduto };
