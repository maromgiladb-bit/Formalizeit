"use client";

import { FileText } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

// Read-only presentation of the fixed Standard Mutual NDA (template
// professional_mutual_nda_v1, version 1.0). The legal text below mirrors the
// bundled template that users actually sign; only the [bracketed] items are
// filled in per agreement. Keep this in sync with
// templates/professional_mutual_nda_v1.hbs if the standard text ever changes.
export default function StandardNdaPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={FileText}
				title="The Standard NDA"
				subtitle="Review the standard mutual NDA before you accept or sign"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
				{/* Disclaimer — prominent, above the text */}
				<div className="bg-white rounded-2xl shadow-card border border-amber-200 p-6">
					<p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">
						Please read
					</p>
					<p className="text-sm text-gray-600 leading-relaxed">
						FormalizeIt is not a law firm and does not provide legal advice. This
						page shows the standard mutual NDA for review only. Whether it is
						right for your situation is a decision for you and, if needed, a
						qualified attorney. The legal text below is fixed — when you create an
						NDA you only fill in the deal-specific details shown in [brackets].
					</p>
				</div>

				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<p className="text-teal-700 text-xs font-bold uppercase tracking-widest not-prose mb-2">
						Standard template · Version 1.0
					</p>
					<h2 className="not-prose text-2xl font-bold text-ink mb-6">
						Mutual Confidentiality and Non-Disclosure Agreement
					</h2>

					<p>
						This Confidentiality and Non-Disclosure Agreement (this
						&ldquo;Agreement&rdquo;) is made effective as of{" "}
						<strong>[Effective Date]</strong>, by and between{" "}
						<strong>[Party A Name]</strong>, of <strong>[Party A Address]</strong>,
						and <strong>[Party B Name]</strong>, of{" "}
						<strong>[Party B Address]</strong> to assure the protection and
						preservation of any confidential or proprietary information to be
						disclosed or made available by one party to the other (individually a
						&ldquo;Party&rdquo; and collectively the &ldquo;Parties&rdquo;) in
						connection with a possible business relationship between the Parties
						hereto.
					</p>
					<p>
						A Party, and/or any of its Permitted Entities (as defined below)
						receiving Confidential Information (as defined below) from the other
						Party hereof and/or anyone on its behalf, shall be referred to
						hereinafter as the &ldquo;Receiving Party&rdquo;; and a Party hereof
						and/or anyone on its behalf disclosing Confidential Information to the
						other Party, and/or any of its Permitted Entities, shall be referred to
						hereinafter as the &ldquo;Disclosing Party&rdquo;.
					</p>

					<h3>1. Confidential Information</h3>
					<p>
						<strong>[Information Scope]</strong> disclosed to the Receiving Party,
						whether or not designated by the Disclosing Party as confidential,
						shall be &ldquo;Confidential Information&rdquo; of the Disclosing Party.
						In particular, Confidential Information shall include, but not be
						limited to, the Disclosing Party&apos;s know-how, research, development,
						development methodology, trade secrets, general business operations,
						methods of doing business, pricing, prices paid for materials, charges
						for services and products; financial information, including costs,
						profits and sales; marketing strategies; names of suppliers, personnel,
						customers, clients and potential clients; negotiations or other business
						contacts; form and content of bids, proposals and contracts; the
						Disclosing Party&apos;s internal reporting methods; technical and
						business data documentation and drawings; software programs, however
						embodied; manufacturing processes, inventions, and information obtained
						by or given to the Disclosing Party about or belonging to third parties.
					</p>

					<h3>2. Exclusions</h3>
					<p>
						&ldquo;Confidential Information&rdquo; shall not include information the
						Receiving Party demonstrates: (i) is now, through no act or failure to
						act on the part of the Receiving Party, in the public domain; (ii) is
						authorized by the Disclosing Party, in writing, for disclosure; (iii)
						was in the possession of the Receiving Party prior to receipt from the
						Disclosing Party; (iv) was received from a third party which, to the
						best of the Receiving Party&apos;s knowledge, was not bound at the time
						by a confidentiality undertaking towards the Disclosing Party; (v) was
						developed independently by the Receiving Party without using the
						Confidential Information received from the Disclosing Party; or (vi) is
						required to be disclosed by a court of competent jurisdiction, applicable
						law, or the order, decree, regulation or rule of a government authority
						or securities regulatory authority or recognized stock exchange.
					</p>

					<h3>3. Use of the Confidential Information</h3>
					<p>
						The Receiving Party may use the Confidential Information only to the
						extent required in connection with and furtherance of{" "}
						<strong>[Purpose]</strong> (the &ldquo;Purpose&rdquo;) and for no other
						purpose whatsoever. The Receiving Party shall maintain all Confidential
						Information in trust and confidence and shall not use, publish,
						disseminate or otherwise disclose any Confidential Information to any
						third party without the written consent of the Disclosing Party, and
						shall protect it with at least the same degree of care it uses for its
						own confidential information, but not less than a reasonable degree of
						care. The Receiving Party may disclose Confidential Information only to
						those employees, officers, advisors, agents or Affiliated Companies (the
						&ldquo;Permitted Entities&rdquo;) with a need to know in connection with
						the Purpose, and only after they have been advised of its confidential
						nature and are legally bound by an obligation of confidentiality.
						&ldquo;Affiliated Companies&rdquo; means an entity that controls, is
						controlled by, or is under common control with a Party (at least 50% of
						voting securities or ownership interest). The Receiving Party shall
						promptly notify the Disclosing Party of any unauthorized use or
						disclosure and assist in remedying it.
					</p>

					<h3>4. Ownership of Rights</h3>
					<p>
						All Confidential Information (including all copies) is and shall remain
						the sole and exclusive property of the Disclosing Party and shall be
						destroyed or returned upon the Disclosing Party&apos;s first written
						request. Notwithstanding the foregoing, the Receiving Party may retain
						copies as required for legal purposes (including defending any claim
						related to this Agreement) or for the maintenance of proper professional
						records or regulatory, compliance and/or automated backup archiving
						requirements, provided it continues to protect such information under
						this Agreement.
					</p>

					<h3>5. No Representations; No Rights Granted</h3>
					<p>
						The Receiving Party acknowledges that the Confidential Information is
						provided on an &ldquo;AS-IS&rdquo; basis without any warranty,
						representation or liability on the part of the Disclosing Party; that no
						representation or warranty is made as to its accuracy or completeness;
						that no right or license of any kind is granted other than the right to
						use it strictly in accordance with this Agreement and for the Purpose;
						and that the Receiving Party acts as principal on its own account.
					</p>

					<h3>6. Limited Relationship</h3>
					<p>
						Neither this Agreement nor receipt of Confidential Information obligates
						either Party to disclose information, to enter into any agreement, to
						establish a partnership, joint venture or other commercial relationship,
						or to imply any principal/agent, employee/employer or ownership
						relationship.
					</p>

					<h3>7. Governing Law and Jurisdiction</h3>
					<p>
						This Agreement shall be governed by and construed in accordance with the
						laws of the State of <strong>[Governing Law]</strong>, without giving
						effect to principles of conflicts of law. Any dispute arising out of,
						relating to, or in connection with this Agreement is submitted to the
						sole and exclusive jurisdiction of the competent courts in{" "}
						<strong>[Governing Law]</strong>, and the Parties waive any forum non
						conveniens or similar objection.
					</p>

					<h3>8. Successors</h3>
					<p>
						The Parties&apos; rights and obligations bind and inure to the benefit of
						their respective successors, heirs, executors, administrators and
						permitted assigns. Neither Party shall assign or delegate its obligations
						under this Agreement, in whole or in part, without the prior written
						consent of the other Party.
					</p>

					<h3>9. Severability</h3>
					<p>
						If any provision of this Agreement is held by a court of competent
						jurisdiction to be invalid, illegal or unenforceable, such provision
						shall be modified or deleted so as to make this Agreement, as modified,
						legal and enforceable to the fullest extent permitted under applicable
						law.
					</p>

					<h3>10. Entire Agreement</h3>
					<p>
						This Agreement contains the final, complete and exclusive agreement of
						the Parties relative to its subject matter and supersedes all prior and
						contemporaneous understandings. It may not be changed, modified, amended
						or supplemented except by a written instrument signed by the Parties.
					</p>

					<h3>11. Notices</h3>
					<p>
						All notices shall be in writing and delivered by hand, commercially
						reputable international carrier, fax or e-mail to the address each Party
						provides in the agreement. Notices delivered personally are deemed
						received on delivery; by registered mail, three days after mailing; by
						e-mail, the day following dispatch upon confirmation of receipt; and by
						hand delivery, upon receipt. Ordinary-course-of-business correspondence
						(not relating to a breach, termination, required disclosure or dispute)
						may be delivered by digital/electronic communication without a receipt
						confirmation requirement.
					</p>

					<h3>12. Liability</h3>
					<p>
						The Receiving Party was informed that the Disclosing Party may be
						irreparably harmed if the Receiving Party violates or threatens to
						violate any of its obligations, undertakings or representations under
						this Agreement.
					</p>

					<h3>13. Counterparts</h3>
					<p>
						This Agreement may be executed in counterparts, each of which shall be an
						original, and all of which together shall constitute one and the same
						document. A facsimile or digital copy shall be deemed an original.
					</p>

					<h3>14. Term</h3>
					<p>
						This Agreement shall expire <strong>[Term]</strong> years from the
						Effective Date.
					</p>

					<h3>15. No Third-Party Rights</h3>
					<p>
						This Agreement is for the sole benefit of the Parties and shall not be
						construed as conferring any rights on any third party.
					</p>

					<h3>16. Additional Clauses</h3>
					<p>
						<strong>[Additional Terms — optional]</strong>. This is the single
						optional open clause. For simplicity of reading and signing, we do not
						recommend using it unless necessary.
					</p>

					<hr />
					<p className="text-sm text-gray-500">
						In witness whereof, the Parties execute this Agreement as of the
						Effective Date, each through an authorized signatory (name and title
						recorded at signing). This is version 1.0 of the standard mutual NDA.
						See the{" "}
						<a href="/nda-changelog">NDA Changelog</a> for the history of changes
						and the{" "}
						<a href="/nda-governance">NDA Governance Policy</a> for how the standard
						is maintained.
					</p>
				</div>
			</div>
		</div>
	);
}
