import prisma from '../config/database.js';

const mapaDificuldadeParaEnum = { 1: 'FACIL', 2: 'MEDIA', 3: 'DIFICIL' };
const mapaDificuldadeParaNumero = { FACIL: 1, MEDIA: 2, DIFICIL: 3 };

const publicQuestionSelect = {
  id: true,
  enunciado: true,
  dificuldade: true,
  respostaCorreta: true,
  ativa: true,
  subjectId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: { id: true, nome: true, ativa: true },
  },
  author: {
    select: { id: true, nome: true, email: true, foto: true },
  },
};

/**
 * Converte a questão retornada pelo Prisma trocando o enum de dificuldade pelo número correspondente.
 * @param {Object|null} questao - Registro retornado pelo Prisma.
 * @returns {Object|null} Questão formatada para a resposta pública, ou `null`.
 */
function toPublicQuestion(questao) {
  if (!questao) return questao;
  return { ...questao, dificuldade: mapaDificuldadeParaNumero[questao.dificuldade] };
}

/**
 * Busca todas as questões no formato público, da mais recente para a mais antiga.
 * @returns {Promise<Object[]>} Lista de questões.
 */
export const getAllQuestions = async () => {
  const questoes = await prisma.question.findMany({
    select: publicQuestionSelect,
    orderBy: { createdAt: 'desc' },
  });

  return questoes.map(toPublicQuestion);
};

/**
 * Busca uma questão pelo identificador único.
 * @param {number} questionId - ID da questão.
 * @returns {Promise<Object|null>} Questão encontrada ou `null` quando ela não existe.
 */
export const getQuestionById = async questionId => {
  const questao = await prisma.question.findUnique({
    where: { id: questionId },
    select: publicQuestionSelect,
  });

  return toPublicQuestion(questao);
};

/**
 * Cria uma questão depois de verificar se a matéria e o autor informados existem.
 * @param {{ enunciado: string, dificuldade: number, respostaCorreta?: string|null, subjectId: number, authorId: number, ativa?: boolean }} questionData - Dados recebidos pelo controller.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da criação ou o motivo da falha.
 */
export const createQuestion = async questionData => {
  const [subject, author] = await Promise.all([
    prisma.subject.findUnique({ where: { id: questionData.subjectId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: questionData.authorId }, select: { id: true } }),
  ]);

  if (!subject) return { ok: false, reason: 'SUBJECT_NOT_FOUND' };
  if (!author) return { ok: false, reason: 'AUTHOR_NOT_FOUND' };

  const questao = await prisma.question.create({
    data: {
      enunciado: questionData.enunciado.trim(),
      dificuldade: mapaDificuldadeParaEnum[questionData.dificuldade],
      respostaCorreta: questionData.respostaCorreta ?? null,
      subjectId: questionData.subjectId,
      authorId: questionData.authorId,
      ativa: questionData.ativa ?? true,
    },
    select: publicQuestionSelect,
  });

  return { ok: true, data: toPublicQuestion(questao) };
};

/**
 * Atualiza somente os campos enviados para uma questão existente.
 * @param {number} questionId - ID da questão a atualizar.
 * @param {Object} questionData - Campos permitidos no PATCH.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da atualização ou o motivo da falha.
 */
export const updateQuestion = async (questionId, questionData) => {
  const questaoExistente = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!questaoExistente) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const data = {};

  if (Object.hasOwn(questionData, 'enunciado')) {
    data.enunciado = questionData.enunciado.trim();
  }

  if (Object.hasOwn(questionData, 'dificuldade')) {
    data.dificuldade = mapaDificuldadeParaEnum[questionData.dificuldade];
  }

  if (Object.hasOwn(questionData, 'respostaCorreta')) {
    data.respostaCorreta = questionData.respostaCorreta;
  }

  if (Object.hasOwn(questionData, 'ativa')) {
    data.ativa = questionData.ativa;
  }

  if (Object.hasOwn(questionData, 'subjectId')) {
    const subject = await prisma.subject.findUnique({
      where: { id: questionData.subjectId },
      select: { id: true },
    });
    if (!subject) return { ok: false, reason: 'SUBJECT_NOT_FOUND' };
    data.subjectId = questionData.subjectId;
  }

  if (Object.hasOwn(questionData, 'authorId')) {
    const author = await prisma.user.findUnique({
      where: { id: questionData.authorId },
      select: { id: true },
    });
    if (!author) return { ok: false, reason: 'AUTHOR_NOT_FOUND' };
    data.authorId = questionData.authorId;
  }

  const questao = await prisma.question.update({
    where: { id: questionId },
    data,
    select: publicQuestionSelect,
  });

  return { ok: true, data: toPublicQuestion(questao) };
};

/**
 * Remove uma questão existente.
 * @param {number} questionId - ID da questão a remover.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Questão removida ou o motivo que impede a remoção.
 */
export const deleteQuestion = async questionId => {
  const questaoExistente = await prisma.question.findUnique({
    where: { id: questionId },
    select: publicQuestionSelect,
  });

  if (!questaoExistente) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const questao = await prisma.question.delete({
    where: { id: questionId },
    select: publicQuestionSelect,
  });

  return { ok: true, data: toPublicQuestion(questao) };
};