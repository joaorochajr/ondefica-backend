const bcrypt = require('bcrypt')
const crypto = require('crypto')
const Usuario = require('../models/Usuario')
const { enviarEmailNovoUsuarioPendente, enviarEmailReset } = require('../services/emailService')
const jwt = require('jsonwebtoken')

function gerarTokenComExpiracao() {
    const token = crypto.randomBytes(32).toString('hex')

    const expira = new Date()
    expira.setHours(expira.getHours() + 1)

    return { token, expira }
}

// Escapa caracteres especiais de regex (o e-mail pode ter '.', '+', etc.)
function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Monta um filtro de e-mail que ignora maiúsculas/minúsculas e espaços,
// então funciona mesmo com cadastros antigos salvos com grafia diferente
// (sem precisar rodar nenhuma migração no banco).
function filtroEmail(email) {
    const emailLimpo = escaparRegex((email || '').trim())
    return { email: { $regex: `^${emailLimpo}$`, $options: 'i' } }
}


async function criarUsuario(req, res) {
    try {
        const { nome, senha } = req.body
        const email = (req.body.email || '').trim().toLowerCase()

        if (!nome || !email || !senha) {
            return res.status(400).json({
                message: 'Nome, email e senha são obrigatórios'
            })
        }

        const existente = await Usuario.findOne(filtroEmail(email))

        if (existente) {

            if (existente.status === 'ACTIVE') {
                return res.status(409).json({
                    message: 'Já existe um usuário com este email'
                })
            }

            if (existente.status === 'PENDING' || existente.status === 'REJECTED') {
                if (existente.status === 'PENDING') {
                    await reenviarEmailAprovacaoSeNecessario(existente)
                }
                return res.status(409).json({
                    message: 'Este email já possui um cadastro pendente de aprovação do administrador.'
                })
            }
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const token = crypto.randomBytes(32).toString('hex')
        const expira = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h

        const payload = {
            nome,
            email,
            senha: senhaHash,
            status: 'PENDING',

            token_ativacao: token,
            token_ativacao_expira: expira,
            ultimo_envio_ativacao: new Date()
        }


        await enviarEmailNovoUsuarioPendente({
            nome: payload.nome,
            email: payload.email,
            token
        })
        const novoUsuario = await Usuario.create(payload)

        return res.status(201).json({
            message: 'Cadastro criado e enviado para aprovação do administrador.'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao criar usuário'
        })
    }
}

async function ativarConta(req, res) {
    try {
        const { token } = req.params
        const { acao } = req.query // 'aprovar' | 'rejeitar'

        const user = await Usuario.findOne({ token_ativacao: token })
        if (!user) {
            return res.status(400).json({
                message: 'Token inválido'
            })
        }

        if (user.status !== 'PENDING') {
            return res.status(400).json({
                message: 'Usuário já foi processado'
            })
        }

        if (acao === 'aprovar') {
            user.status = 'ACTIVE'
        }

        if (acao === 'rejeitar') {
            user.status = 'REJECTED'
        }

        user.token_ativacao = null
        user.token_ativacao_expira = null

        await user.save()

        return res.json({
            message:
                acao === 'aprovar'
                    ? 'Usuário aprovado com sucesso'
                    : 'Usuário rejeitado com sucesso'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao processar ação'
        })
    }
}


async function login(req, res) {
    try {
        const { senha } = req.body
        const email = (req.body.email || '').trim().toLowerCase()
 
        if (!email || !senha) {
            return res.status(400).json({
                message: 'Email e senha são obrigatórios'
            })
        }
 
        const user = await Usuario.findOne(filtroEmail(email))
 
        if (!user) {
            return res.status(401).json({
                message: 'Usuário não encontrado'
            })
        }
 
        if (user.status !== 'ACTIVE') {
            if (user.status === 'PENDING') {
                await reenviarEmailAprovacaoSeNecessario(user)
            }
 
            return res.status(403).json({
                message: 'Conta não ativada. Pendente de aprovação pelo administrador.'
            })
        }
 
        const senhaOk = await bcrypt.compare(senha, user.senha)
 
        if (!senhaOk) {
            return res.status(401).json({
                message: 'Senha inválida'
            })
        }
 
        const token = jwt.sign(
            {
                id: user._id,
                nome: user.nome,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )
 
        return res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                nome: user.nome,
                email: user.email
            }
        })
 
    } catch (error) {
        console.error(error)
 
        return res.status(500).json({
            message: 'Erro no login'
        })
    }
}

