import { createClient } from "@/lib/supabase/server";
import { requirePath } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function QuotationPrint({ params }: { params: Promise<{ id: string }> }) {
  await requirePath("/quotations");
  const { id } = await params;
  const supabase = await createClient();
  const { data: q } = await supabase.from("quotations").select("*, company:companies(name, address, city), contact:contacts(full_name, email)").eq("id", id).single();
  const { data: items } = await supabase.from("quotation_items").select("*").eq("quotation_id", id);
  if (!q) return <p>Not found</p>;
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
      <div className="flex justify-between border-b border-neutral-300 pb-4">
        <div>
          <div className="font-heading text-3xl">Oaklane</div>
          <div className="text-sm text-neutral-600">Corporate gifting quotation</div>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium">{q.quotation_number}</div>
          <div>Valid until {formatDate(q.valid_until)}</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-neutral-500">Prepared for</div>
          <div className="font-medium">{(q.company as { name?: string }).name}</div>
          <div>{(q.contact as { full_name?: string } | null)?.full_name}</div>
          <div>{(q.company as { address?: string }).address}</div>
        </div>
        <div>
          <div className="text-neutral-500">From</div>
          <div className="font-medium">Oaklane Gift Operations</div>
          <div>Mumbai, India</div>
        </div>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead><tr className="border-b text-left"><th className="py-2">Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
        <tbody>
          {(items ?? []).map((i) => (
            <tr key={i.id} className="border-b border-neutral-200">
              <td className="py-2">{i.description}</td>
              <td>{i.quantity}</td>
              <td>{formatMoney(i.unit_price)}</td>
              <td>{formatMoney(Number(i.quantity) * Number(i.unit_price))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(q.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>{formatMoney(q.discount_amount)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(q.tax_amount)}</span></div>
        <div className="flex justify-between font-medium"><span>Total</span><span>{formatMoney(q.total)}</span></div>
      </div>
      {q.notes ? <p className="mt-8 text-sm">{q.notes}</p> : null}
      <p className="mt-10 text-xs text-neutral-500">This quotation is not a tax invoice. Print or save as PDF from your browser.</p>
    </div>
  );
}
