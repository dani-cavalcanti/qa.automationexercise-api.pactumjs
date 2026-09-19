'use strict';

require('dotenv').config();

/**
 * Configuração de ambiente centralizada. Qualquer variável nova usada pelos
 * testes deve ser lida aqui, nunca diretamente via `process.env` nos specs,
 * para manter uma única fonte de verdade e facilitar a criação de novos
 * ambientes (ex.: homologação, mock local) no futuro.
 */
const environment = {
  baseUrl: process.env.BASE_URL || 'https://serverest.dev',
  requestTimeout: Number(process.env.REQUEST_TIMEOUT) || 10000,
};

module.exports = environment;
