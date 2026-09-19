function personaBlockRange(c) {
  const row = /- id: persona\r?\n  name: '@deepseek-ai\/dsh-persona'\r?\n  config:/
  const match = row.exec(c)
  if (!match || match.index === undefined) throw new Error('cannot find @deepseek-ai/dsh-persona row')

  const start = match.index
  const tail = c.slice(start + match[0].length)
  const next = /\r?\n- id:/.exec(tail)
  const end = next?.index === undefined
    ? c.length
    : start + match[0].length + next.index
  return { start, end }
}

export function normalizePersonaConfig(c) {
  const { start, end } = personaBlockRange(c)
  const block = c.slice(start, end)

  if (/\r?\n    prefix:\s/.test(block)) return c
  if (!/\r?\n    text:\s/.test(block)) {
    throw new Error('dsh-persona config has neither required prefix nor known legacy text key')
  }

  const patched = block.replace(/(\r?\n)    text:(\s)/, '$1    prefix:$2')
  return c.slice(0, start) + patched + c.slice(end)
}

export function assertPersonaConfig(c) {
  const { start, end } = personaBlockRange(c)
  const block = c.slice(start, end)
  if (!/\r?\n    prefix:\s/.test(block)) {
    throw new Error('@deepseek-ai/dsh-persona requires config.prefix')
  }
  if (/\r?\n    text:\s/.test(block)) {
    throw new Error('@deepseek-ai/dsh-persona legacy config.text must not ship')
  }
  return true
}
