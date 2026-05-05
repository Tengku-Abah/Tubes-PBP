import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

const globalForDb = globalThis as typeof globalThis & {
  __pbpPgPool?: Pool
}

const columnCache = new Map<string, Set<string>>()

const createPool = () => {
  const connectionString = process.env.DATABASE_URL

  if (connectionString) {
    return new Pool({
      connectionString,
      max: 10,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  }

  const host = process.env.POSTGRES_HOST || '127.0.0.1'
  const port = Number(process.env.POSTGRES_PORT || '5432')
  const database = process.env.POSTGRES_DB || 'tubes_pbp'
  const user = process.env.POSTGRES_USER || 'postgres'
  const password = process.env.POSTGRES_PASSWORD || ''

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    max: 10,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  })
}

export const pool = globalForDb.__pbpPgPool ?? createPool()

if (!globalForDb.__pbpPgPool) {
  globalForDb.__pbpPgPool = pool
}

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: PoolClient
): Promise<QueryResult<T>> => {
  if (client) {
    return client.query<T>(text, params)
  }

  return pool.query<T>(text, params)
}

export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const getTableColumns = async (tableName: string) => {
  const cacheKey = `public.${tableName}`
  const cached = columnCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const result = await query<{ column_name: string }>(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
    `,
    [tableName]
  )

  const columns = new Set(result.rows.map((row) => row.column_name))
  columnCache.set(cacheKey, columns)
  return columns
}

export const hasColumn = async (tableName: string, columnName: string) => {
  const columns = await getTableColumns(tableName)
  return columns.has(columnName)
}

export const mapDbRoleToAppRole = (role?: string | null) => {
  return role === 'admin' ? 'admin' : 'user'
}

export const mapAppRoleToDbRole = (role?: string | null) => {
  return role === 'admin' ? 'admin' : 'pembeli'
}

export const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export const nowIso = () => new Date().toISOString()
