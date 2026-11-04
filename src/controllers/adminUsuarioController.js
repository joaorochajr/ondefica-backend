const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const Usuario = require('../models/Usuario')
const Evento = require('../models/Evento')

const STATUS_VALIDOS = ['PENDING', 'ACTIVE', 'REJECTED']
const ROLES_VALIDOS = ['user', 'superuser']

async function listar(req, res) {
    try {
                const filtro = { _id: { $ne: req.user.id } }
        if (req.query.status && STATUS_VALIDOS.includes(req.query.status)) {
            filtro.status = req.query.status
        }

        const usuarios = await Usuario.find(filtro)
            .select('nome email role status')
            .sort({ nome: 1 })
            .lean()

        return res.json(usuarios)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao listar usuários' })
    }
}

async function atualizar(req, res) {
    try {
        const { id } = req.params
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID inválido' })
        }

        const { nome, email, role, status, senha } = req.body

        const user = await Usuario.findById(id)
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' })

        const souEu = String(user._id) === req.user.id

        if (nome !== undefined) {
            const nomeLimpo = String(nome).trim()
            if (!nomeLimpo) return res.status(400).json({ message: 'Nome não pode ficar vazio' })
            user.nome = nomeLimpo
        }

        if (email !== undefined) {
            const emailLimpo = String(email).trim().toLowerCase()
            if (!emailLimpo) return res.status(400).json({ message: 'Email não pode ficar vazio' })
            user.email = emailLimpo
        }

        if (role !== undefined) {
            if (!ROLES_VALIDOS.includes(role)) {
                return res.status(400).json({ message: 'Papel inválido' })
            }
            if (souEu && role !== 'superuser') {
                return res.status(400).json({ message: 'Você não pode remover seu próprio acesso de superusuário' })
            }
            user.role = role
        }

        if (status !== undefined) {
            if (!STATUS_VALIDOS.includes(status)) {
                return res.status(400).json({ message: 'Status inválido' })
            }
            if (souEu && status !== 'ACTIVE') {
                return res.status(400).json({ message: 'Você não pode desativar a própria conta' })
            }
            user.status = status
            if (status !== 'PENDING') {
                user.token_ativacao = null
                user.token_ativacao_expira = null
            }
        }

        if (senha) {
            user.senha = await bcrypt.hash(String(senha), 10)
        }

        try {
            await user.save()
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ message: 'Já existe um usuário com este email' })
            }
            throw err
        }

        return res.json({
            id: user._id,
            nome: user.nome,
            email: user.email,
            role: user.role,
            status: user.status
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao atualizar usuário' })
    }
}

async function apagar(req, res) {
    try {
        const { id } = req.params
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID inválido' })
        }

        if (id === req.user.id) {
            return res.status(400).json({ message: 'Você não pode apagar a própria conta' })
        }

        const user = await Usuario.findByIdAndDelete(id)
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' })

        // Tira o usuário apagado da lista de administradores dos eventos
        await Evento.updateMany(
            { administradores: user._id },
            { $pull: { administradores: user._id } }
        )

        return res.json({ message: 'Usuário removido' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao apagar usuário' })
    }
}

module.exports = { listar, atualizar, apagar }