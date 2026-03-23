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

  // Prepare map orgs with deterministic jitter for co-located markers
  const jitterOffsets = [
    [0, 0], [0.04, 0.03], [-0.03, 0.05], [0.05, -0.04],
    [-0.05, -0.02], [0.02, 0.06], [-0.06, 0.01], [0.01, -0.06],
  ];
  const seenCoords = new Map<string, number>();
  const mapOrgs = orgs
    .filter(o => o.lat && o.lng)
    .map(o => {
      const key = `${o.lat!.toFixed(3)},${o.lng!.toFixed(3)}`;
      const count = seenCoords.get(key) || 0;
      seenCoords.set(key, count + 1);
      const offset = count > 0 ? (jitterOffsets[count % jitterOffsets.length]) : [0, 0];
      return {
        id: o.id,
        name: o.name,
        location: o.location,
        estimated_budget: o.estimated_budget,
        mission_focus: o.mission_focus,
        stage: o.stage,
        keyword_category: o.keyword_category || 'sector',
        signal_strength: o.signal_strength || 'strong',
        leadership_signal_tier: o.leadership_signal_tier,
        lat: o.lat! + offset[0],
        lng: o.lng! + offset[1],
      };
    });

  return (
    <BriefHub
      initialBrief={brief}
      hasBrief={!!brief}
      pastRuns={runs}
      pipelineLeads={pipelineLeads}
      mapOrgs={mapOrgs}
    />
  );
}
