import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

// Validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(1, 'Organization name is required'),
  industry: z.string().optional(),
  organizationSize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, organizationName, industry, organizationSize } = validation.data

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create organization first
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: organizationName,
        industry,
        size: organizationSize,
      })
      .select('id')
      .single()

    if (orgError || !organization) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Create user with organization_id and owner role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        organization_id: organization.id,
        role: 'owner',
      })
      .select('id, email, first_name, last_name, organization_id, role')
      .single()

    if (userError || !user) {
      console.error('User creation error:', userError)
      
      // Cleanup: delete the organization if user creation failed
      await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', organization.id)

      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Update organization with owner_id
    const { error: updateOrgError } = await supabaseAdmin
      .from('organizations')
      .update({ owner_id: user.id })
      .eq('id', organization.id)

    if (updateOrgError) {
      console.error('Organization owner update error:', updateOrgError)
      // This is not critical, but log it for monitoring
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        organizationId: user.organization_id,
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Create response
    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        organizationId: user.organization_id,
        role: user.role,
      },
      token,
    })

    // Set HTTP-only cookie for token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
