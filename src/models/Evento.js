const mongoose = require('mongoose')

const EventoSchema = new mongoose.Schema({
    descricao: { 
        type: String, 
        required: true 
    },
        nome_local: {
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
        required: true 
    },
    longitude: { 
        type: Number, 
        required: true 
    },
    // Este array substitui a antiga tabela SQL "Evento_Administrador"
    administradores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario' // Faz a ligação com o model de Usuário
    }]
}, {
    // Adiciona automaticamente os campos createdAt e updatedAt
    timestamps: true 
})

module.exports = mongoose.model('Evento', EventoSchema)
