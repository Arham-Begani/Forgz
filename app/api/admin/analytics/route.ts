// app/api/admin/analytics/route.ts
import { requireAdmin, isAuthError } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminDb() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
    if (!serviceRole) {
        // Fallback: use the anon key with service-level access
        // This works if RLS policies allow the admin user to read all rows,
        // or if RLS is not enabled on these tables
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!anonKey) throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
        return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    }
    return createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
    try {
        await requireAdmin()
        const db = getAdminDb()

        // Run all queries in parallel using the admin client (bypasses RLS)
        const [
            usersRes,
            projectsRes,
            venturesRes,
            conversationsRes,
            cohortsRes,
            subscriptionsRes,
            paymentsRes,
            usageRes,
            creditLedgerRes,
            investorKitsRes,
        ] = await Promise.all([
            db.from('users').select('id, email, name, plan, created_at'),
            db.from('projects').select('id, user_id, name, status, created_at'),
            db.from('ventures').select('id, user_id, project_id, name, created_at'),
            db.from('conversations').select('id, venture_id, module_id, status, created_at'),
            db.from('cohorts').select('id, user_id, status, created_at'),
            db.from('subscriptions').select('id, user_id, plan_slug, billing_period, status, credits_per_cycle, current_period_end, created_at'),
            db.from('payments').select('id, user_id, kind, plan_slug, topup_slug, amount_inr, status, created_at'),
            db.from('usage_ledger').select('id, user_id, module_id, credits, plan_slug, created_at'),
            db.from('credit_ledger').select('id, user_id, kind, credits, created_at'),
            db.from('investor_kits').select('id, venture_id, user_id, views, is_active, created_at'),
        ])

        const users = usersRes.data ?? []
        const projects = projectsRes.data ?? []
        const ventures = venturesRes.data ?? []
        const conversations = conversationsRes.data ?? []
        const cohorts = cohortsRes.data ?? []
        const subscriptions = subscriptionsRes.data ?? []
        const payments = paymentsRes.data ?? []
        const usage = usageRes.data ?? []
        const creditLedger = creditLedgerRes.data ?? []
        const investorKits = investorKitsRes.data ?? []

        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // ── Platform Overview ────────────────────────────────────────────
        const totalUsers = users.length
        const activeUsers7d = new Set(
            conversations.filter(c => new Date(c.created_at) >= sevenDaysAgo).map(c => {
                const v = ventures.find(v => v.id === c.venture_id)
                return v?.user_id
            }).filter(Boolean)
        ).size
        const activeUsers30d = new Set(
            conversations.filter(c => new Date(c.created_at) >= thirtyDaysAgo).map(c => {
                const v = ventures.find(v => v.id === c.venture_id)
                return v?.user_id
            }).filter(Boolean)
        ).size
        const newUsers7d = users.filter(u => new Date(u.created_at) >= sevenDaysAgo).length
        const newUsers30d = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length

        const totalVentures = ventures.length
        const totalProjects = projects.length
        const totalConversations = conversations.length
        const completedConversations = conversations.filter(c => c.status === 'complete').length
        const failedConversations = conversations.filter(c => c.status === 'failed').length
        const successRate = totalConversations > 0 ? Math.round((completedConversations / totalConversations) * 100) : 0
        const totalCohorts = cohorts.length
        const totalInvestorKitViews = investorKits.reduce((sum, k) => sum + (k.views || 0), 0)

        // ── Revenue ──────────────────────────────────────────────────────
        const capturedPayments = payments.filter(p => p.status === 'captured')
        const totalRevenue = capturedPayments.reduce((s, p) => s + (p.amount_inr || 0), 0)
        const revenue7d = capturedPayments
            .filter(p => new Date(p.created_at) >= sevenDaysAgo)
            .reduce((s, p) => s + (p.amount_inr || 0), 0)
        const revenue30d = capturedPayments
            .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
            .reduce((s, p) => s + (p.amount_inr || 0), 0)
        const paymentSuccessRate = payments.length > 0
            ? Math.round((capturedPayments.length / payments.length) * 100)
            : 0

        // ── Plan Distribution ────────────────────────────────────────────
        const planDistribution: Record<string, number> = {}
        for (const u of users) {
            const plan = u.plan || 'free'
            planDistribution[plan] = (planDistribution[plan] || 0) + 1
        }

        // Active subscriptions by plan
        const activeSubscriptions: Record<string, number> = {}
        for (const s of subscriptions.filter(s => s.status === 'active')) {
            activeSubscriptions[s.plan_slug] = (activeSubscriptions[s.plan_slug] || 0) + 1
        }

        // ── Module Usage (platform-wide) ─────────────────────────────────
        const moduleUsage: Record<string, { total: number; complete: number; failed: number; credits: number }> = {}
        for (const c of conversations) {
            if (!moduleUsage[c.module_id]) {
                moduleUsage[c.module_id] = { total: 0, complete: 0, failed: 0, credits: 0 }
            }
            moduleUsage[c.module_id].total++
            if (c.status === 'complete') moduleUsage[c.module_id].complete++
            if (c.status === 'failed') moduleUsage[c.module_id].failed++
        }
        for (const u of usage) {
            if (moduleUsage[u.module_id]) {
                moduleUsage[u.module_id].credits += u.credits || 0
            }
        }

        // ── Daily Activity (30 days) ─────────────────────────────────────
        const dailyActivity: { date: string; runs: number; users: number; credits: number; signups: number }[] = []
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            const dateStr = d.toISOString().slice(0, 10)
            const dayConvs = conversations.filter(c => c.created_at?.slice(0, 10) === dateStr)
            const dayUsers = new Set(dayConvs.map(c => {
                const v = ventures.find(v => v.id === c.venture_id)
                return v?.user_id
            }).filter(Boolean)).size
            const dayCredits = usage.filter(u => u.created_at?.slice(0, 10) === dateStr).reduce((s, u) => s + (u.credits || 0), 0)
            const daySignups = users.filter(u => u.created_at?.slice(0, 10) === dateStr).length
            dailyActivity.push({ date: dateStr, runs: dayConvs.length, users: dayUsers, credits: dayCredits, signups: daySignups })
        }

        // ── Top Users ────────────────────────────────────────────────────
        const userActivity: Record<string, { runs: number; credits: number; ventures: number }> = {}
        for (const v of ventures) {
            if (!userActivity[v.user_id]) userActivity[v.user_id] = { runs: 0, credits: 0, ventures: 0 }
            userActivity[v.user_id].ventures++
        }
        for (const c of conversations) {
            const v = ventures.find(v => v.id === c.venture_id)
            if (v && userActivity[v.user_id]) {
                userActivity[v.user_id].runs++
            }
        }
        for (const u of usage) {
            if (userActivity[u.user_id]) {
                userActivity[u.user_id].credits += u.credits || 0
            }
        }

        const topUsers = users
            .map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                plan: u.plan || 'free',
                createdAt: u.created_at,
                ...(userActivity[u.id] || { runs: 0, credits: 0, ventures: 0 }),
            }))
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 20)

        // ── Credit Economy ───────────────────────────────────────────────
        const totalCreditsGranted = creditLedger.filter(l => l.credits > 0).reduce((s, l) => s + l.credits, 0)
        const totalCreditsSpent = Math.abs(creditLedger.filter(l => l.credits < 0).reduce((s, l) => s + l.credits, 0))
        const creditsByKind: Record<string, number> = {}
        for (const l of creditLedger) {
            creditsByKind[l.kind] = (creditsByKind[l.kind] || 0) + l.credits
        }

        // ── Weekly Comparison ────────────────────────────────────────────
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        const thisWeekConvs = conversations.filter(c => new Date(c.created_at) >= sevenDaysAgo)
        const lastWeekConvs = conversations.filter(c => {
            const d = new Date(c.created_at)
            return d >= fourteenDaysAgo && d < sevenDaysAgo
        })
        const thisWeekSignups = users.filter(u => new Date(u.created_at) >= sevenDaysAgo).length
        const lastWeekSignups = users.filter(u => {
            const d = new Date(u.created_at)
            return d >= fourteenDaysAgo && d < sevenDaysAgo
        }).length

        // ── Recent Payments ──────────────────────────────────────────────
        const recentPaymentsList = payments
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15)
            .map(p => {
                const user = users.find(u => u.id === p.user_id)
                return {
                    kind: p.kind,
                    planSlug: p.plan_slug,
                    topupSlug: p.topup_slug,
                    amount: p.amount_inr,
                    status: p.status,
                    userEmail: user?.email || 'unknown',
                    createdAt: p.created_at,
                }
            })

        return NextResponse.json({
            platform: {
                totalUsers,
                activeUsers7d,
                activeUsers30d,
                newUsers7d,
                newUsers30d,
                totalVentures,
                totalProjects,
                totalConversations,
                completedConversations,
                failedConversations,
                successRate,
                totalCohorts,
                totalInvestorKitViews,
            },
            revenue: {
                totalRevenue,
                revenue7d,
                revenue30d,
                paymentSuccessRate,
                totalPayments: payments.length,
                capturedPayments: capturedPayments.length,
            },
            planDistribution,
            activeSubscriptions,
            moduleUsage,
            dailyActivity,
            topUsers,
            creditEconomy: {
                totalGranted: totalCreditsGranted,
                totalSpent: totalCreditsSpent,
                netBalance: totalCreditsGranted - totalCreditsSpent,
                byKind: creditsByKind,
            },
            weeklyComparison: {
                thisWeek: { runs: thisWeekConvs.length, signups: thisWeekSignups },
                lastWeek: { runs: lastWeekConvs.length, signups: lastWeekSignups },
                runsDelta: thisWeekConvs.length - lastWeekConvs.length,
                signupsDelta: thisWeekSignups - lastWeekSignups,
            },
            recentPayments: recentPaymentsList,
        })
    } catch (e) {
        if (isAuthError(e)) return (e as any).toResponse()
        console.error('Admin analytics error:', e)
        return NextResponse.json({ error: 'Failed to load admin analytics' }, { status: 500 })
    }
}
