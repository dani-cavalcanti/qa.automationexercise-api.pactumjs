'use strict';

const pactum = require('pactum');
const Endpoints = require('../constants/endpoints');

/**
 * Encapsula a chamada HTTP de POST /login. Retorna a `spec` do Pactum ainda
 * não executada (não faz `await`/`.toss()`) para que o teste possa
 * encadear suas próprias expectativas antes de disparar a requisição.
 *
 * @param {{ email: string, password: string }} credentials
 */
function login(credentials) {
  return pactum.spec().name('POST /login').post(Endpoints.LOGIN).withJson(credentials);
}

module.exports = { login };
