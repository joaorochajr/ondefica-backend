const Usuario = require('../src/models/Usuario')

async function ehSuperuser(userId) {
    const user = await Usuario.findById(userId).select('role status')
    return Boolean(user && user.status === 'ACTIVE' && user.role === 'superuser')
}

// Não bloqueia: só marca req.ehSuperuser (usado nas rotas de evento)
async function marcarSuperuser(req, res, next) {
    try {
        req.ehSuperuser = req.user ? await ehSuperuser(req.user.id) : false
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erro ao verificar permissão' })
    }
}

// Bloqueia quem não é superusuário (usado nas rotas de administração)
async function requireSuperuser(req, res, next) {
    try {
        if (!req.user) return res.status(401).json({ message: 'Não autenticado' })
        if (!(await ehSuperuser(req.user.id))) {
            return res.status(403).json({ message: 'Acesso restrito ao superusuário' })
        }
        req.ehSuperuser = true
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erro ao verificar permissão' })
    }
}

module.exports = { marcarSuperuser, requireSuperuser }