const Stand = require('../models/Stand')
const Evento = require('../models/Evento')

// POST /stands
async function criarStand(req, res) {
    try {
        const {
            nome,
            descricao,
            data_inicio,
            data_fim,
            latitude,
            longitude,
            cor_icone,
            eventoId
        } = req.body

        if (!nome || !data_inicio || !data_fim || !latitude || !longitude || !eventoId) {
            return res.status(400).json({
                message: 'Campos obrigatórios: nome, data_inicio, data_fim, latitude, longitude, eventoId'
            })
        }

        let urlImagem = req.body.imagem || ""; 

        if (req.file) {
            urlImagem = req.file.secure_url; 
        }

        const evento = await Evento.findById(eventoId)
        if (!evento) {
            return res.status(404).json({ message: 'Evento não encontrado' })
        }

        const stand = await Stand.create({
            nome,
            descricao,
            imagem: urlImagem,
            data_inicio,
            data_fim,
            latitude,
            longitude,
            cor_icone,
            eventoId
        })

        return res.status(201).json({
            message: 'Stand criado com sucesso',
            id: stand._id
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao criar stand' })
    }
}

// GET /stands
// Suporta filtro opcional por eventoId: GET /stands?eventoId=<id>
async function listarStands(req, res) {
    try {
        const filtro = {}

        if (req.query.eventoId) {
            filtro.eventoId = req.query.eventoId
        }

        const stands = await Stand.find(filtro).sort({ createdAt: -1 })

        return res.json(stands)

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao listar stands' })
    }
}

// GET /stands/:id
async function buscarStandPorId(req, res) {
    try {
        const { id } = req.params

        const stand = await Stand.findById(id)
            .populate('eventoId', 'descricao data_inicio data_fim')

        if (!stand) {
            return res.status(404).json({ message: 'Stand não encontrado' })
        }

        return res.json(stand)

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao buscar stand' })
    }
}

// GET /stands/buscar?q=termo&eventoId=<id>
// Busca por nome e/ou descrição (texto livre), com filtro opcional por evento
async function buscarStands(req, res) {
    try {
        const { q, eventoId } = req.query

        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Informe o parâmetro de busca: ?q=termo' })
        }

        const filtro = {
            $text: { $search: q.trim() }
        }

        if (eventoId) {
            filtro.eventoId = eventoId
        }

        const stands = await Stand.find(
            filtro,
            { score: { $meta: 'textScore' } }   // campo de relevância
        )
            .populate('eventoId', 'descricao data_inicio data_fim')
            .sort({ score: { $meta: 'textScore' } }) // mais relevantes primeiro

        return res.json(stands)

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao buscar stands' })
    }
}

// PUT /stands/:id
async function atualizarStand(req, res) {
    try {
        const { id } = req.params
        const {
            nome,
            descricao,
            data_inicio,
            data_fim,
            latitude,
            longitude,
            cor_icone,
            eventoId,
            removerImagem // 🚀 Captura o sinal vindo do formulário React
        } = req.body

        const stand = await Stand.findById(id)
        if (!stand) {
            return res.status(404).json({ message: 'Stand não encontrado' })
        }

        if (eventoId && eventoId.toString() !== stand.eventoId.toString()) {
            const evento = await Evento.findById(eventoId)
            if (!evento) {
                return res.status(404).json({ message: 'Evento não encontrado' })
            }
        }

        // LÓGICA DE ATUALIZAÇÃO DA IMAGEM:
        let urlImagem = stand.imagem; // Por padrão, mantém o que já estava

        // 1. Se marcou para remover nas opções, esvazia o campo no banco de dados
        if (removerImagem === 'true') {
            urlImagem = ""; 
        }

        // 2. Se enviou uma foto nova, ela entra no lugar de tudo com prioridade máxima
        if (req.file) {
            urlImagem = req.file.secure_url; 
        }

        await Stand.findByIdAndUpdate(id, {
            nome,
            descricao,
            imagem: urlImagem, // 🚀 Salva o resultado final calculado acima
            data_inicio,
            data_fim,
            latitude,
            longitude,
            cor_icone,
            eventoId
        }, { new: true, runValidators: true })

        return res.json({ message: 'Stand updated successfully' })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao atualizar stand' })
    }
}

// DELETE /stands/:id
async function deletarStand(req, res) {
    try {
        const { id } = req.params

        const stand = await Stand.findByIdAndDelete(id)
        if (!stand) {
            return res.status(404).json({ message: 'Stand não encontrado' })
        }

        return res.json({ message: 'Stand deletado com sucesso' })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao deletar stand' })
    }
}

// DELETE /stands?eventoId=<id>
// Remove todos os stands de um evento (útil ao deletar o evento)
async function deletarStandsPorEvento(req, res) {
    try {
        const { eventoId } = req.query

        if (!eventoId) {
            return res.status(400).json({ message: 'Informe o eventoId como query param' })
        }

        const resultado = await Stand.deleteMany({ eventoId })

        return res.json({
            message: `${resultado.deletedCount} stand(s) removido(s)`,
            deletedCount: resultado.deletedCount
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao deletar stands do evento' })
    }
}

module.exports = {
    criarStand,
    listarStands,
    buscarStandPorId,
    buscarStands,
    atualizarStand,
    deletarStand,
    deletarStandsPorEvento
}
