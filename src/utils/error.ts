export class NotImplmentedError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'NotImplementedError'
  }
}
