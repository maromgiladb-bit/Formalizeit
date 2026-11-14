/** Workflow states in which the receiver owes us an action and should get 48h / 5d reminders. */
export const REMINDER_STATES = [
    'AWAITING_PARTY_B_REVIEW',
    'AWAITING_PARTY_B_SIGNATURE',
    'AWAITING_PARTY_A_SIGNATURE',
] as const

export type ReminderMode = 'review' | 'sign'

/** A first send (send-for-review / send-for-input) leaves the receiver in review, not signing. */
export function reminderMode(workflowState: string): ReminderMode {
    return workflowState === 'AWAITING_PARTY_B_REVIEW' ? 'review' : 'sign'
}

export function reminderLinkPath(workflowState: string, signerId: string): string {
    return reminderMode(workflowState) === 'review'
        ? `/fillndahtml-public/${signerId}`
        : `/sign-nda-public/${signerId}`
}
