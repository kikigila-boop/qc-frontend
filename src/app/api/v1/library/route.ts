import { NextRequest, NextResponse } from 'next/server'

const HF_BASE = 'https://rifqki-content-ops.hf.space'

// Proxy GET /api/v1/library (list) → HF /api/v1/library/ (with trailing slash)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const hfUrl = `${HF_BASE}/api/v1/library/${url.search}`
  try {
    const resp = await fetch(hfUrl, {
      headers: { Authorization: req.headers.get('Authorization') ?? '' },
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e) {
    return NextResponse.json({ error: 'proxy error' }, { status: 502 })
  }
}

// Proxy POST /api/v1/library (create) → HF /api/v1/library/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const resp = await fetch(`${HF_BASE}/api/v1/library/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.get('Authorization') ?? '',
      },
      body: JSON.stringify(body),
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e) {
    return NextResponse.json({ error: 'proxy error' }, { status: 502 })
  }
}
