import { marcarSuperuser } from '../../middlewares/superuser';

const express = require('express');
const auth = require('../../middlewares/auth')
const { cacheRota } = require('../utils/cache')
const auth = require('../../middlewares/auth')
const { marcarSuperuser } = require('../../middlewares/superuser')

const router = express.Router();

const {
    criarEvento,
    listarEventos,
    listarMeusEventos,
    buscarEventoPorId,
    atualizarEvento,
    deletarEvento,
    importarStandsParaEvento,
} = require('../controllers/eventoController');

router.post('/', auth, criarEvento);

router.get('/', cacheRota(600), listarEventos);

router.get('/meus', auth, listarMeusEventos);

router.get('/:id', cacheRota(600), buscarEventoPorId);

router.put('/:id', auth,marcarSuperuser, atualizarEvento);

router.post('/:id/importar-stands', auth, importarStandsParaEvento);

router.post('/:id/importar-stands', auth, marcarSuperuser, importarStandsParaEvento);

router.delete('/:id', auth, marcarSuperuser, deletarEvento);

module.exports = router;