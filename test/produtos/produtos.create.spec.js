'use strict';

const { regex } = require('pactum-matchers');
const { StatusCodes } = require('http-status-codes');

const produtosApi = require('../../src/api/produtos.api');
const usuariosApi = require('../../src/api/usuarios.api');
const loginApi = require('../../src/api/login.api');
const usuarioFactory = require('../../src/factories/usuario.factory');
const produtoFactory = require('../../src/factories/produto.factory');
const Messages = require('../../src/constants/messages');
const { produtoCreatedSchema } = require('../../src/schemas/produto.schema');
const { HANDLER_NAME: VALIDAR_CONTRATO_JOI } = require('../../src/support/joiExpectHandler');
const { criarAdminAutenticado } = require('../../src/support/authHelper');

/**
 * POST /produtos
 *
 * Técnicas aplicadas (detalhadas em docs/test-design/03-produtos.md):
 *  - Tabela de decisão para a regra de autenticação/autorização (token
 *    ausente / inválido / de usuário não-admin / de usuário admin);
 *  - Análise de valor limite para os campos numéricos `preco` (> 0, inteiro)
 *    e `quantidade` (>= 0, inteiro);
 *  - Particionamento de equivalência para os campos obrigatórios;
 *  - Suposição de Erro (Error Guessing) para tipos de dado inválidos
 *    (ex.: decimal onde a API exige inteiro);
 *  - Teste de contrato (Joi) do payload de sucesso.
 *
 * Observação de escopo: não há endpoint DELETE /produtos no desafio, então
 * os produtos criados aqui permanecem no ambiente compartilhado do
 * ServeRest (mesma premissa usada pelas demais suítes de automação da
 * comunidade contra esse ambiente de estudo).
 */
describe('POST /produtos - cadastro de produto', () => {
  let admin;

  // Arrange (nível de suíte): usuário administrador autenticado, necessário
  // para a maioria dos cenários de sucesso deste endpoint protegido.
  before(async () => {
    admin = await criarAdminAutenticado();
  });

  after(async () => {
    await usuariosApi.excluirUsuario(admin.usuario._id).toss();
  });

  describe('cenários de sucesso (201)', () => {
    it('deve cadastrar um produto com um usuário administrador autenticado', async () => {
      // Arrange
      const payload = produtoFactory.build();

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({ message: Messages.POST_SUCCESS })
        .expectJsonMatch({ _id: regex(/^[a-zA-Z0-9]{16}$/) })
        .toss();
    });

    it('deve validar o contrato da resposta de cadastro de produto com sucesso', async () => {
      // Arrange
      const payload = produtoFactory.build();

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.CREATED)
        .expect(VALIDAR_CONTRATO_JOI, { schema: produtoCreatedSchema })
        .toss();
    });
  });

  describe('tabela de decisão: autenticação e autorização', () => {
    it('não deve cadastrar produto sem o header Authorization (401)', async () => {
      // Arrange
      const payload = produtoFactory.build();

      // Act & Assert
      await produtosApi
        .criarProduto(payload, undefined)
        .expectStatus(StatusCodes.UNAUTHORIZED)
        .expectJsonLike({ message: Messages.INVALID_TOKEN })
        .toss();
    });

    it('não deve cadastrar produto com um token inválido/malformado (401)', async () => {
      // Arrange
      const payload = produtoFactory.build();

      // Act & Assert
      await produtosApi
        .criarProduto(payload, 'Bearer token-invalido-123')
        .expectStatus(StatusCodes.UNAUTHORIZED)
        .expectJsonLike({ message: Messages.INVALID_TOKEN })
        .toss();
    });

    it('não deve cadastrar produto com um token válido de usuário não-administrador (403)', async () => {
      // Arrange: usuário comum autenticado (administrador = "false").
      const usuarioComum = usuarioFactory.build();
      const cadastro = await usuariosApi
        .criarUsuario(usuarioComum)
        .expectStatus(StatusCodes.CREATED)
        .toss();
      const login = await loginApi
        .login({ email: usuarioComum.email, password: usuarioComum.password })
        .expectStatus(StatusCodes.OK)
        .toss();

      // Act & Assert
      await produtosApi
        .criarProduto(produtoFactory.build(), login.body.authorization)
        .expectStatus(StatusCodes.FORBIDDEN)
        .expectJsonLike({ message: Messages.REQUIRED_ADMIN })
        .toss();

      // Cleanup
      await usuariosApi.excluirUsuario(cadastro.body._id).toss();
    });
  });

  describe('regra de negócio: nome de produto único (400)', () => {
    it('não deve cadastrar dois produtos com o mesmo nome', async () => {
      // Arrange: primeiro cadastro ocupa o nome.
      const payload = produtoFactory.build();
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.CREATED)
        .toss();

      // Act & Assert
      await produtosApi
        .criarProduto(produtoFactory.build({ nome: payload.nome }), admin.authorizationHeader)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectJsonLike({ message: Messages.NAME_ALREADY_USED })
        .toss();
    });
  });

  describe('validação de campos obrigatórios ausentes (400)', () => {
    const camposObrigatorios = ['nome', 'preco', 'descricao', 'quantidade'];

    camposObrigatorios.forEach((campo) => {
      it(`deve retornar 400 quando o campo "${campo}" estiver ausente`, async () => {
        // Arrange
        const payload = produtoFactory.build();
        delete payload[campo];

        // Act & Assert
        await produtosApi
          .criarProduto(payload, admin.authorizationHeader)
          .expectStatus(StatusCodes.BAD_REQUEST)
          .toss();
      });
    });
  });

  describe('análise de valor limite: campo "preco" (número inteiro positivo)', () => {
    it('deve aceitar o menor valor válido (preco = 1)', async () => {
      // Arrange
      const payload = produtoFactory.build({ preco: 1 });

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.CREATED)
        .toss();
    });

    it('não deve aceitar o valor limite inválido (preco = 0)', async () => {
      // Arrange
      const payload = produtoFactory.build({ preco: 0 });

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .toss();
    });

    it('não deve aceitar valores negativos (preco = -1)', async () => {
      // Arrange
      const payload = produtoFactory.build({ preco: -1 });

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .toss();
    });
  });

  describe('análise de valor limite: campo "quantidade" (número inteiro >= 0)', () => {
    it('deve aceitar o menor valor válido (quantidade = 0)', async () => {
      // Arrange
      const payload = produtoFactory.build({ quantidade: 0 });

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.CREATED)
        .toss();
    });

    it('não deve aceitar valores negativos (quantidade = -1)', async () => {
      // Arrange
      const payload = produtoFactory.build({ quantidade: -1 });

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .toss();
    });
  });

  // Casos que não nascem de uma partição ou de um limite da especificação,
  // e sim da experiência com falhas comuns de APIs REST (CTFL: Suposição de
  // Erro / Error Guessing) — ver docs/test-design/03-produtos.md.
  describe('suposição de erro: tipos de dado inválidos', () => {
    it('não deve aceitar um valor decimal para "preco" (número inteiro é exigido)', async () => {
      // Arrange
      const payload = produtoFactory.build({ preco: 10.5 });

      // Act & Assert
      await produtosApi
        .criarProduto(payload, admin.authorizationHeader)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .toss();
    });
  });
});
