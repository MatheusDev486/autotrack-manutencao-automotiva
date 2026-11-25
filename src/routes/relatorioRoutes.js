const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

router.get('/join', relatorioController.consultaJoin);
router.get('/agregacao', relatorioController.consultaAgregacao);
router.get('/subquery', relatorioController.consultaSubquery);
router.get('/resumo-tipos', relatorioController.resumoTipos);
router.get('/resumo-status', relatorioController.resumoStatus);
router.get('/kpis', relatorioController.metricasGerais);

module.exports = router;
