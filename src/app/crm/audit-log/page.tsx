import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-normal text-[#1C1917]">Audit Log</h1>
        <p className="text-xs text-[#7A7267] mt-1">Immutable system audit trail tracking user actions, state transitions, and modifications.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DFD5] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <table className="w-full text-xs">
          <thead className="bg-[#FAF7F2] border-b border-[#E5DFD5]">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-[#7A7267]">Action</th>
              <th className="text-left px-5 py-3.5 font-semibold text-[#7A7267]">Entity</th>
              <th className="text-left px-5 py-3.5 font-semibold text-[#7A7267]">Entity ID</th>
              <th className="text-left px-5 py-3.5 font-semibold text-[#7A7267]">User</th>
              <th className="text-left px-5 py-3.5 font-semibold text-[#7A7267]">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E0]">
            {logs?.length ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF7F2]">
                  <td className="px-5 py-3 font-semibold text-[#1C1917] capitalize">{log.action?.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-[#5A5248] capitalize">{log.entity}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-[11px]">{log.entity_id?.slice(0, 8)}...</td>
                  <td className="px-5 py-3 text-[#1C1917]">{(log.profile as any)?.full_name || (log.profile as any)?.email || 'System'}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(log.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  <ShieldCheck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  System audit log is actively monitoring all operations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
