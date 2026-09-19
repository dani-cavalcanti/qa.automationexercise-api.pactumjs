'use strict';

const { faker } = require('@faker-js/faker');

/**
 * Gera um payload válido de usuário. Cada chamada produz um e-mail único
 * (via UUID) para evitar colisões com o "Este email já está sendo usado",
 * já que o ServeRest é uma base compartilhada entre todos os candidatos/estudantes
 * executando testes simultaneamente.
 *
 * @param {object} overrides - campos para sobrescrever o payload padrão,
 *   útil para forçar cenários inválidos (partição negativa) a partir de um
 *   caso base válido.
 */
function build(overrides = {}) {
  return {
    nome: faker.person.fullName(),
    email: `qa.${faker.string.uuid()}@teste-serverest.com`,
    password: faker.internet.password({ length: 10 }),
    administrador: 'false',
    ...overrides,
  };
}

/**
 * Atalho para gerar um payload de usuário administrador, necessário para
 * obter um token com permissão de cadastrar produtos (POST /produtos).
 */
function buildAdmin(overrides = {}) {
  return build({ administrador: 'true', ...overrides });
}

module.exports = { build, buildAdmin };
