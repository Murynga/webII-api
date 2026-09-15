import * as questionService from '../services/questionService.js';

const allowedPatchFields = [
  'enunciado',
  'dificuldade',
  'respostaCorreta',
  'subjectId',
  'authorId',
  'ativa',
];

/**
 * Converte um valor de rota em um ID inteiro positivo, sem aceitar valores parciais.
 * @param {unknown} value - Valor recebido em `req.params.id`.
 * @returns {number|null} ID válido ou `null` quando o valor é inválido.
 */
function toPositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * Verifica se o corpo de um PATCH contém pelo menos um campo que pode ser atualizado.
 * @param {Object} body - Corpo recebido na requisição.
 * @returns {boolean} `true` quando há ao menos um campo permitido.
 */
function hasAllowedPatchField(body) {
  return allowedPatchFields.some(field => Object.hasOwn(body, field));
}

/**
 * Identifica valores inválidos nos campos que o usuário pode enviar.
 * @param {Object} body - Dados a validar.
 * @returns {boolean} `true` quando algum campo presente possui formato inválido.
 */
function hasInvalidQuestionFields({
  enunciado,
  dificuldade,
  respostaCorreta,
  subjectId,
  authorId,
  ativa,
}) {
  return (
    (enunciado !== undefined && (typeof enunciado !== 'string' || !enunciado.trim())) ||
    (dificuldade !== undefined &&
      (!Number.isInteger(dificuldade) || dificuldade < 1 || dificuldade > 3)) ||
    (respostaCorreta !== undefined &&
      respostaCorreta !== null &&
      typeof respostaCorreta !== 'string') ||
    (subjectId !== undefined && !toPositiveInt(subjectId)) ||
    (authorId !== undefined && !toPositiveInt(authorId)) ||
    (ativa !== undefined && typeof ativa !== 'boolean')
  );
}

/**
 * Valida a criação de uma questão, delega a persistência ao service e monta a resposta HTTP.
 * @param {Object} req - Requisição Express com os dados da questão.
 * @param {Object} res - Resposta Express usada para enviar o status e o JSON.
 * @returns {Promise<Object>} Resposta HTTP de criação, validação ou erro.
 */
export const create = async (req, res) => {
  try {
    const { enunciado, dificuldade, respostaCorreta, subjectId, authorId, ativa } = req.body;
    const subjectIdInt = toPositiveInt(subjectId);
    const authorIdInt = toPositiveInt(authorId);

    if (
      typeof enunciado !== 'string' ||
      !enunciado.trim() ||
      !subjectIdInt ||
      !authorIdInt ||
      hasInvalidQuestionFields({ enunciado, dificuldade, respostaCorreta, subjectId, authorId, ativa })
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Enunciado, dificuldade (1-3) e IDs válidos de matéria e autor são obrigatórios',
      });
    }

    const result = await questionService.createQuestion({
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId: subjectIdInt,
      authorId: authorIdInt,
      ativa,
    });

    if (!result.ok && result.reason === 'SUBJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Matéria informada não existe' });
    }

    if (!result.ok && result.reason === 'AUTHOR_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Autor informado não existe' });
    }

    return res.status(201).json({
      success: true,
      message: 'Questão criada com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao criar questão:', error);
    return res.status(500).json({ success: false, message: 'Erro ao criar questão' });
  }
};

/**
 * Lista as questões retornadas pelo service e informa o total encontrado.
 * @param {Object} _req - Requisição Express, não utilizada nesta operação.
 * @param {Object} res - Resposta Express usada para enviar a listagem.
 * @returns {Promise<Object>} Resposta HTTP com a lista ou um erro interno.
 */
export const getAll = async (_req, res) => {
  try {
    const questoes = await questionService.getAllQuestions();

    return res.status(200).json({
      success: true,
      data: questoes,
      total: questoes.length,
    });
  } catch (error) {
    console.error('Erro ao listar questões:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar questões' });
  }
};

/**
 * Valida o ID da rota e devolve uma questão específica quando ela existe.
 * @param {Object} req - Requisição Express que contém `params.id`.
 * @param {Object} res - Resposta Express usada para enviar o resultado.
 * @returns {Promise<Object>} Resposta HTTP com a questão, erro de validação ou ausência.
 */
export const getById = async (req, res) => {
  try {
    const questionId = toPositiveInt(req.params.id);

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número inteiro positivo',
      });
    }

    const questao = await questionService.getQuestionById(questionId);

    if (!questao) {
      return res.status(404).json({
        success: false,
        message: `Questão com ID ${questionId} não encontrada`,
      });
    }

    return res.status(200).json({ success: true, data: questao });
  } catch (error) {
    console.error('Erro ao buscar questão:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar questão' });
  }
};

/**
 * Valida um PATCH parcial e solicita ao service a atualização da questão.
 * @param {Object} req - Requisição Express com o ID e os campos a atualizar.
 * @param {Object} res - Resposta Express usada para enviar o resultado.
 * @returns {Promise<Object>} Resposta HTTP de atualização, validação ou ausência.
 */
export const update = async (req, res) => {
  try {
    const questionId = toPositiveInt(req.params.id);

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número inteiro positivo',
      });
    }

    if (!hasAllowedPatchField(req.body) || hasInvalidQuestionFields(req.body)) {
      return res.status(400).json({
        success: false,
        message:
          'Envie ao menos um campo válido: enunciado, dificuldade, respostaCorreta, subjectId, authorId ou ativa',
      });
    }

    const patchData = { ...req.body };
    if (Object.hasOwn(patchData, 'subjectId')) {
      patchData.subjectId = toPositiveInt(patchData.subjectId);
    }
    if (Object.hasOwn(patchData, 'authorId')) {
      patchData.authorId = toPositiveInt(patchData.authorId);
    }

    const result = await questionService.updateQuestion(questionId, patchData);

    if (!result.ok && result.reason === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: `Questão com ID ${questionId} não encontrada`,
      });
    }

    if (!result.ok && result.reason === 'SUBJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Matéria informada não existe' });
    }

    if (!result.ok && result.reason === 'AUTHOR_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Autor informado não existe' });
    }

    return res.status(200).json({
      success: true,
      message: 'Questão atualizada com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao atualizar questão:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar questão' });
  }
};

/**
 * Remove uma questão quando o ID é válido.
 * @param {Object} req - Requisição Express que contém `params.id`.
 * @param {Object} res - Resposta Express usada para enviar o resultado.
 * @returns {Promise<Object>} Resposta HTTP de remoção, validação ou ausência.
 */
export const remove = async (req, res) => {
  try {
    const questionId = toPositiveInt(req.params.id);

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número inteiro positivo',
      });
    }

    const result = await questionService.deleteQuestion(questionId);

    if (!result.ok && result.reason === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: `Questão com ID ${questionId} não encontrada`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Questão removida com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao remover questão:', error);
    return res.status(500).json({ success: false, message: 'Erro ao remover questão' });
  }
};