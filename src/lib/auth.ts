import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  organizationId: string | null
  role: 'owner' | 'admin' | 'member'
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function getAuthFromRequest(request: NextRequest): AuthUser | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyToken(token)
  }

  // Try to get token from cookie
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) {
    return verifyToken(cookieToken)
  }

  return null
}

export function requireAuth(handler: (request: NextRequest, auth: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = getAuthFromRequest(request)
    
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, auth)
  }
}

export function requireOwner(handler: (request: NextRequest, auth: AuthUser) => Promise<Response>) {
  return requireAuth(async (request: NextRequest, auth: AuthUser) => {
    if (auth.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Owner access required' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, auth)
  })
}
