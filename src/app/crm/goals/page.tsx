import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goals } = await supabase.from('goals').select('*, owner:owner_id(full_name)').order('created_at', { ascending: false })
  
  // Calculate actuals
  const { data: orders } = await supabase.from('orders').select('order_value, created_at, owner_id').in('status', ['confirmed', 'in_production', 'dispatched', 'delivered'])
  
  const goalsWithProgress = goals?.map(goal => {
    let actual = 0
    if (goal.metric === 'revenue' && orders) {
      const [startYear, startMonth] = goal.period.split('-')
      const periodStart = new Date(Number(startYear), Number(startMonth) - 1, 1)
      const periodEnd = new Date(Number(startYear), Number(startMonth), 0)
      
      const relevantOrders = orders.filter(o => {
        const d = new Date(o.created_at)
        const isCorrectPeriod = d >= periodStart && d <= periodEnd
        const isCorrectOwner = goal.owner_id ? o.owner_id === goal.owner_id : true
        return isCorrectPeriod && isCorrectOwner
      })
      actual = relevantOrders.reduce((acc, curr) => acc + Number(curr.order_value), 0)
    }
    
    const progress = Math.min(100, Math.max(0, (actual / Number(goal.target)) * 100))
    return { ...goal, actual, progress }
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Goals</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {goalsWithProgress?.map(goal => (
          <div key={goal.id} className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)] shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold">{goal.title}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{goal.owner?.full_name || 'Company Wide'} • {goal.period}</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase">{goal.metric}</span>
            </div>
            
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-[var(--color-text-secondary)]">Progress</span>
              <span className="font-medium">{goal.progress.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className={`h-2.5 rounded-full ${
                goal.progress >= 100 ? 'bg-green-500' :
                goal.progress >= 70 ? 'bg-amber-500' :
                'bg-red-500'
              }`} style={{ width: `${goal.progress}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="text-[var(--color-text-secondary)]">Actual</p>
                <p className="font-semibold">{goal.metric === 'revenue' ? formatCurrency(goal.actual) : goal.actual}</p>
              </div>
              <div className="text-right">
                <p className="text-[var(--color-text-secondary)]">Target</p>
                <p className="font-semibold">{goal.metric === 'revenue' ? formatCurrency(goal.target) : goal.target}</p>
              </div>
            </div>
          </div>
        ))}
        {(!goalsWithProgress || goalsWithProgress.length === 0) && (
          <p className="text-[var(--color-text-secondary)] p-4 col-span-2">No goals defined.</p>
        )}
      </div>
    </div>
  )
}