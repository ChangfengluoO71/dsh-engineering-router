#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { assertPersonaConfig } from './compat-patches.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const preset = readFileSync(join(ROOT, 'agent-presets', 'engineering-router', 'agent.cordis.yml'), 'utf8')
const lock = JSON.parse(readFileSync(join(ROOT, 'upstream.lock.json'), 'utf8'))

assertPersonaConfig(preset)

const key = lock?.compatibilityPatches?.dshPersonaConfigKey
if (key !== 'prefix') {
  throw new Error('upstream.lock.json must declare compatibilityPatches.dshPersonaConfigKey="prefix"')
}

console.log('preset contract OK: dsh-persona config.prefix')