async function esqueciSenha(req, res) {
    try {
        const email = (req.body.email || '').trim().toLowerCase()

        const user = await Usuario.findOne(filtroEmail(email))

        if (!user) {
            return res.status(400).json({
                message: 'Email não encontrado'
            })
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                message: 'Conta pendente de aprovação do administrador.'
            })
        }

        const { token, expira } = gerarTokenComExpiracao()

        try {
            await enviarEmailReset(email, token)
        } catch (err) {
            console.error(err)

            return res.status(502).json({
                message: 'Erro ao enviar email de recuperação'
            })
        }

        user.reset_token = token
        user.reset_expira = expira

        await user.save()

        return res.json({
            message: 'Email enviado com instruções de recuperação'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao processar solicitação'
        })
    }
}

async function resetSenha(req, res) {
    try {
        const { token } = req.params
        const { senha } = req.body

        const user = await Usuario.findOne({ reset_token: token })

        if (!user) {
            return res.status(400).json({
                message: 'Token inválido'
            })
        }

        if (new Date() > user.reset_expira) {
            return res.status(400).json({
                message: 'Token expirado'
            })
        }

        user.senha = await bcrypt.hash(senha, 10)
        user.reset_token = null
        user.reset_expira = null

        await user.save()

        return res.json({
            message: 'Senha alterada com sucesso'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao redefinir senha'
        })
    }
}

async function me(req, res) {
    try {
        return res.json({
            id: req.user.id,
            nome: req.user.nome,
            email: req.user.email
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao buscar usuário'
        })
    }
}

async function validarTokenReset(req, res) {
    try {
        const { token } = req.params

        const user = await Usuario.findOne({
            reset_token: token
        })

        if (!user) {
            return res.status(404).json({
                valido: false,
                motivo: 'invalido'
            })
        }

        if (new Date() > user.reset_expira) {
            return res.status(410).json({
                valido: false,
                motivo: 'expirado'
            })
        }

        return res.json({
            valido: true
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            valido: false,
            motivo: 'erro'
        })
    }
}


async function validarEmail(req, res) {
    try {
        const email = decodificarEmailDaUrl(req.params.email).trim().toLowerCase()

        if (!email) {
            return res.status(400).json({
                message: 'Email é obrigatório'
            })
        }

        const usuario = await Usuario.findOne(filtroEmail(email))

        if (!usuario) {
            return res.json({
                existe: false,
                ativo: false,
            })
        }

        return res.json({
            existe: true,
            ativo: usuario.status === 'ACTIVE',
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao validar email'
        })
    }
}

async function reenviarEmailAprovacaoSeNecessario(user) {
    const HORAS_REENVIO = Number(
        process.env.HORAS_REENVIO_EMAIL_APROVACAO || 24
    )
    const agora = new Date()

    const ultimoEnvio =
        user.ultimo_envio_ativacao || user.createdAt

    const passou24h =
        agora.getTime() - ultimoEnvio.getTime() >=
        1000 * 60 * 60 * HORAS_REENVIO

    if (!passou24h) {
        console.log(`Não enviou novo email de confirmação para user.nome`)
        return false
    }
    console.log(`Enviando novo email de confirmação para user.nome`)
    await enviarEmailNovoUsuarioPendente({
        nome: user.nome,
        email: user.email,
        token: user.token_ativacao
    })

    user.ultimo_envio_ativacao = agora
    await user.save()

    return true
}

module.exports = {
    criarUsuario,
    ativarConta,
    login,
    esqueciSenha,
    resetSenha,
    me,
    validarTokenReset,
    validarEmail,
}
