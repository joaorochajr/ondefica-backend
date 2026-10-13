const mongoose = require('mongoose')

const EventoSchema = new mongoose.Schema({
    descricao: {
        type: String,
        required: true,
        trim: true
    },
    nome_local: {
        type: String,
        trim: true,
        default: ''
    },
    nome_endereco: {
        type: String,
        trim: true,
        default: ''
    },
    data_inicio: {
        type: Date,
        required: true
    },
    data_fim: {
        type: Date,
        required: true
    },
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    administradores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }]
}, {
    timestamps: true
})

module.exports = mongoose.model('Evento', EventoSchema)
