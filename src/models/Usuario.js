const mongoose = require('mongoose')

const UsuarioSchema = new mongoose.Schema({
    nome: String,
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    senha: String,

    token_ativacao: String,
    token_ativacao_expira: Date,
    reset_token: String,
    reset_expira: Date,
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'REJECTED'],
        default: null
    },
    ultimo_envio_ativacao: Date
})

module.exports = mongoose.model('Usuario', UsuarioSchema)
