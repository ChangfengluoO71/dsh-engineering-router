function personaBlockRange(c) {
  const row = [
    '- id: persona',
    "  name: '@deepseek-ai/dsh-persona'",
    '  config:',
  ].join('\n')
  const start = c.indexOf(row)
  if (start === -1) throw new Error('cannot find @deepseek-ai/dsh-persona row')
  const next = c.indexOf('\n- id:', start + row.length)
  return { start, end: next === -1 ? c.length : next }
}

export function normalizePersonaConfig(c) {
  const { start, end } = personaBlockRange(c)
  const block = c.slice(start, end)

  if (/\n    prefix:\s/.test(block)) return c
  if (!/\n    text:\s/.test(block)) {
    throw new Error('dsh-persona config has neither required prefix nor known legacy text key')
  }

  const patched = block.replace(/\n    text:(\s)/, '\n    prefix:$1')
  return c.slice(0, start) + patched + c.slice(end)
}

export function assertPersonaConfig(c) {
  const { start, end } = personaBlockRange(c)
  const block = c.slice(start, end)
  if (!/\n    prefix:\s/.test(block)) {
    throw new Error('@deepseek-ai/dsh-persona requires config.prefix')
  }
  if (/\n    text:\s/.test(block)) {
    throw new Error('@deepseek-ai/dsh-persona legacy config.text must not ship')
  }
  return true
}
