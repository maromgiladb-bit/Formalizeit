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
import { Users, AlertTriangle } from 'lucide-react'
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
        <div className="space-y-3 mb-6">
            {pendingInvites.map(invite => (
                <div key={invite.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-teal-700" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Pending Invitation</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                                You have been invited to join <strong className="text-gray-700">{invite.organization.name}</strong> as a {getOrganizationRoleLabel(invite.role)}.
                            </p>
                        </div>
                    </div>
                    <InviteActions membershipId={invite.id} />
                </div>
            ))}
        </div>
    ) : null

    if (!membership) {
        return (
            <div className="space-y-6">
                {pendingInvitesSection}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-teal-700" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Create a Team</h3>
                                <p className="text-sm text-gray-500">Set up your organization to collaborate on NDAs</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <CreateOrganizationForm />
                    </div>
                </div>
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

    const approverCount = members.filter(
        m => m.role === 'APPROVER' || (m.role === 'OWNER' && m.isApprover)
    ).length

    return (
        <div className="space-y-6">
            {pendingInvitesSection}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                {/* Card Header */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Team Management</h3>
                            <p className="text-sm text-gray-500">Manage members for <strong className="text-gray-700">{organizationData.name}</strong></p>
                        </div>
                    </div>
                </div>

                <div className="px-6 pt-5 space-y-4">
                    {/* No-approver warning */}
                    {isOwner && approverCount === 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-sm text-amber-800">
                                <strong>No approvers assigned.</strong> NDAs can be sent for review by anyone, but they
                                cannot be signed or finalized until at least one member has the Approver role, or you
                                enable the &ldquo;Also an Approver&rdquo; toggle on your own account below.
                            </p>
                        </div>
                    )}

                    {/* Role guide */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Role Guide</p>
                        <ul className="space-y-2">
                            {(['OWNER', 'APPROVER', 'CONTRIBUTOR'] as const).map(r => (
                                <li key={r} className="flex items-start gap-3">
                                    <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${getOrganizationRoleBadgeClass(r)}`}>
                                        {ROLE_DESCRIPTIONS[r].label}
                                    </span>
                                    <span className="text-sm text-gray-500 leading-relaxed">{ROLE_DESCRIPTIONS[r].description}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Member list */}
                <ul role="list" className="divide-y divide-gray-100 mt-4">
                    {members.map((member) => {
                        const memberForGuard = { role: member.role, isApprover: member.isApprover }
                        const isThisOwner = member.role === 'OWNER'
                        const canSign = canApproveAndSend(memberForGuard)
                        const isPending = member.status === 'PENDING_INVITE'

                        return (
                            <li key={member.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                                <div className="flex items-center justify-between gap-4">

                                    {/* Avatar + info */}
                                    <div className="flex items-center min-w-0 gap-3">
                                        <div className="shrink-0 h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-200">
                                            {member.user.name?.[0]?.toUpperCase() || member.user.email[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {member.user.name || 'Unnamed User'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                                            {isPending && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                                                    Pending Invite
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getOrganizationRoleBadgeClass(member.role)}`}>
                                                {getOrganizationRoleLabel(member.role)}
                                            </span>
                                            {canSign && (
                                                <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                    Can sign
                                                </span>
                                            )}
                                        </div>

                                        {isOwner && !isThisOwner && (
                                            <MemberRoleDropdown
                                                membershipId={member.id}
                                                currentRole={member.role}
                                                options={ORGANIZATION_ROLE_OPTIONS}
                                            />
                                        )}

                                        {isOwner && isThisOwner && (
                                            <MemberRoleDropdown
                                                membershipId={member.id}
                                                currentRole={member.isApprover ? 'true' : 'false'}
                                                options={APPROVER_OPTIONS}
                                                serverAction={updateMemberApprover}
                                                fieldName="isApprover"
                                            />
                                        )}

                                        {isOwner && !isThisOwner && (
                                            <RemoveMemberButton
                                                membershipId={member.id}
                                                memberName={member.user.name || member.user.email}
                                            />
                                        )}

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

                {/* Invite form */}
                {isOwner && (
                    <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
                        <InviteMemberForm />
                    </div>
                )}
            </div>
        </div>
    )
}
