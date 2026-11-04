const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const { requireSuperuser } = require('../../middlewares/superuser')
const { listar, atualizar, apagar } = require('../controllers/adminUsuarioController')

router.use(auth, requireSuperuser)

router.get('/', listar)
router.put('/:id', atualizar)
router.delete('/:id', apagar)

module.exports = router