import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')

  if (!table) {
    return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
  }

  const { data, error } = await supabase.from(table).select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { table, record } = await request.json()

  if (!table || !record) {
    return NextResponse.json({ error: 'Table name and record are required' }, { status: 400 })
  }

  let result;
  if (record.id) {
    // If id is provided, update the existing record
    const { data, error } = await supabase
      .from(table)
      .update(record)
      .eq('id', record.id)
    result = { data, error }
  } else {
    // If no id is provided, insert a new record
    const { data, error } = await supabase
      .from(table)
      .insert([record])
    result = { data, error }
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json(result.data)
}

