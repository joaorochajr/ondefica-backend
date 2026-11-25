const express = require('express');
const cors = require('cors');

const adminUsuarioRoutes = require('./routes/adminUsuarioRoutes')
const adminEventoRoutes = require('./routes/adminEventoRoutes')
const eventoRoutes = require('./routes/eventoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes')
const standRoutes = require('./routes/standRoutes')
const { invalidarAoEscrever } = require('./utils/cache')
const connectMongo = require('./config/mongo')
const mongoose = require('mongoose')

const isProd = process.env.NODE_ENV === 'production'
const app = express();

app.set('trust proxy', 1)

const allowedOrigins = [
    'http://localhost:5173',
    'https://ondefica.akare.com.br',
    ...(process.env.FRONTEND_URL || '').split(',')
].map(o => o.trim().replace(/\/$/, '')).filter(Boolean)

const corsOptions = {
    origin: function (origin, callback) {
        // sem origin = Postman/curl/server-to-server
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            // não lançar Error: false apenas omite os headers CORS
            callback(null, false)
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

app.use(express.json());
app.use(invalidarAoEscrever)

app.use((req, res, next) => {
    console.log("ORIGIN:", req.headers.origin)
    console.log("COOKIE HEADER:", req.headers.cookie)
    console.log("HOST:", req.headers.host)
    next()
})

// Garante o banco conectado antes de qualquer rota (evita o findOne ficar "pendurado" e virar 500)
app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next()
    await connectMongo()
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Banco de dados indisponível' })
    }
    next()
})

app.get('/', (req, res) => {
    res.send('API funcionando 🚀');
});

app.use('/eventos', eventoRoutes);
app.use('/usuarios', usuarioRoutes)
app.use('/stands', standRoutes)
app.use('/admin/eventos', adminEventoRoutes)
app.use('/admin/usuarios', adminUsuarioRoutes)

module.exports = app;
