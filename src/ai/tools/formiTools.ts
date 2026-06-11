import { tool } from "ai";
import { z } from "zod";

// Tools Formi (the NDA copilot) can call. Kept separate from the route so the
// schemas/handlers are easy to reuse and test.
//
// IMPORTANT: all string arguments the model produces here (category, field,
// fieldLabel, message) must be in ENGLISH, even when Formi is chatting with the
// user in another language. That rule lives in the system prompt.

const severitySchema = z.enum(["high", "medium", "low"]);

const findingSchema = z.object({
	severity: severitySchema.describe(
		"high = duration > 5 years, IP transfer/assignment, liability/indemnification, or financial/payment terms. medium/low = lesser concerns."
	),
	category: z
		.string()
		.describe(
			"Short English risk category, e.g. 'Duration', 'IP Transfer', 'Liability', 'Financial Terms', 'Governing Law'."
		),
	field: z
		.string()
		.describe(
			"The offending form field key, e.g. 'term_months', 'confidentiality_period_months', 'additional_terms', 'governing_law'."
		),
	fieldLabel: z
		.string()
		.describe(
			"Human-readable English label for the field, e.g. 'Term Duration', 'Confidentiality Period', 'Custom Clauses', 'Governing Law'."
		),
	message: z
		.string()
		.describe("Concise English explanation of the risk and a suggested action."),
});

/**
 * Deterministic month -> year conversion so the model never miscomputes the
 * 5-year (60-month) high-severity threshold.
 */
export const getDurationInYears = tool({
	description:
		"Convert a duration in months to years and report whether it exceeds the 5-year (60-month) high-severity threshold. Use this for any duration check instead of estimating.",
	inputSchema: z.object({
		months: z.number().describe("Duration in months."),
	}),
	execute: async ({ months }) => {
		const years = Math.round((months / 12) * 100) / 100;
		return { years, exceedsFiveYears: months > 60 };
	},
});

/**
 * Structured risk report. The client reads these tool-call inputs to drive the
 * notification badge and the send-time advisory gate. Call this exactly once per
 * analysis with the full list of findings (empty array if the form is blank).
 */
export const recordFindings = tool({
	description:
		"Record the structured list of risk findings for the current NDA draft. Always call this once after analyzing. Arguments must be in English regardless of the chat language. Pass an empty array if there is nothing to flag.",
	inputSchema: z.object({
		findings: z.array(findingSchema),
	}),
	execute: async ({ findings }) => {
		return { recorded: true as const, count: findings.length };
	},
});

export const formiTools = {
	getDurationInYears,
	recordFindings,
};
