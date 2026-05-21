import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import { createDraft } from './organizations/limits'
import { prisma as libPrisma } from './lib/prisma'

const log = (msg: string) => fs.appendFileSync('debug_output.txt', msg + '\n')

const prisma = new PrismaClient()

async function main() {
    log('Testing draft creation...')
    try {
        // 1. Get/Create User
        let user = await prisma.user.findFirst()
        if (!user) {
            log('No user found, creating dummy user...')
            user = await prisma.user.create({
                data: {
                    externalId: 'debug_' + Date.now(),
                    email: 'debug_' + Date.now() + '@example.com'
                }
            })
        }
        log('User: ' + user.id)

        // 2. Get/Create Org
        let org = await prisma.organization.findFirst({ where: { ownerUserId: user.id } })
        if (!org) {
            log('No org found, creating...')
            org = await prisma.organization.create({
                data: {
                    name: 'Debug Org',
                    slug: 'debug-org-' + Date.now(),
                    ownerUserId: user.id
                }
            })
        }
        log('Org: ' + org.id)

        // 3. Get/Create Template
        log('Checking template...')
        let template = await prisma.ndaTemplate.findFirst({
            where: { organizationId: org.id }
        })
        if (!template) {
            log('No template found, creating...')
            template = await prisma.ndaTemplate.create({
                data: {
                    title: 'Debug Template',
                    content: 'Debug content',
                    organizationId: org.id,
                    createdByUserId: user.id,
                    isDefault: true
                }
            })
        }
        log('Template: ' + template.id)


        // 4. Create Draft via Logic
        log('Checking lib/prisma: ' + (libPrisma ? 'Defined' : 'Undefined'))
        if (libPrisma) log('Checking lib/prisma.organization: ' + (libPrisma.organization ? 'Defined' : 'Undefined'))

        log('Creating draft via limit check...')
        try {
            const draftLimit = await createDraft({
                organizationId: org.id,
                createdByUserId: user.id,
                templateId: template.id,
                title: 'Debug Draft Limit',
                content: { foo: 'bar' }
            })
            log('Draft created via limit check: ' + draftLimit.id)
        } catch (e: any) {
            log('Limit check failed: ' + e.message)
        }

    } catch (e: any) {
        log('ERROR: ' + e.message)
        log('Full Error: ' + JSON.stringify(e))
    } finally {
        await prisma.$disconnect()
    }
}

main()
