'use strict';

const Joi = require('joi');
const Messages = require('../constants/messages');

/**
 * Contrato da resposta de sucesso de POST /login (200).
 * `.unknown(false)` (padrão do Joi) garante que a resposta não traga campos
 * além dos documentados, protegendo o consumidor contra breaking changes
 * silenciosas da API.
 */
const loginSuccessSchema = Joi.object({
  message: Joi.string().valid(Messages.LOGIN_SUCCESS).required(),
  authorization: Joi.string()
    .pattern(/^Bearer\s.+/)
    .required(),
});

module.exports = { loginSuccessSchema };
