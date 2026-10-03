import type { Clinic } from '@/domain/types';

export interface OwnershipView {
  lead: string;
  rows: { term: string; detail: string }[];
}

/** The statement text and the Owner, Group and Registered company rows, from clinic config. */
export function ownershipView(clinic: Clinic): OwnershipView {
  const owner = clinic.owner;
  if (!owner) return { lead: 'Ask us who owns this practice and we will tell you.', rows: [] };
  const rows = [{ term: 'Owner', detail: owner.name }];
  if (owner.group) rows.push({ term: 'Group', detail: owner.group });
  rows.push({ term: 'Registered company', detail: `${clinic.legalName}, company number ${clinic.legalId}` });
  const lead = owner.independent
    ? `${clinic.name} is independently owned. It is not part of a corporate veterinary group.`
    : `${clinic.name} is part of ${owner.group ?? 'a veterinary group'}.`;
  return { lead, rows };
}
