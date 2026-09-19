'use strict';

const Joi = require('joi');

/**
 * Fragmentos de schema Joi reaproveitados entre contratos de diferentes
 * recursos (usuários, produtos), evitando duplicar a mesma regra em
 * múltiplos arquivos.
 */

// O ServeRest gera IDs alfanuméricos de 16 caracteres para todos os recursos
// (ver src/models/*.js no repositório oficial: /^[a-zA-Z0-9]{16}$/).
const idSchema = Joi.string()
  .pattern(/^[a-zA-Z0-9]{16}$/)
  .required();

module.exports = { idSchema };
