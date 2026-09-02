import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FolderGit2, Plus, Building2 } from 'lucide-react';

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, company:companies(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-normal text-[#1C1917]">Campaigns & Client Projects</h1>
          <p className="text-xs text-[#7A7267] mt-1">Manage bulk corporate gifting programs, employee onboarding kits, and festive projects.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns?.length ? (
          campaigns.map((camp) => (
            <div key={camp.id} className="bg-white rounded-2xl border border-[#E5DFD5] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1C1917]">{camp.title}</h3>
                  <p className="text-xs text-[#7A7267] flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5" /> {(camp.company as any)?.name || 'Client Company'}
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E1EFFE] text-[#1E429F]">
                  {camp.status || 'Active'}
                </span>
              </div>
              {camp.notes && <p className="text-xs text-[#5A5248] line-clamp-2">{camp.notes}</p>}
              {camp.deadline && (
                <p className="text-[11px] text-[#7A7267]">
                  Deadline: <span className="font-semibold text-[#1C1917]">{formatDate(camp.deadline)}</span>
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5DFD5] p-12 text-center text-gray-500">
            <FolderGit2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">Active Campaigns</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Bulk campaigns and client selection portals for Wipro and Nexora are active.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
