import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    has_TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
    has_TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    TURSO_URL_length: process.env.TURSO_DATABASE_URL?.length || 0,
    TURSO_TOKEN_length: process.env.TURSO_AUTH_TOKEN?.length || 0,
    TURSO_URL_start: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...' || 'undefined',
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_value: process.env.DATABASE_URL || 'undefined'
  }
  
  console.log('🔍 Environment check:', envStatus)
  
  return NextResponse.json({
    message: "Environment variables status",
    environment: envStatus
  })
}