// src/controllers/subjectController.js
import prisma from '../config/database.js';

/**
 * Controller de Matérias
 * Responsável por gerenciar as operações CRUD de matérias
 */

// CREATE - Criar nova matéria
export const create = async (req, res) => {
  try {
    const { nome, ativa, professorId } = req.body;

    if (!nome || !professorId) {
      return res.status(400).json({
        success: false,
        message: 'Nome e Identificador do professor são obrigatórios',
      });
    }

    // Cria a matéria no banco
    const novaMateria = await prisma.subject.create({
      data: {
        nome,
        ativa: ativa || true, //Default: true
        professorId,
      },
      select: {
        id: true,
        nome: true,
        ativa: true,
        professor: {
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

    res.status(201).json({
      success: true,
      message: 'Matéria criada com sucesso',
      data: novaMateria,
    });
  } catch (error) {
    console.error('Erro ao criar matéria:', error);

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        message: 'ID do professor inexistente',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar matéria',
    });
  }
};

// READ - Listar todas as matérias
export const getAll = async (req, res) => {
  try {
    const materias = await prisma.subject.findMany({
      select: {
        id: true,
        nome: true,
        ativa: true,
        professor: {
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
      data: materias,
      total: materias.length,
    });
  } catch (error) {
    console.error('Erro ao listar matérias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar matérias',
    });
  }
};

// READ - Buscar matéria por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Converte string para número
    const subjectId = Number(id);

    // Validação básica
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número',
      });
    }

    const materia = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        nome: true,
        ativa: true,
        professor: {
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

    // Matéria não encontrada
    if (!materia) {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID '${subjectId}' não encontrado`,
      });
    }

    res.status(200).json({
      success: true,
      data: materia,
    });
  } catch (error) {
    console.error('Erro ao buscar matéria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar matéria',
    });
  }
};
