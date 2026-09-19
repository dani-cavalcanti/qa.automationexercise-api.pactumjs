'use strict';

const { regex } = require('pactum-matchers');
const { StatusCodes } = require('http-status-codes');

const usuariosApi = require('../../src/api/usuarios.api');
const usuarioFactory = require('../../src/factories/usuario.factory');
const Messages = require('../../src/constants/messages');
const { usuarioCreatedSchema } = require('../../src/schemas/usuario.schema');
const { HANDLER_NAME: VALIDAR_CONTRATO_JOI } = require('../../src/support/joiExpectHandler');

/**
 * POST /usuarios
 *
 * Técnicas aplicadas (detalhadas em docs/test-design/02-usuarios.md):
 *  - Particionamento de equivalência para os campos nome/email/password/administrador;
 *  - Casos de e-mail duplicado (regra de negócio de unicidade);
 *  - Teste de contrato (Joi) do payload de sucesso.
 */
describe('POST /usuarios - criação de usuário', () => {
  const idsParaLimpeza = [];

  // Remove, ao final da suíte, todos os usuários criados nos testes de
  // sucesso para não acumular massa de dados no ambiente compartilhado.
  after(async () => {
    await Promise.all(idsParaLimpeza.map((id) => usuariosApi.excluirUsuario(id).toss()));
  });

  describe('cenários de sucesso (201)', () => {
    it('deve cadastrar um usuário comum (administrador = "false")', async () => {
      // Arrange
      const payload = usuarioFactory.build({ administrador: 'false' });

      // Act & Assert
      const response = await usuariosApi
        .criarUsuario(payload)
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({ message: Messages.POST_SUCCESS })
        .expectJsonMatch({ _id: regex(/^[a-zA-Z0-9]{16}$/) })
        .toss();

      idsParaLimpeza.push(response.body._id);
    });

    it('deve cadastrar um usuário administrador (administrador = "true")', async () => {
      // Arrange
      const payload = usuarioFactory.build({ administrador: 'true' });

      // Act & Assert
      const response = await usuariosApi
        .criarUsuario(payload)
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({ message: Messages.POST_SUCCESS })
        .toss();

      idsParaLimpeza.push(response.body._id);
    });

    it('deve validar o contrato da resposta de cadastro com sucesso', async () => {
      // Arrange
      const payload = usuarioFactory.build();

      // Act & Assert
      const response = await usuariosApi
        .criarUsuario(payload)
        .expectStatus(StatusCodes.CREATED)
        .expect(VALIDAR_CONTRATO_JOI, { schema: usuarioCreatedSchema })
        .toss();

      idsParaLimpeza.push(response.body._id);
    });
  });

  describe('regra de negócio: e-mail único (400)', () => {
    it('não deve cadastrar dois usuários com o mesmo e-mail', async () => {
      // Arrange: primeiro cadastro (válido) ocupa o e-mail.
      const payload = usuarioFactory.build();
      const primeiroCadastro = await usuariosApi
        .criarUsuario(payload)
        .expectStatus(StatusCodes.CREATED)
        .toss();
      idsParaLimpeza.push(primeiroCadastro.body._id);

      // Act & Assert: segundo cadastro reaproveita o mesmo e-mail.
      await usuariosApi
        .criarUsuario(usuarioFactory.build({ email: payload.email }))
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectJsonLike({ message: Messages.EMAIL_ALREADY_USED })
        .toss();
    });
  });

  describe('validação de campos obrigatórios ausentes (400)', () => {
    const camposObrigatorios = ['nome', 'email', 'password', 'administrador'];

    camposObrigatorios.forEach((campo) => {
      it(`deve retornar 400 quando o campo "${campo}" estiver ausente`, async () => {
        // Arrange
        const payload = usuarioFactory.build();
        delete payload[campo];

        // Act & Assert
        await usuariosApi.criarUsuario(payload).expectStatus(StatusCodes.BAD_REQUEST).toss();
      });
    });
  });

  describe('particionamento de valores inválidos (400)', () => {
    const casosInvalidos = [
      { descricao: 'e-mail com formato inválido', overrides: { email: 'email-sem-arroba.com' } },
      { descricao: 'nome vazio (string vazia)', overrides: { nome: '' } },
      { descricao: 'password vazio (string vazia)', overrides: { password: '' } },
      {
        descricao: 'administrador fora do domínio permitido ("true"/"false")',
        overrides: { administrador: 'sim' },
      },
    ];

    casosInvalidos.forEach(({ descricao, overrides }) => {
      it(`deve retornar 400 quando: ${descricao}`, async () => {
        // Arrange
        const payload = usuarioFactory.build(overrides);

        // Act & Assert
        await usuariosApi.criarUsuario(payload).expectStatus(StatusCodes.BAD_REQUEST).toss();
      });
    });
  });
});
