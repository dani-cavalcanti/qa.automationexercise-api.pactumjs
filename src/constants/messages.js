'use strict';

/**
 * Mensagens de resposta retornadas pela API ServeRest.
 * Extraídas do código-fonte público do projeto para garantir fidelidade
 * (https://github.com/ServeRest/ServeRest/blob/master/src/utils/constants.js).
 * Centralizá-las evita duplicar literais nos specs e facilita a manutenção
 * caso a API altere algum texto.
 */
const Messages = {
  POST_SUCCESS: 'Cadastro realizado com sucesso',
  DELETE_SUCCESS: 'Registro excluído com sucesso',
  DELETE_NONE: 'Nenhum registro excluído',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGIN_FAIL: 'Email e/ou senha inválidos',
  EMAIL_ALREADY_USED: 'Este email já está sendo usado',
  NAME_ALREADY_USED: 'Já existe produto com esse nome',
  REQUIRED_ADMIN: 'Rota exclusiva para administradores',
  INVALID_TOKEN: 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
  DELETE_USER_WITH_CART: 'Não é permitido excluir usuário com carrinho cadastrado',
};

module.exports = Messages;
