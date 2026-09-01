import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building2, TrendingUp, ClipboardList, ShoppingBag, IndianRupee, AlertCircle } from 'lucide-react';

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: companies } = await supabase.from('companies').select('id', { count: 'exact' });
  const { data: leads } = await supabase.from('leads').select('id', { count: 'exact' }).not('stage', 'in', '("client","regular_client")');
  const { data: requirements } = await supabase.from('requirements').select('id', { count: 'exact' }).eq('status', 'active');
  const { data: activeOrders } = await supabase.from('orders').select('id', { count: 'exact' }).neq('status', 'delivered');
  
  const { data: revenueData } = await supabase.from('orders').select('order_value').eq('status', 'delivered');
  const totalRevenue = revenueData?.reduce((acc, curr) => acc + (Number(curr.order_value) || 0), 0) || 0;

  const { data: invoiceData } = await supabase.from('invoices').select('amount').in('status', ['issued', 'partially_paid', 'overdue']);
  const totalOutstanding = invoiceData?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

  const { data: activities } = await supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(10);
  
  const today = new Date().toISOString().split('T')[0];
  const { data: delayedOrders } = await supabase.from('orders').select('id', { count: 'exact' }).lt('expected_delivery_date', today).neq('status', 'delivered');
  const { data: overdueInvoices } = await supabase.from('invoices').select('id', { count: 'exact' }).eq('status', 'overdue');
  const { data: sentQuotes } = await supabase.from('quotations').select('id', { count: 'exact' }).eq('status', 'sent');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-[var(--color-primary)]">Dashboard - {user.email?.split('@')[0]} - {today}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-blue-600 mb-2"><Building2 size={20} /> Companies</div>
          <div className="text-3xl font-bold">{companies?.length || 0}</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-orange-600 mb-2"><TrendingUp size={20} /> Active Leads</div>
          <div className="text-3xl font-bold">{leads?.length || 0}</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-purple-600 mb-2"><ClipboardList size={20} /> Open Requirements</div>
          <div className="text-3xl font-bold">{requirements?.length || 0}</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-indigo-600 mb-2"><ShoppingBag size={20} /> Active Orders</div>
          <div className="text-3xl font-bold">{activeOrders?.length || 0}</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-green-600 mb-2"><IndianRupee size={20} /> Total Revenue</div>
          <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-red-600 mb-2"><AlertCircle size={20} /> Outstanding</div>
          <div className="text-3xl font-bold">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <h2 className="font-bold mb-4 text-lg border-b pb-2">What Needs Attention</h2>
          <ul className="space-y-3 mt-2">
            <li><Link href="/crm/orders" className="text-blue-600 hover:underline flex items-center gap-2"><AlertCircle size={16}/> {delayedOrders?.length || 0} delayed orders</Link></li>
            <li><Link href="/crm/invoices" className="text-blue-600 hover:underline flex items-center gap-2"><AlertCircle size={16}/> {overdueInvoices?.length || 0} overdue invoices</Link></li>
            <li><Link href="/crm/quotations" className="text-blue-600 hover:underline flex items-center gap-2"><AlertCircle size={16}/> {sentQuotes?.length || 0} quotations awaiting</Link></li>
            <li><Link href="/crm/leads" className="text-blue-600 hover:underline flex items-center gap-2"><AlertCircle size={16}/> Follow-ups due today</Link></li>
          </ul>
        </div>
        
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
          <h2 className="font-bold mb-4 text-lg border-b pb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Link href="/crm/companies/new" className="px-4 py-3 bg-[var(--color-primary)] text-white text-center rounded-md hover:opacity-90 font-medium">Add Company</Link>
            <Link href="/crm/leads/new" className="px-4 py-3 bg-[var(--color-primary)] text-white text-center rounded-md hover:opacity-90 font-medium">Add Lead</Link>
            <Link href="/crm/requirements" className="px-4 py-3 bg-[var(--color-primary)] text-white text-center rounded-md hover:opacity-90 font-medium">Create Requirement</Link>
            <Link href="/crm/quotations" className="px-4 py-3 bg-[var(--color-primary)] text-white text-center rounded-md hover:opacity-90 font-medium">Create Quotation</Link>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
        <h2 className="font-bold mb-4 text-lg border-b pb-2">Recent Activity</h2>
        <ul className="space-y-3 mt-4">
          {activities?.length ? activities.map(a => (
            <li key={a.id} className="text-sm flex gap-4 border-b border-[var(--color-muted)] pb-2 last:border-0">
              <span className="text-gray-500 min-w-[140px]">{formatDate(a.created_at)}</span>
              <span className="font-medium capitalize w-24">{a.type}</span>
              <span className="text-gray-700">{a.notes}</span>
            </li>
          )) : <p className="text-gray-500">No recent activity found.</p>}
        </ul>
      </div>
    </div>
  );
}