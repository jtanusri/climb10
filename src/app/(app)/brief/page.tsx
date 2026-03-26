import { getBrief } from '@/lib/db/brief';
import { getDiscoveryRuns } from '@/lib/db/discovery';
import { getAllOrgs } from '@/lib/db/organizations';
import { getContactsByOrg } from '@/lib/db/contacts';
import BriefHub from '@/components/brief/brief-hub';

export const dynamic = 'force-dynamic';

export default function BriefPage() {
  const brief = getBrief();
  const runs = getDiscoveryRuns();
  const orgs = getAllOrgs();

  // Build pipeline leads with contact details
  const pipelineLeads = orgs.map(o => {
    const contacts = getContactsByOrg(o.id);
    const primaryContact = contacts[0];
    return {
      id: o.id,
      name: o.name,
      location: o.location,
      website: o.website,
      estimated_size: o.estimated_size,
      estimated_budget: o.estimated_budget,
      mission_focus: o.mission_focus,
      why_fit: o.why_fit,
      stage: o.stage,
      keyword_category: o.keyword_category || '',
      signal_strength: o.signal_strength || '',
      leadership_signal_tier: o.leadership_signal_tier,
      leadership_signal_evidence: o.leadership_signal_evidence,
      contact_name: primaryContact?.contact_name || '',
      contact_email: primaryContact?.contact_email || '',
      contact_position: primaryContact?.contact_position || '',
      contact_linkedin: primaryContact?.contact_linkedin || '',
      contact_bio: primaryContact?.contact_bio || '',
      review_status: primaryContact?.review_status || 'Pending Review',
      host_producer_notes: primaryContact?.host_producer_notes || '',
    };
  });

  return (
    <BriefHub
      initialBrief={brief}
      pastRuns={runs}
      pipelineLeads={pipelineLeads}
    />
  );
}
