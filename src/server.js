require('dotenv').config()

const app = require('./app')
const connectMongo = require('./config/mongo')

connectMongo()

// Na Vercel o app deve ser exportado como handler; localmente sobe com listen
if (process.env.VERCEL) {
    module.exports = app
} else {
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`)
    })
}
