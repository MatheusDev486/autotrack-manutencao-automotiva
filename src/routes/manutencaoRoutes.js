const express = require('express');
const router = express.Router();
const manutencaoController = require('../controllers/manutencaoController');

router.get('/', manutencaoController.listar);
router.get('/:id', manutencaoController.buscarPorId);
router.post('/', manutencaoController.criar);
router.put('/:id', manutencaoController.atualizar);
router.delete('/:id', manutencaoController.excluir);

module.exports = router;
