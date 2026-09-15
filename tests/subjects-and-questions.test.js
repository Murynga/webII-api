// tests/subjects-and-questions.test.js
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

const createdUserIds = [];
const createdSubjectIds = [];
const createdQuestionIds = [];

/**
 * Gera um e-mail único para evitar colisões entre execuções dos testes.
 * @param {string} label - Identificador que facilita reconhecer o teste de origem.
 * @returns {string} E-mail único para uso temporário no banco de testes.
 */
function uniqueEmail(label) {
  return `aula05-${label}-${Date.now()}-${Math.random()}@example.com`;
}

/**
 * Cria um usuário pela API e registra o ID para a limpeza após o teste.
 * @param {Object} [overrides={}] - Campos que substituem os valores padrão da requisição.
 * @returns {Promise<Object>} Resposta recebida do endpoint `POST /users`.
 */
async function createUser(overrides = {}) {
  const response = await request(app)
    .post('/users')
    .send({
      nome: 'Prof. Teste',
      email: uniqueEmail('user'),
      ...overrides,
    });

  if (response.status === 201) {
    createdUserIds.push(response.body.data.id);
  }

  return response;
}

/**
 * Cria uma matéria pela API e registra o ID para a limpeza após o teste.
 * @param {Object} [overrides={}] - Campos que substituem os valores padrão da requisição.
 * @returns {Promise<Object>} Resposta recebida do endpoint `POST /subjects`.
 */
async function createSubject(overrides = {}) {
  let professorId = overrides.professorId;

  if (professorId === undefined) {
    const professor = await createUser();
    professorId = professor.body.data.id;
  }

  const response = await request(app)
    .post('/subjects')
    .send({
      nome: 'Matéria Teste',
      professorId,
      ...overrides,
      professorId,
    });

  if (response.status === 201) {
    createdSubjectIds.push(response.body.data.id);
  }

  return response;
}

/**
 * Cria uma questão pela API e registra o ID para a limpeza após o teste.
 * @param {Object} [overrides={}] - Campos que substituem os valores padrão da requisição.
 * @returns {Promise<Object>} Resposta recebida do endpoint `POST /questions`.
 */
async function createQuestion(overrides = {}) {
  let subjectId = overrides.subjectId;
  let authorId = overrides.authorId;

  if (subjectId === undefined || authorId === undefined) {
    const subject = await createSubject();
    subjectId = subjectId ?? subject.body.data.id;
    authorId = authorId ?? subject.body.data.professorId;
  }

  const response = await request(app)
    .post('/questions')
    .send({
      enunciado: 'Enunciado teste',
      dificuldade: 1,
      subjectId,
      authorId,
      ...overrides,
      subjectId,
      authorId,
    });

  if (response.status === 201) {
    createdQuestionIds.push(response.body.data.id);
  }

  return response;
}

// Remove primeiro as questões, depois as matérias e por último os usuários,
// respeitando as relações do banco (foreign keys).
afterEach(async () => {
  if (createdQuestionIds.length > 0) {
    await prisma.question.deleteMany({
      where: { id: { in: createdQuestionIds.splice(0) } },
    });
  }

  if (createdSubjectIds.length > 0) {
    await prisma.subject.deleteMany({
      where: { id: { in: createdSubjectIds.splice(0) } },
    });
  }

  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds.splice(0) } },
    });
  }
});

