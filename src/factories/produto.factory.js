'use strict';

const { faker } = require('@faker-js/faker');

/**
 * Gera um payload válido de produto. O nome recebe um sufixo único para
 * não colidir com a regra de negócio "Já existe produto com esse nome".
 *
 * @param {object} overrides - campos para sobrescrever o payload padrão.
 */
function build(overrides = {}) {
  return {
    nome: `${faker.commerce.productName()} ${faker.string.uuid()}`,
    preco: faker.number.int({ min: 1, max: 5000 }),
    descricao: faker.commerce.productDescription(),
    quantidade: faker.number.int({ min: 0, max: 500 }),
    ...overrides,
  };
}

module.exports = { build };
