import { NextRequest } from 'next/server'

import { readStoredFile } from '@/lib/local-storage'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { segments: string[] } }
) {
  try {
    const result = await readStoredFile(params.segments)

    return new Response(new Uint8Array(result.content), {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${result.fileName}"`,
      },
    })
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return new Response('File not found', { status: 404 })
    }

    console.error('Storage file read error:', error)
    return new Response('Failed to read file', { status: 500 })
  }
}
