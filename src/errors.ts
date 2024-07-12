/** Error type thrown for all invalid usage of the library. */
export class TDGError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TDGError';
  }
}
