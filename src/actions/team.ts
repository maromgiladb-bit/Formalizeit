'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { addMemberToOrganization } from '@/organizations/limits'
import { getActiveOrganization } from '@/lib/db-organization'
import { isOrganizationOwner, toDbMembershipRole } from '@/lib/organizationRoles'
import { sendEmail, inviteEmailHtml, getAppUrl } from '@/lib/email'

export async function inviteMember(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    const email = formData.get('email') as string
    const requestedRole = formData.get('role') as string | null
    const role = toDbMembershipRole(requestedRole)

    if (!email || !role) return { error: 'Email and valid role are required' }
    if (role === 'OWNER') return { error: 'Cannot invite someone as Owner. Assign Approver or Contributor instead.' }

    try {
        const activeMembership = await getActiveOrganization()
        if (!activeMembership) return { error: 'You do not belong to an organization' }

        if (!isOrganizationOwner(activeMembership.role)) {
            return { error: 'Only the organization owner can invite members' }
        }

        const org = await prisma.organization.findUnique({
            where: { id: activeMembership.organizationId },
            include: { owner: true },
        })
        if (!org) return { error: 'Organization not found' }

        let user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    externalId: `invited_${email}_${Date.now()}`,
                    name: email.split('@')[0],
                },
            })
        }

        const existingMembership = await prisma.membership.findUnique({
            where: { userId_organizationId: { userId: user.id, organizationId: activeMembership.organizationId } },
        })
        if (existingMembership) return { error: 'User is already a member of this organization' }

        try {
            await addMemberToOrganization(activeMembership.organizationId, user.id, role, 'PENDING_INVITE')
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to invite member'
            if (msg.includes('maximum number of users')) return { error: msg }
            throw err
        }

        // Send invite email (best-effort)
        try {
            const inviterName = org.owner?.name || org.owner?.email || 'The owner'
            await sendEmail({
                to: email,
                subject: `You've been invited to ${org.name} on Formalize It`,
                html: inviteEmailHtml(org.name, inviterName, role, `${getAppUrl()}/sign-in`),
            })
        } catch (emailError) {
            console.error('Failed to send invite email:', emailError)
        }

        revalidatePath('/settings/team')
        return { success: true }
    } catch (error) {
        console.error('Invite error:', error)
        return { error: error instanceof Error ? error.message : 'Failed to invite member' }
    }
}

export async function removeMember(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    const membershipId = formData.get('membershipId') as string | null
    if (!membershipId) return { error: 'Membership ID is required' }

    try {
        const activeMembership = await getActiveOrganization()
        if (!activeMembership) return { error: 'No active organization found' }

        if (!isOrganizationOwner(activeMembership.role)) {
            return { error: 'Only the organization owner can remove members' }
        }

        const target = await prisma.membership.findUnique({
            where: { id: membershipId },
            select: { id: true, role: true, organizationId: true },
        })
        if (!target || target.organizationId !== activeMembership.organizationId) {
            return { error: 'Member not found in this organization' }
        }
        if (target.role === 'OWNER') {
            return { error: 'Cannot remove the organization owner' }
        }

        await prisma.membership.delete({ where: { id: membershipId } })
        revalidatePath('/settings/team')
        return { success: true }
    } catch (error) {
        console.error('Remove member error:', error)
        return { error: 'Failed to remove member' }
    }
}

export async function updateMemberRole(_formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    const membershipId = _formData.get('membershipId') as string | null
    const requestedRole = _formData.get('role') as string | null
    const nextRole = toDbMembershipRole(requestedRole)

    if (!membershipId || !nextRole) return { error: 'Membership and valid role are required' }
    if (nextRole === 'OWNER') return { error: 'Cannot assign Owner role via settings' }

    try {
        const activeMembership = await getActiveOrganization()
        if (!activeMembership) return { error: 'No active organization found' }

        if (!isOrganizationOwner(activeMembership.role)) {
            return { error: 'Only the owner can change member roles' }
        }

        const target = await prisma.membership.findUnique({
            where: { id: membershipId },
            select: { id: true, role: true, organizationId: true },
        })
        if (!target || target.organizationId !== activeMembership.organizationId) {
            return { error: 'Member not found in active organization' }
        }
        if (target.role === 'OWNER') {
            return { error: "Cannot change the Owner's role" }
        }
        if (target.role === nextRole) return { success: true }

        await prisma.membership.update({ where: { id: membershipId }, data: { role: nextRole } })
        revalidatePath('/settings/team')
        return { success: true }
    } catch (error) {
        console.error('Update member role error:', error)
        return { error: 'Failed to update member role' }
    }
}

