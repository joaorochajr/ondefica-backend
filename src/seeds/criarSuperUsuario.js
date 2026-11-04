require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const Usuario = require('../models/Usuario')

async function main() {
    const email = (process.env.SUPER_EMAIL || '').trim().toLowerCase()
    const senha = process.env.SUPER_SENHA
    const nome = process.env.SUPER_NOME || 'Kamily'

    if (!email) {
        console.error('Defina SUPER_EMAIL no .env')
        process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URL)

    const existente = await Usuario.findOne({ email })

    if (existente) {
        existente.role = 'superuser'
        existente.status = 'ACTIVE'
        await existente.save()
        console.log(`✅ ${email} agora é superusuário (senha mantida)`)
    } else {
        if (!senha) {
            console.error('Usuário não existe. Defina SUPER_SENHA no .env para criá-lo')
            process.exit(1)
        }
        await Usuario.create({
            nome,
            email,
            senha: await bcrypt.hash(senha, 10),
            status: 'ACTIVE',
            role: 'superuser'
        })
        console.log(`✅ Superusuário ${email} criado`)
    }

    await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })