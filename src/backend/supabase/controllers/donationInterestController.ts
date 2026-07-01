import { supabase } from '../client';

type DbRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  submitted_at: string;
  status: string;
};

export interface DonationInterestRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: 'pending' | 'reviewed';
}

function mapRow(r: DbRow): DonationInterestRecord {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    submittedAt: r.submitted_at,
    status: r.status as 'pending' | 'reviewed',
  };
}

export async function submitDonationInterest(name: string, email: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('donation_interests')
    .insert({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  if (error) throw error;
}

export async function fetchDonationInterests(): Promise<DonationInterestRecord[]> {
  const { data, error } = await supabase
    .from('donation_interests')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function updateDonationInterestStatus(id: string, status: 'pending' | 'reviewed'): Promise<void> {
  const { error } = await supabase
    .from('donation_interests')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDonationInterest(id: string): Promise<void> {
  const { error } = await supabase
    .from('donation_interests')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
