/* global process, Buffer */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const args = new Map(process.argv.slice(2).map((value, index, all) => value.startsWith('--') ? [value, all[index + 1]?.startsWith('--') ? 'true' : all[index + 1]] : null).filter(Boolean))
const output = path.resolve(args.get('--output') || '.backup/storage')
const manifestInput = args.get('--manifest-in')
const manifestOutput = path.resolve(args.get('--manifest-out') || '.backup/storage-manifest.json')
const full = args.get('--full') === 'true'
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
let previous = { objects: {} }
if (manifestInput) {
  try { previous = JSON.parse(await readFile(manifestInput, 'utf8')) } catch { /* First run has no prior manifest. */ }
}

function safeSegment(value) {
  const normalized = String(value || '').replaceAll('\\', '/').split('/').filter(part => part && part !== '.' && part !== '..')
  if (!normalized.length) throw new Error('Storage object has an invalid path.')
  return normalized
}

async function listFiles(bucket, prefix = '') {
  const files = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    for (const item of data || []) {
      const name = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id) files.push({ ...item, name })
      else files.push(...await listFiles(bucket, name))
    }
    if ((data || []).length < 1000) break
  }
  return files
}

const { data: buckets, error: bucketError } = await client.storage.listBuckets()
if (bucketError) throw bucketError
const next = { generatedAt: new Date().toISOString(), fullSnapshot: full, objects: {} }
let downloadedFiles = 0
let downloadedBytes = 0

for (const bucket of buckets || []) {
  for (const object of await listFiles(bucket.id)) {
    const identity = `${bucket.id}/${object.name}`
    const version = [object.updated_at, object.metadata?.eTag, object.metadata?.size].filter(Boolean).join('|')
    const old = previous.objects?.[identity]
    const unchanged = !full && old?.version === version
    if (unchanged) {
      next.objects[identity] = old
      continue
    }
    const { data, error } = await client.storage.from(bucket.id).download(object.name)
    if (error) throw error
    const bytes = Buffer.from(await data.arrayBuffer())
    const target = path.join(output, ...safeSegment(bucket.id), ...safeSegment(object.name))
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, bytes)
    next.objects[identity] = {
      bucket: bucket.id,
      name: object.name,
      version,
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      backedUpAt: next.generatedAt,
    }
    downloadedFiles += 1
    downloadedBytes += bytes.length
  }
}

await mkdir(path.dirname(manifestOutput), { recursive: true })
await writeFile(manifestOutput, JSON.stringify(next, null, 2))
process.stdout.write(JSON.stringify({ downloadedFiles, downloadedBytes, trackedFiles: Object.keys(next.objects).length }))
