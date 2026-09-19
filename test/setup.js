'use strict';

const pactum = require('pactum');
const environment = require('../src/config/environment');
const { registerJoiExpectHandler } = require('../src/support/joiExpectHandler');

/**
 * Root hook plugin do Mocha (carregado via .mocharc.yml -> "require").
 * Executa uma única vez, antes de toda a suíte, e configura o Pactum:
 *  - URL base da API sob teste;
 *  - timeout padrão das requisições;
 *  - o expect handler customizado que integra o Joi ao Pactum.
 *
 * Usa a API de "root hook plugins" (`exports.mochaHooks`) em vez de um
 * `before()` global, pois arquivos carregados via `--require` são
 * avaliados antes dos globais de suíte estarem disponíveis.
 */
exports.mochaHooks = {
  beforeAll() {
    pactum.request.setBaseUrl(environment.baseUrl);
    pactum.request.setDefaultTimeout(environment.requestTimeout);
    registerJoiExpectHandler();
  },
};
