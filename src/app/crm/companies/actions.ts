'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCompany(data: any) { return { success: true } }
export async function updateCompany(id: string, data: any) { return { success: true } }
export async function deleteCompany(id: string) { return { success: true } }
export async function uploadLogo(id: string, file: File) { return { success: true } }
