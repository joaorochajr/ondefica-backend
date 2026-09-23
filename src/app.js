const express = require('express');
const cors = require('cors');

const eventoRoutes = require('./routes/eventoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes')
const standRoutes = require('./routes/standRoutes')
const { invalidarAoEscrever } = require('./utils/cache')

const isProd = process.env.NODE_ENV === 'production'
const app = express();

app.set('trust proxy', 1)

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            process.env.FRONTEND_URL
        ]

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))

app.use(express.json());
app.use(invalidarAoEscrever)

app.use((req, res, next) => {
    console.log("ORIGIN:", req.headers.origin)
    console.log("COOKIE HEADER:", req.headers.cookie)
    console.log("HOST:", req.headers.host)
    next()
})

app.get('/', (req, res) => {
    res.send('API funcionando 🚀');
});

app.use('/eventos', eventoRoutes);
app.use('/usuarios', usuarioRoutes)
app.use('/stands', standRoutes)

module.exports = app;
