// Uploads every file in ./storage into the NEW Supabase project's storage buckets,
// keeping the same bucket and path, then verifies the count and sizes against
// storage_manifest.json.
//
// Requires Node 18+. Run AFTER 01_database.sql (which creates the buckets):
//
//   NEW_SUPABASE_URL=https://<NEW_PROJECT_REF>.supabase.co \
//   NEW_SUPABASE_SERVICE_ROLE_KEY=<new project's service_role key> \
//   node upload_storage.mjs
//
// The key is read from the environment only; never commit it.

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const URL = process.env.NEW_SUPABASE_URL?.replace(/\/$/, '')
const KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Set NEW_SUPABASE_URL and NEW_SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(join(here, 'storage_manifest.json'), 'utf8'))
const enc = (p) => p.split('/').map(encodeURIComponent).join('/')

let ok = 0
const failed = []
for (const f of manifest) {
  const body = readFileSync(join(here, 'storage', f.bucket, ...f.path.split('/')))
  if (body.length !== f.size) {
    failed.push(`${f.bucket}/${f.path}: local file size ${body.length} != ${f.size}`)
    continue
  }
  const res = await fetch(`${URL}/storage/v1/object/${f.bucket}/${enc(f.path)}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': f.mimetype || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body,
  })
  if (res.ok) ok++
  else failed.push(`${f.bucket}/${f.path}: HTTP ${res.status} ${await res.text()}`)
  if ((ok + failed.length) % 100 === 0) console.log(`${ok + failed.length} / ${manifest.length}`)
}

console.log(`Uploaded ${ok} of ${manifest.length} files.`)
if (failed.length) {
  console.error(`${failed.length} failed:\n` + failed.join('\n'))
  process.exit(1)
}
