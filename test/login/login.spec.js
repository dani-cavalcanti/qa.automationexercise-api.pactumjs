'use strict';

const { regex } = require('pactum-matchers');
const { StatusCodes } = require('http-status-codes');

const loginApi = require('../../src/api/login.api');
const usuariosApi = require('../../src/api/usuarios.api');
const usuarioFactory = require('../../src/factories/usuario.factory');
const Messages = require('../../src/constants/messages');
const { loginSuccessSchema } = require('../../src/schemas/login.schema');
const { HANDLER_NAME: VALIDAR_CONTRATO_JOI } = require('../../src/support/joiExpectHandler');

/**
 * POST /login
 *
 * Técnicas aplicadas (detalhadas em docs/test-design/01-login.md):
 *  - Particionamento de equivalência: credenciais válidas / senha incorreta /
 *    e-mail não cadastrado / e-mail com formato inválido / campos ausentes.
 *  - Teste de contrato (Joi) do payload de sucesso.
 */
describe('POST /login', () => {
  let usuarioCadastrado;

  // Arrange (nível de suíte): garante um usuário válido e conhecido no
  // sistema para os cenários de login bem-sucedido / senha incorreta.
  before(async () => {
    usuarioCadastrado = usuarioFactory.build();

    const response = await usuariosApi
      .criarUsuario(usuarioCadastrado)
      .expectStatus(StatusCodes.CREATED)
      .toss();

    usuarioCadastrado._id = response.body._id;
  });

  // Limpa o usuário criado para a suíte, evitando resíduo de dados no
  // ambiente compartilhado do ServeRest.
  after(async () => {
    await usuariosApi.excluirUsuario(usuarioCadastrado._id).toss();
  });

  describe('cenários de sucesso', () => {
    it('deve autenticar com credenciais válidas e retornar um token de autorização', async () => {
      // Arrange
      const credenciais = {
        email: usuarioCadastrado.email,
        password: usuarioCadastrado.password,
      };

      // Act & Assert
      // (o Pactum executa a requisição em .toss(); as expectativas abaixo
      // são a fase de "Assert" avaliada sobre a resposta recebida)
      await loginApi
        .login(credenciais)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ message: Messages.LOGIN_SUCCESS })
        .expectJsonMatch({ authorization: regex(/^Bearer\s.+/) })
        .toss();
    });

    it('deve validar o contrato da resposta de login com sucesso', async () => {
      // Arrange
      const credenciais = {
        email: usuarioCadastrado.email,
        password: usuarioCadastrado.password,
      };

      // Act & Assert
      await loginApi
        .login(credenciais)
        .expectStatus(StatusCodes.OK)
        .expect(VALIDAR_CONTRATO_JOI, { schema: loginSuccessSchema })
        .toss();
    });
  });

  describe('cenários de credenciais inválidas (login recusado - 401)', () => {
    it('não deve autenticar com senha incorreta para um e-mail existente', async () => {
      // Arrange
      const credenciais = { email: usuarioCadastrado.email, password: 'senha-incorreta' };

      // Act & Assert
      await loginApi
        .login(credenciais)
        .expectStatus(StatusCodes.UNAUTHORIZED)
        .expectJsonLike({ message: Messages.LOGIN_FAIL })
        .toss();
    });

    it('não deve autenticar um e-mail com formato válido porém não cadastrado', async () => {
      // Arrange
      const credenciais = {
        email: 'nao.cadastrado.qa@teste-serverest.com',
        password: 'qualquer-senha',
      };

      // Act & Assert
      await loginApi
        .login(credenciais)
        .expectStatus(StatusCodes.UNAUTHORIZED)
        .expectJsonLike({ message: Messages.LOGIN_FAIL })
        .toss();
    });
  });

  describe('cenários de payload inválido (falha de validação - 400)', () => {
    const casosInvalidos = [
      {
        descricao: 'e-mail com formato inválido (sem "@")',
        payload: { email: 'email-invalido', password: '123456' },
      },
      {
        descricao: 'e-mail ausente',
        payload: { password: '123456' },
      },
      {
        descricao: 'senha ausente',
        payload: { email: 'qa@teste-serverest.com' },
      },
      {
        descricao: 'payload vazio',
        payload: {},
      },
    ];

    casosInvalidos.forEach(({ descricao, payload }) => {
      it(`deve retornar 400 quando: ${descricao}`, async () => {
        // Act & Assert
        await loginApi.login(payload).expectStatus(StatusCodes.BAD_REQUEST).toss();
      });
    });
  });
});
