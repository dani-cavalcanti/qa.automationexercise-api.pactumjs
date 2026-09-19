'use strict';

const Joi = require('joi');
const Messages = require('../constants/messages');
const { idSchema } = require('./common.schema');

/**
 * Contrato da resposta de sucesso de POST /produtos (201).
 */
const produtoCreatedSchema = Joi.object({
  message: Joi.string().valid(Messages.POST_SUCCESS).required(),
  _id: idSchema,
});

module.exports = { produtoCreatedSchema };
