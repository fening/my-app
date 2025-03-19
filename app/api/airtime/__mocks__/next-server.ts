// Mock implementation of next/server for testing

export class NextResponse {
  public status: number;
  public body: unknown;

  constructor(body: unknown, init: { status: number }) {
    this.body = body;
    this.status = init.status;
  }

  static json(body: unknown, init: { status: number } = { status: 200 }) {
    return new NextResponse(body, init);
  }

  json() {
    return Promise.resolve(this.body);
  }
}

export class NextRequest {
  private _url: string;
  private _method: string;
  private _body: string | null;

  constructor(url: string, options: { method: string; body?: string }) {
    this._url = url;
    this._method = options.method;
    this._body = options.body || null;
  }

  get url() {
    return this._url;
  }

  get method() {
    return this._method;
  }

  json() {
    return Promise.resolve(JSON.parse(this._body || '{}'));
  }
}
