'use client'

import { useState, useEffect } from 'react'
import { checkSupabaseConnection } from '@/lib/supabaseClient'

interface SupabaseStatusProps {
  showDetails?: boolean
}

export default function SupabaseStatus({ showDetails = false }: SupabaseStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    error: string | null
    loading: boolean
  }>({
    connected: false,
    error: null,
    loading: true
  })

  useEffect(() => {
    const testConnection = async () => {
      setConnectionStatus(prev => ({ ...prev, loading: true }))
      
      try {
        const result = await checkSupabaseConnection()
        setConnectionStatus({
          connected: result.connected,
          error: result.error,
          loading: false
        })
      } catch (error) {
        setConnectionStatus({
          connected: false,
          error: 'Failed to test connection',
          loading: false
        })
      }
    }

    testConnection()
  }, [])

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus.loading 
            ? 'bg-yellow-400 animate-pulse' 
            : connectionStatus.connected 
              ? 'bg-green-400' 
              : 'bg-red-400'
        }`}></div>
        <span className="text-xs text-slate-600">
          {connectionStatus.loading 
            ? 'Testing...' 
            : connectionStatus.connected 
              ? 'Supabase Connected' 
              : 'Supabase Disconnected'
          }
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">Database Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Supabase Connection:</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.loading 
                ? 'bg-yellow-400 animate-pulse' 
                : connectionStatus.connected 
                  ? 'bg-green-400' 
                  : 'bg-red-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              connectionStatus.loading 
                ? 'text-yellow-600' 
                : connectionStatus.connected 
                  ? 'text-green-600' 
                  : 'text-red-600'
            }`}>
              {connectionStatus.loading 
                ? 'Testing...' 
                : connectionStatus.connected 
                  ? 'Connected' 
                  : 'Disconnected'
              }
            </span>
          </div>
        </div>

        {connectionStatus.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {connectionStatus.error}
            </p>
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <p className="text-sm text-primary-700">
            <strong>Note:</strong> Currently using dummy data. 
            Configure your Supabase credentials in <code className="bg-primary-100 px-1 rounded">.env.local</code> to connect to the database.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          <p>Required environment variables:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
