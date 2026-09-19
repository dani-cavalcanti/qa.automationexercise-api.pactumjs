'use strict';

/**
 * Caminhos (paths) dos endpoints da API ServeRest.
 * Centralizar os paths evita strings mágicas espalhadas pelos specs e
 * garante um único ponto de atualização caso a API mude uma rota.
 */
const Endpoints = {
  LOGIN: '/login',
  USUARIOS: '/usuarios',
  USUARIO_BY_ID: (id) => `/usuarios/${id}`,
  PRODUTOS: '/produtos',
  PRODUTO_BY_ID: (id) => `/produtos/${id}`,
};

module.exports = Endpoints;