describe('Subject API', () => {
  it('lista matérias', async () => {
    const response = await request(app).get('/subjects');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it('cria uma matéria com professor válido', async () => {
    const professor = await createUser();
    const response = await createSubject({ professorId: professor.body.data.id });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.professorId).toBe(professor.body.data.id);
  });

  it('retorna 404 ao criar matéria com professor inexistente', async () => {
    const response = await createSubject({ professorId: 999999999 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('retorna 400 ao criar matéria com dados inválidos', async () => {
    const semNome = await request(app).post('/subjects').send({ professorId: 1 });
    const professorInvalido = await request(app)
      .post('/subjects')
      .send({ nome: 'Matéria', professorId: 'abc' });

    expect(semNome.status).toBe(400);
    expect(professorInvalido.status).toBe(400);
  });

  it('busca matéria e valida o ID', async () => {
    const created = await createSubject();
    const subjectId = created.body.data.id;

    const found = await request(app).get(`/subjects/${subjectId}`);
    const invalid = await request(app).get('/subjects/abc');
    const missing = await request(app).get('/subjects/999999999');

    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(subjectId);
    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('atualiza somente os campos enviados', async () => {
    const created = await createSubject({ nome: 'Nome original' });
    const subjectId = created.body.data.id;
    const originalProfessorId = created.body.data.professorId;

    const response = await request(app)
      .patch(`/subjects/${subjectId}`)
      .send({ nome: 'Nome atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.data.nome).toBe('Nome atualizado');
    expect(response.body.data.professorId).toBe(originalProfessorId);
  });

  it('rejeita PATCH vazio e professor inexistente', async () => {
    const created = await createSubject();
    const subjectId = created.body.data.id;

    const empty = await request(app).patch(`/subjects/${subjectId}`).send({});
    const professorInvalido = await request(app)
      .patch(`/subjects/${subjectId}`)
      .send({ professorId: 999999999 });

    expect(empty.status).toBe(400);
    expect(professorInvalido.status).toBe(404);
  });

  it('remove uma matéria sem questões', async () => {
    const created = await createSubject();
    const subjectId = created.body.data.id;
    createdSubjectIds.splice(createdSubjectIds.indexOf(subjectId), 1);

    const removed = await request(app).delete(`/subjects/${subjectId}`);
    const found = await request(app).get(`/subjects/${subjectId}`);

    expect(removed.status).toBe(200);
    expect(removed.body.data.id).toBe(subjectId);
    expect(found.status).toBe(404);
  });

  it('impede remover uma matéria com questão vinculada', async () => {
    const question = await createQuestion();

    const response = await request(app).delete(`/subjects/${question.body.data.subjectId}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});

describe('Question API', () => {
  it('lista questões', async () => {
    const response = await request(app).get('/questions');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it('cria uma questão com matéria e autor válidos', async () => {
    const response = await createQuestion();

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('subject');
    expect(response.body.data).toHaveProperty('author');
  });

  it('retorna 404 ao criar questão com matéria ou autor inexistente', async () => {
    const subject = await createSubject();

    const semMateria = await createQuestion({
      subjectId: 999999999,
      authorId: subject.body.data.professorId,
    });
    const semAutor = await createQuestion({
      subjectId: subject.body.data.id,
      authorId: 999999999,
    });

    expect(semMateria.status).toBe(404);
    expect(semAutor.status).toBe(404);
  });

  it('retorna 400 ao criar questão com dados inválidos', async () => {
    const subject = await createSubject();

    const semEnunciado = await request(app).post('/questions').send({
      dificuldade: 1,
      subjectId: subject.body.data.id,
      authorId: subject.body.data.professorId,
    });
    const dificuldadeInvalida = await createQuestion({
      dificuldade: 5,
      subjectId: subject.body.data.id,
      authorId: subject.body.data.professorId,
    });

    expect(semEnunciado.status).toBe(400);
    expect(dificuldadeInvalida.status).toBe(400);
  });

  it('busca questão e valida o ID', async () => {
    const created = await createQuestion();
    const questionId = created.body.data.id;

    const found = await request(app).get(`/questions/${questionId}`);
    const invalid = await request(app).get('/questions/abc');
    const missing = await request(app).get('/questions/999999999');

    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(questionId);
    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('atualiza somente os campos enviados', async () => {
    const created = await createQuestion({ enunciado: 'Enunciado original' });
    const questionId = created.body.data.id;
    const originalDificuldade = created.body.data.dificuldade;

    const response = await request(app)
      .patch(`/questions/${questionId}`)
      .send({ enunciado: 'Enunciado atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.data.enunciado).toBe('Enunciado atualizado');
    expect(response.body.data.dificuldade).toBe(originalDificuldade);
  });

  it('rejeita PATCH vazio e matéria/autor inexistente', async () => {
    const created = await createQuestion();
    const questionId = created.body.data.id;

    const empty = await request(app).patch(`/questions/${questionId}`).send({});
    const materiaInvalida = await request(app)
      .patch(`/questions/${questionId}`)
      .send({ subjectId: 999999999 });

    expect(empty.status).toBe(400);
    expect(materiaInvalida.status).toBe(404);
  });

  it('remove uma questão existente', async () => {
    const created = await createQuestion();
    const questionId = created.body.data.id;
    createdQuestionIds.splice(createdQuestionIds.indexOf(questionId), 1);

    const removed = await request(app).delete(`/questions/${questionId}`);
    const found = await request(app).get(`/questions/${questionId}`);

    expect(removed.status).toBe(200);
    expect(removed.body.data.id).toBe(questionId);
    expect(found.status).toBe(404);
  });
});