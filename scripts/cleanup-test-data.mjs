// scripts/cleanup-test-data.mjs
//
// Purge test ORGANIZATIONS (and everything cascading from them) from a database,
// plus their S3 PDF objects. Built for the one-time production data-hygiene step
// before launch (see docs/environments.md, launch plan Workstream 4).
//
// SAFETY MODEL — this script is intentionally hard to fire by accident:
//   • Default run = DRY RUN. It lists every organization with counts and does
//     nothing else. Eyeball the list first.
//   • It NEVER deletes "all test-looking" orgs by heuristic. You must name the
//     exact org IDs to delete.
//   • Deletion only happens with BOTH --org <ids> AND --confirm-delete.
//
// Usage:
//   node scripts/cleanup-test-data.mjs                          # dry run: list all orgs
//   node scripts/cleanup-test-data.mjs --org <id1>,<id2>        # preview what those orgs would remove
//   node scripts/cleanup-test-data.mjs --org <id1>,<id2> --confirm-delete   # actually delete
//
// Reads DATABASE_URL + S3_* from the environment (.env / .env.local). Point it at
// the database you intend to clean — double-check you are NOT on production unless
// that is the deliberate one-time cleanup.

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const prisma = new PrismaClient()

function parseArgs(argv) {
  const args = { orgIds: [], confirmDelete: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--org') {
      const val = argv[++i] ?? ''
      args.orgIds.push(...val.split(',').map((s) => s.trim()).filter(Boolean))
    } else if (a === '--confirm-delete') {
      args.confirmDelete = true
    }
  }
  return args
}

async function listAllOrgs() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      owner: { select: { email: true } },
      _count: { select: { memberships: true, drafts: true, ndaPdfs: true, auditEvents: true } },
    },
  })
  console.log(`\n${orgs.length} organization(s) in this database:\n`)
  for (const o of orgs) {
    console.log(
      `  ${o.id}  ${o.billingPlan.padEnd(10)}  ${(o.owner?.email ?? '—').padEnd(30)}  ` +
        `members=${o._count.memberships} drafts=${o._count.drafts} pdfs=${o._count.ndaPdfs} ` +
        `audit=${o._count.auditEvents}  "${o.name}"  (${o.createdAt.toISOString().slice(0, 10)})`
    )
  }
  console.log(
    `\nDry run. To delete specific orgs:\n` +
      `  node scripts/cleanup-test-data.mjs --org <id>,<id> --confirm-delete\n`
  )
}

async function deleteOrgs(orgIds, confirmDelete) {
  const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  })
  const bucket = process.env.S3_BUCKET_NAME

  for (const orgId of orgIds) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { owner: { select: { email: true } }, _count: { select: { drafts: true, ndaPdfs: true } } },
    })
    if (!org) {
      console.log(`  SKIP ${orgId} — not found`)
      continue
    }

    // Collect S3 keys before the cascade removes the NdaPdf rows.
    const pdfs = await prisma.ndaPdf.findMany({ where: { organizationId: orgId }, select: { s3Key: true } })

    console.log(
      `\n  ${confirmDelete ? 'DELETING' : 'WOULD DELETE'} org ${orgId} "${org.name}" ` +
        `(owner ${org.owner?.email ?? '—'}, drafts=${org._count.drafts}, pdfs=${pdfs.length})`
    )

    if (!confirmDelete) continue

    // 1. Delete S3 objects (cascade removes DB rows but not the files).
    for (const { s3Key } of pdfs) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: s3Key }))
        console.log(`    s3: deleted ${s3Key}`)
      } catch (err) {
        console.log(`    s3: FAILED ${s3Key} — ${err?.message ?? err}`)
      }
    }

    // 2. Delete the org — memberships, drafts, sign requests, audit events, PDFs cascade.
    await prisma.organization.delete({ where: { id: orgId } })
    console.log(`    db: org + cascaded rows deleted`)
  }
}

async function main() {
  const { orgIds, confirmDelete } = parseArgs(process.argv.slice(2))
  const dbHost = (process.env.DATABASE_URL ?? '').replace(/:[^:@/]+@/, ':****@')
  console.log(`DATABASE_URL → ${dbHost || '(unset)'}`)

  if (orgIds.length === 0) {
    await listAllOrgs()
  } else {
    if (confirmDelete) {
      console.log(`\n!!! DESTRUCTIVE: deleting ${orgIds.length} org(s) and their S3 objects. !!!`)
    } else {
      console.log(`\nPreview mode (no --confirm-delete): nothing will be deleted.`)
    }
    await deleteOrgs(orgIds, confirmDelete)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
