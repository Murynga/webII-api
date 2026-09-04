// src/controllers/questionController.js
import prisma from '../config/database.js';

/**
 * Controller de Questões
 * Responsável por gerenciar as operações CRUD de questões
 */

// Mapeamento de Dificuldade
const mapaDificuldade = {
  1: 'FACIL',
  2: 'MEDIA',
  3: 'DIFICIL',
};

// CREATE - Criar nova questão
export const create = async (req, res) => {
  try {
    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body;

    const dificuldadeEnum = mapaDificuldade[dificuldade];

    if (!enunciado || !dificuldade || !subjectId || !authorId) {
      return res.status(400).json({
        success: false,
        message:
          'Enunciado, dificuldade e IDs da matéria e do professor autor são obrigatórios',
      });
    }
    if (dificuldade < 1 || dificuldade > 3) {
      return res.status(400).json({
        success: false,
        message: 'A dificuldade deve ser 1, 2 ou 3',
      });
    }

    // Cria a questão no banco
    const novaQuestao = await prisma.question.create({
      data: {
        enunciado,
        dificuldade: dificuldadeEnum,
        respostaCorreta,
        subjectId,
        authorId,
        ativa: ativa || true, //Default: true
      },
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        respostaCorreta: true,
        subject: {
          select: {
            id: true,
            nome: true,
            ativa: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        ativa: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Questão criada com sucesso',
      data: novaQuestao,
    });
  } catch (error) {
    console.error('Erro ao criar questão:', error);

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        message: 'ID do autor ou da matéria inexistente!',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar questão',
    });
  }
};

// READ - Listar todas as questões
export const getAll = async (req, res) => {
  try {
    const questoes = await prisma.question.findMany({
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        respostaCorreta: true,
        ativa: true,
        subject: {
          select: {
            id: true,
            nome: true,
            ativa: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Mais recentes primeiro
      },
    });

    res.status(200).json({
      success: true,
      data: questoes,
      total: questoes.length,
    });
  } catch (error) {
    console.error('Erro ao listar questões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar questões',
    });
  }
};

// READ - Buscar questão por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Converte string para número
    const questionId = Number(id);

    // Validação básica
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número',
      });
    }

    const questao = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        respostaCorreta: true,
        ativa: true,
        subject: {
          select: {
            id: true,
            nome: true,
            ativa: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        createdAt: true,
      },
    });

    // Questão não encontrada
    if (!questao) {
      return res.status(404).json({
        success: false,
        message: `Questão com ID ${questionId} não encontrado`,
      });
    }

    res.status(200).json({
      success: true,
      data: questao,
    });
  } catch (error) {
    console.error('Erro ao buscar questão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar questão',
    });
  }
};
