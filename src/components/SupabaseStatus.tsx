'use client'

import { useEffect, useState } from 'react'
import { checkSupabaseConnection } from '@/lib/supabaseClient'

interface SupabaseStatusProps {
  showDetails?: boolean
}

export default function SupabaseStatus({ showDetails = false }: SupabaseStatusProps) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const runCheck = async () => {
      setLoading(true)
      const result = await checkSupabaseConnection()
      setConnected(result.connected)
      setError(result.error)
      setLoading(false)
    }

    runCheck()
  }, [])

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">Backend Connection</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {loading ? 'Checking...' : connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {showDetails && (
        <div className="mt-3 text-sm text-slate-600">
          {loading ? 'Checking application API...' : connected ? 'Aplikasi berhasil menjangkau API internal dan database server.' : error || 'Connection check failed.'}
        </div>
      )}
    </div>
  )
}
