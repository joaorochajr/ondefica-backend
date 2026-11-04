const Evento = require('../models/Evento')

// Eventos dos quais a superusuária NÃO é administradora
async function listar(req, res) {
    try {
        const eventos = await Evento.find({ administradores: { $ne: req.user.id } })
            .populate({ path: 'administradores', model: 'Usuario', select: 'nome email' })
            .sort({ data_inicio: -1 })
            .lean()

        return res.json(eventos)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao listar eventos' })
    }
}

module.exports = { listar }