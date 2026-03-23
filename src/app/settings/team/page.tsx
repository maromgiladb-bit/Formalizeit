import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InviteMemberForm from '@/app/team/InviteMemberForm'
import CreateOrganizationForm from '@/app/team/CreateOrganizationForm'
import MemberRoleDropdown from '@/app/team/MemberRoleDropdown'
import { getActiveOrganization } from '@/lib/db-organization'
import { updateMemberApprover } from '@/actions/team'
import RemoveMemberButton from '@/app/team/RemoveMemberButton'
import LeaveTeamButton from '@/app/team/LeaveTeamButton'
import InviteActions from '@/app/team/InviteActions'
import {
    getOrganizationRoleBadgeClass,
    getOrganizationRoleLabel,
    isOrganizationOwner,
    canApproveAndSend,
    ORGANIZATION_ROLE_OPTIONS,
    APPROVER_OPTIONS,
    ROLE_DESCRIPTIONS,
} from '@/lib/organizationRoles'

export default async function TeamSettingsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const user = await prisma.user.findUnique({
        where: { externalId: userId },
        include: {
            memberships: {
                where: { status: 'PENDING_INVITE' },
                include: { organization: true }
            }
        }
    })
    const pendingInvites = user?.memberships || []

    const membership = await getActiveOrganization()

    const pendingInvitesSection = pendingInvites.length > 0 ? (
        <div className="mb-6 space-y-3">
            {pendingInvites.map(invite => (
                <div key={invite.id} className="rounded-md bg-blue-50 border border-blue-200 p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h4 className="text-sm font-semibold text-blue-900">Pending Invitation</h4>
                        <p className="text-sm text-blue-800">
                            You have been invited to join <strong>{invite.organization.name}</strong> as a {getOrganizationRoleLabel(invite.role)}.
                        </p>
                    </div>
                    <InviteActions membershipId={invite.id} />
                </div>
            ))}
        </div>
    ) : null;

    if (!membership) {
        return (
            <div className="space-y-6">
                {pendingInvitesSection}
                <CreateOrganizationForm />
            </div>
        )
    }

    const organizationData = await prisma.organization.findUnique({
        where: { id: membership.organizationId },
        include: { memberships: { include: { user: true } } },
    })

    if (!organizationData) return null

    const members = organizationData.memberships
    const isOwner = isOrganizationOwner(membership.role)

    // Count members who can approve and send
    const approverCount = members.filter(
        m => m.role === 'APPROVER' || (m.role === 'OWNER' && m.isApprover)
    ).length

    return (
        <div className="space-y-6">
            {pendingInvitesSection}

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Team Management</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Manage members for <strong>{organizationData.name}</strong>
                    </p>
                </div>

            {/* No-approver warning — only shown to owner when no one can send NDAs */}
            {isOwner && approverCount === 0 && (
                <div className="mx-4 mt-4 rounded-md bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm text-amber-800">
                        <strong>No approvers assigned.</strong> NDAs cannot be sent externally until at least one
                        member has the Approver role, or you enable the &ldquo;Also an Approver&rdquo; toggle on
                        your own account below.
                    </p>
                </div>
            )}

            {/* Role guide */}
            <div className="mx-4 mt-4 rounded-md bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">Role guide</p>
                <ul className="space-y-1">
                    {(['OWNER', 'APPROVER', 'CONTRIBUTOR'] as const).map(r => (
                        <li key={r} className="flex items-start gap-2">
                            <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${getOrganizationRoleBadgeClass(r)}`}>
                                {ROLE_DESCRIPTIONS[r].label}
                            </span>
                            <span>{ROLE_DESCRIPTIONS[r].description}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <ul role="list" className="divide-y divide-gray-200 mt-4">
                {members.map((member) => {
                    const memberForGuard = { role: member.role, isApprover: member.isApprover }
                    const isThisOwner = member.role === 'OWNER'
                    const canSend = canApproveAndSend(memberForGuard)
                    const isPending = member.status === 'PENDING_INVITE'

                    return (
                        <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between gap-4">

                                {/* Avatar + user info */}
                                <div className="flex items-center min-w-0">
                                    <div className="shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-300">
                                        {member.user.name?.[0]?.toUpperCase() || member.user.email[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="ml-4 min-w-0">
                                        <p className="text-sm font-medium text-teal-700 truncate">
                                            {member.user.name || 'Unnamed User'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                                        {isPending && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                                Pending Invite
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="shrink-0 flex flex-col items-end gap-2">
                                    {/* Role badge */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrganizationRoleBadgeClass(member.role)}`}>
                                            {getOrganizationRoleLabel(member.role)}
                                        </span>
                                        {canSend && (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                Can send
                                            </span>
                                        )}
                                    </div>

                                    {/* Role selector — non-owner members only, owner's column shows approver toggle */}
                                    {isOwner && !isThisOwner && (
                                        <MemberRoleDropdown
                                            membershipId={member.id}
                                            currentRole={member.role}
                                            options={ORGANIZATION_ROLE_OPTIONS}
                                        />
                                    )}

                                    {/* Approver toggle — Owner members only */}
                                    {isOwner && isThisOwner && (
                                        <MemberRoleDropdown
                                            membershipId={member.id}
                                            currentRole={member.isApprover ? 'true' : 'false'}
                                            options={APPROVER_OPTIONS}
                                            serverAction={updateMemberApprover}
                                            fieldName="isApprover"
                                        />
                                    )}

                                    {/* Remove member — only for non-owner members */}
                                    {isOwner && !isThisOwner && (
                                        <RemoveMemberButton
                                            membershipId={member.id}
                                            memberName={member.user.name || member.user.email}
                                        />
                                    )}

                                    {/* Leave Team - only for current user if not owner */}
                                    {!isOwner && member.user.externalId === userId && (
                                        <LeaveTeamButton
                                            membershipId={member.id}
                                            orgName={organizationData.name}
                                        />
                                    )}
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>

            {isOwner && (
                <div className="px-4 py-5 sm:px-6 border-t border-gray-200 bg-gray-50">
                    <InviteMemberForm />
                </div>
            )}
            </div>
        </div>
    )
}
