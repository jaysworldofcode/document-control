import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { requireOwner } from '@/lib/auth'

// Validation schema
const updateOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
})

export const PUT = requireOwner(async (request: NextRequest, auth) => {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!auth.organizationId) {
      return NextResponse.json(
        { error: 'No organization associated with user' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = updateOrgSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Update organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .eq('owner_id', auth.userId) // Extra security: ensure user owns the org
      .select('id, name, industry, size, created_at, updated_at')
      .single()

    if (orgError || !organization) {
      console.error('Organization update error:', orgError)
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization,
    })

  } catch (error) {
    console.error('Organization update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = requireOwner(async (request: NextRequest, auth) => {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!auth.organizationId) {
      return NextResponse.json(
        { error: 'No organization associated with user' },
        { status: 400 }
      )
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, industry, size, created_at, updated_at')
      .eq('id', auth.organizationId)
      .eq('owner_id', auth.userId) // Extra security: ensure user owns the org
      .single()

    if (orgError || !organization) {
      console.error('Organization fetch error:', orgError)
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get organization members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, created_at')
      .eq('organization_id', auth.organizationId)

    if (membersError) {
      console.error('Members fetch error:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch organization members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      organization,
      members: members || [],
    })

  } catch (error) {
    console.error('Organization fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
