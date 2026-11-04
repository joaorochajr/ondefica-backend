const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const { requireSuperuser } = require('../../middlewares/superuser')
const { listar } = require('../controllers/adminEventoController')

router.use(auth, requireSuperuser)
router.get('/', listar)

module.exports = router