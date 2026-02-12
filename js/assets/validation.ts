export const toPositiveInt = (value: unknown, name: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`)
  }
  if (value <= 0) {
    throw new Error(`${name} must be greater than 0`)
  }
  return value
}

export const toByte = (value: unknown, name: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`)
  }
  if (value < 0 || value > 255) {
    throw new Error(`${name} must be between 0 and 255`)
  }
  return value
}
