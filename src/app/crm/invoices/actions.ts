'use server'

export async function createInvoice(data: any) { return { success: true } }
export async function recordPayment(invoiceId: string, amount: number) { return { success: true } }
