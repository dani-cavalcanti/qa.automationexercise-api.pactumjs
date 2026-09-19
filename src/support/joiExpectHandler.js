'use strict';

const pactum = require('pactum');

const HANDLER_NAME = 'validarContratoJoi';

/**
 * Registra um "expect handler" customizado no PactumJS que delega a
 * validação de schema para o Joi, conforme exigido para os testes de
 * contrato. Isso permite validar o contrato dentro da própria cadeia
 * fluente do Pactum (`.expect(HANDLER_NAME, { schema })`), em vez de usar
 * o validador nativo do Pactum (que é baseado em JSON Schema/AJV).
 *
 * Deve ser chamado uma única vez, antes da suíte rodar (ver test/setup.js).
 */
function registerJoiExpectHandler() {
  pactum.handler.addExpectHandler(HANDLER_NAME, (ctx) => {
    const { schema } = ctx.data;
    const { error } = schema.validate(ctx.res.json, { abortEarly: false });

    if (error) {
      throw new Error(`Contrato inválido (Joi): ${error.message}`);
    }
  });
}

module.exports = { registerJoiExpectHandler, HANDLER_NAME };
