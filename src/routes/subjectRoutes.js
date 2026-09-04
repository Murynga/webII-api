// src/routes/subjectRoutes.js
import express from 'express';
import * as subjectController from '../controllers/subjectController.js';

const router = express.Router();

/**
 * Rotas de Matérias
 * Base URL: /subjects
 */

// CREATE - Criar nova matéria
router.post('/', subjectController.create);

// READ - Listar todos os usuários
router.get('/', subjectController.getAll);

// READ - Buscar usuário por ID
router.get('/:id', subjectController.getById);

export default router;
