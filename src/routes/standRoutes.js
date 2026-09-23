const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const upload = require('../../middlewares/uploadImagem');
const { cacheRota } = require('../utils/cache')

const {
    criarStand,
    listarStands,
    buscarStandPorId,
    buscarStands,
    atualizarStand,
    deletarStand,
    deletarStandsPorEvento
} = require('../controllers/standController')


router.get('/buscar', cacheRota(600), buscarStands)

router.get('/', cacheRota(600), listarStands)
router.get('/:id', cacheRota(600), buscarStandPorId)

router.post('/', auth, upload.single('imagem'),  criarStand)
router.put('/:id', auth, upload.single('imagem'), atualizarStand)
router.delete('/', auth, deletarStandsPorEvento)   // DELETE /stands?eventoId=<id>
router.delete('/:id', auth, deletarStand)          // DELETE /stands/:id

module.exports = router
