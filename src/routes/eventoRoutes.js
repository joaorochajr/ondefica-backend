const express = require('express');
const auth = require('../../middlewares/auth')
const { cacheRota } = require('../utils/cache')

const router = express.Router();

const {
    criarEvento,
    listarEventos,
    listarMeusEventos,
    buscarEventoPorId,
    atualizarEvento,
    deletarEvento,
} = require('../controllers/eventoController');

router.post('/', auth, criarEvento);

router.get('/', cacheRota(600), listarEventos);

router.get('/meus', auth, listarMeusEventos);

router.get('/:id', cacheRota(600), buscarEventoPorId);

router.put('/:id', auth, atualizarEvento);

router.delete('/:id', auth, deletarEvento);

module.exports = router;