/** Toggle the isApprover flag on an OWNER membership */
export async function updateMemberApprover(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    const membershipId = formData.get('membershipId') as string | null
    const isApprover = formData.get('isApprover') === 'true'

    if (!membershipId) return { error: 'Membership ID is required' }

    try {
        const activeMembership = await getActiveOrganization()
        if (!activeMembership) return { error: 'No active organization found' }

        if (!isOrganizationOwner(activeMembership.role)) {
            return { error: 'Only the organization owner can manage approver settings' }
        }

        const target = await prisma.membership.findUnique({
            where: { id: membershipId },
            select: { id: true, role: true, organizationId: true },
        })
        if (!target || target.organizationId !== activeMembership.organizationId) {
            return { error: 'Member not found in this organization' }
        }
        if (target.role !== 'OWNER') {
            return { error: 'Approver toggle only applies to Owner members' }
        }

        await prisma.membership.update({ where: { id: membershipId }, data: { isApprover } })
        revalidatePath('/settings/team')
        return { success: true }
    } catch (error) {
        console.error('Update approver error:', error)
        return { error: 'Failed to update approver setting' }
    }
}

export async function createOrganization(name: string): Promise<{ success?: boolean; error?: string }> {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    const trimmedName = name.trim()
    if (trimmedName.length < 2) return { error: 'Name must be at least 2 characters' }
    if (trimmedName.length > 80) return { error: 'Name must be 80 characters or less' }

    try {
        const user = await prisma.user.findUnique({ where: { externalId: userId } })
        if (!user) return { error: 'User not found' }

        const base = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'org'
        const slug = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`

        const org = await prisma.organization.create({
            data: {
                name: trimmedName,
                slug,
                ownerUserId: user.id,
                memberships: {
                    create: { userId: user.id, role: 'OWNER' },
                },
            },
        })

        const cookieStore = await cookies()
        cookieStore.set('active-org-id', org.id, { path: '/', maxAge: 60 * 60 * 24 * 365 })

        revalidatePath('/settings/team')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Create organization error:', error)
        return { error: 'Failed to create organization' }
    }
}

export async function acceptInvite(membershipId: string) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    try {
        const user = await prisma.user.findUnique({ where: { externalId: userId } })
        if (!user) return { error: 'User not found' }

        const membership = await prisma.membership.findUnique({ where: { id: membershipId } })
        if (!membership || membership.userId !== user.id) {
            return { error: 'Invite not found' }
        }

        if (membership.status !== 'PENDING_INVITE') {
            return { error: 'Invite already accepted or invalid' }
        }

        const updated = await prisma.membership.update({
            where: { id: membershipId },
            data: { status: 'ACTIVE' }
        })

        const cookieStore = await cookies()
        cookieStore.set('active-org-id', updated.organizationId, { path: '/', maxAge: 60 * 60 * 24 * 365 })

        revalidatePath('/settings/team')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Accept invite error:', error)
        return { error: 'Failed to accept invite' }
    }
}

export async function declineInvite(membershipId: string) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    try {
        const user = await prisma.user.findUnique({ where: { externalId: userId } })
        if (!user) return { error: 'User not found' }

        const membership = await prisma.membership.findUnique({ where: { id: membershipId } })
        if (!membership || membership.userId !== user.id) {
            return { error: 'Invite not found' }
        }

        if (membership.status !== 'PENDING_INVITE') {
            return { error: 'Invite already accepted or invalid' }
        }

        await prisma.membership.delete({ where: { id: membershipId } })
        
        revalidatePath('/settings/team')
        return { success: true }
    } catch (error) {
        console.error('Decline invite error:', error)
        return { error: 'Failed to decline invite' }
    }
}

export async function leaveOrganization(membershipId: string) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    try {
        const user = await prisma.user.findUnique({ where: { externalId: userId } })
        if (!user) return { error: 'User not found' }

        const membership = await prisma.membership.findUnique({ where: { id: membershipId } })
        if (!membership || membership.userId !== user.id) {
            return { error: 'Membership not found' }
        }

        if (membership.role === 'OWNER') {
            return { error: 'Owners cannot leave the organization' }
        }

        await prisma.membership.delete({ where: { id: membershipId } })

        const cookieStore = await cookies()
        const activeOrgId = cookieStore.get('active-org-id')?.value
        if (activeOrgId === membership.organizationId) {
            cookieStore.delete('active-org-id')
        }

        revalidatePath('/settings/team')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Leave organization error:', error)
        return { error: 'Failed to leave organization' }
    }
}
