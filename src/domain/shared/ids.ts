let idCounter = 0

export const createId = (prefix: string) => {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

export const nowIso = () => new Date().toISOString()
