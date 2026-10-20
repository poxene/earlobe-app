export class ReconnectRequired extends Error {
  constructor() {
    super("reconnect_required");
    this.name = "ReconnectRequired";
  }
}

export class GameError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "GameError";
    this.status = status;
    this.code = code;
  }
}
