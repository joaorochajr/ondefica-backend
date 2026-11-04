const mongoose = require('mongoose')
 
let conexao = null
 
// Reaproveita a conexão entre invocações (serverless) e nunca derruba o processo
function connectMongo() {
    if (!conexao) {
        conexao = mongoose.connect(process.env.MONGO_URL)
            .then(() => console.log('MongoDB conectado'))
            .catch((error) => {
                conexao = null
                console.error('Erro ao conectar MongoDB:', error)
            })
    }
    return conexao
}
 
module.exports = connectMongo
 
