const MAX_ENTRADAS = 500

const armazenamento = new Map() 
const emAndamento = new Map()  
function ler(chave) {
    const item = armazenamento.get(chave)
    if (!item) return null

    if (Date.now() > item.expiraEm) {
        armazenamento.delete(chave)
        return null
    }


    armazenamento.delete(chave)
    armazenamento.set(chave, item)
    return item.corpo
}

function gravar(chave, corpo, ttlSegundos) {
    if (armazenamento.has(chave)) armazenamento.delete(chave)

    if (armazenamento.size >= MAX_ENTRADAS) {
        const maisAntiga = armazenamento.keys().next().value
        armazenamento.delete(maisAntiga)
    }

    armazenamento.set(chave, { corpo, expiraEm: Date.now() + ttlSegundos * 1000 })
}

function limparTudo() {
    armazenamento.clear()
}

function enviar(res, corpo, status) {
    res.status(status).type('application/json').send(corpo)
}
function cacheRota(ttlSegundos = 30) {
    return async (req, res, next) => {
        if (req.method !== 'GET') return next()

        const chave = req.originalUrl

        const emCache = ler(chave)
        if (emCache) {
            res.set('X-Cache', 'HIT')
            return enviar(res, emCache, 200)
        }


        const pendente = emAndamento.get(chave)
        if (pendente) {
            const resultado = await pendente
            if (resultado) {
                res.set('X-Cache', 'SHARED')
                return enviar(res, resultado.corpo, resultado.status)
            }

        }

        let resolver
        const promessa = new Promise(r => { resolver = r })
        emAndamento.set(chave, promessa)

        const finalizar = (resultado) => {
            if (emAndamento.get(chave) === promessa) emAndamento.delete(chave)
            resolver(resultado)
        }

        const jsonOriginal = res.json.bind(res)
        res.json = (body) => {
            const corpo = JSON.stringify(body)

            if (res.statusCode === 200) {
                gravar(chave, corpo, ttlSegundos)
                finalizar({ corpo, status: 200 })
            } else {
                finalizar(null) 
            }

            res.set('X-Cache', 'MISS')
            return res.type('application/json').send(corpo)
        }

        res.on('close', () => finalizar(null))

        next()
    }
}

function invalidarAoEscrever(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next()
    }

    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) limparTudo()
    })

    next()
}

module.exports = { cacheRota, invalidarAoEscrever, limparTudo }
