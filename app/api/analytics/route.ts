import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Fetch all job applications for this user
    const jobs = await db.jobApplication.findMany({
      where: {
        userId,
        deletedAt: null
      },
      include: {
        column: true,
        documents: true,
        appliedCv: true
      }
    })

    // Fetch all user's columns to have full mapping
    const columns = await db.column.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    })

    // 1. Calculate status distribution
    const statusCounts: Record<string, { count: number; color: string }> = {}
    columns.forEach((col: any) => {
      if (!statusCounts[col.name]) {
        statusCounts[col.name] = { count: 0, color: col.color || '#6b7280' }
      }
    })

    let total = jobs.length
    let appliedCount = 0
    let interviewCount = 0
    let offerCount = 0
    let refusalCount = 0

    jobs.forEach((job: any) => {
      const colName = job.column.name
      if (statusCounts[colName]) {
        statusCounts[colName].count++
      } else {
        statusCounts[colName] = { count: 1, color: job.column.color || '#6b7280' }
      }

      const lowerCol = colName.toLowerCase()
      // Classify for general stats
      if (
        lowerCol.includes('postulé') ||
        lowerCol.includes('applied') ||
        lowerCol.includes('entretien') ||
        lowerCol.includes('interview') ||
        lowerCol.includes('offre') ||
        lowerCol.includes('offer') ||
        lowerCol.includes('refus')
      ) {
        appliedCount++
      }
      if (lowerCol.includes('entretien') || lowerCol.includes('interview')) {
        interviewCount++
      }
      if (lowerCol.includes('offre') || lowerCol.includes('offer')) {
        offerCount++
      }
      if (lowerCol.includes('refus')) {
        refusalCount++
      }
    })

    const byStatus = Object.entries(statusCounts).map(([name, data]: any) => ({
      name,
      value: data.count,
      color: data.color
    }))

    // 2. Response Rate calculation
    // Response = (Interview, Offer, Refusal) / (Total applied)
    const respondedCount = jobs.filter((job: any) => {
      const lowerCol = job.column.name.toLowerCase()
      return (
        lowerCol.includes('entretien') ||
        lowerCol.includes('interview') ||
        lowerCol.includes('offre') ||
        lowerCol.includes('offer') ||
        lowerCol.includes('refus')
      )
    }).length

    const responseRate = appliedCount > 0 
      ? Math.round((respondedCount / appliedCount) * 100) 
      : 0

    // 3. Geographic zones (locations)
    const locationCounts: Record<string, number> = {}
    jobs.forEach((job: any) => {
      let loc = job.location?.trim() || ''
      if (!loc) return
      // Normalize casing (e.g., Paris, Remote, Lyon)
      loc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase()
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    })

    const byLocation = Object.entries(locationCounts)
      .map(([location, count]: any) => ({ location, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10) // top 10 zones

    // 4. CV A/B Testing Stats
    const cvStats: Record<string, { total: number; interviews: number; refusals: number; offers: number }> = {}

    jobs.forEach((job: any) => {
      let cvName = job.appliedCv?.name
      if (!cvName) {
        // Fallback: look for a CV document in the job application itself
        const cvDoc = job.documents.find((d: any) => d.type === 'CV')
        if (cvDoc) {
          cvName = cvDoc.name
        }
      }

      if (!cvName) return // No CV associated

      if (!cvStats[cvName]) {
        cvStats[cvName] = { total: 0, interviews: 0, refusals: 0, offers: 0 }
      }

      cvStats[cvName].total++
      const lowerCol = job.column.name.toLowerCase()
      if (lowerCol.includes('entretien') || lowerCol.includes('interview')) {
        cvStats[cvName].interviews++
      }
      if (lowerCol.includes('refus')) {
        cvStats[cvName].refusals++
      }
      if (lowerCol.includes('offre') || lowerCol.includes('offer')) {
        cvStats[cvName].offers++
      }
    })

    const byCv = Object.entries(cvStats).map(([name, data]: any) => {
      const successRate = data.total > 0 
        ? Math.round((data.interviews / data.total) * 100) 
        : 0
      return {
        name,
        total: data.total,
        interviews: data.interviews,
        refusals: data.refusals,
        offers: data.offers,
        successRate
      }
    }).sort((a: any, b: any) => b.successRate - a.successRate)

    // 5. Activity over time (last 6 months)
    const monthNames = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
    const activityCounts: Record<string, { key: string; index: number; applications: number; interviews: number }> = {}

    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = monthNames[d.getMonth()]
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      activityCounts[key] = {
        key: monthLabel,
        index: d.getFullYear() * 12 + d.getMonth(),
        applications: 0,
        interviews: 0
      }
    }

    jobs.forEach((job: any) => {
      const date = job.appliedAt || job.createdAt
      if (!date) return
      const d = new Date(date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = monthNames[d.getMonth()]
      
      const lowerCol = job.column.name.toLowerCase()
      const isInterview = lowerCol.includes('entretien') || lowerCol.includes('interview')

      if (activityCounts[key]) {
        activityCounts[key].applications++
        if (isInterview) {
          activityCounts[key].interviews++
        }
      } else {
        // Outside the 6 month sliding window, we only populate if it exists in activityCounts
      }
    })

    const byMonth = Object.values(activityCounts)
      .sort((a: any, b: any) => a.index - b.index)
      .map((item: any) => ({
        month: item.key,
        applications: item.applications,
        interviews: item.interviews
      }))

    return NextResponse.json({
      success: true,
      stats: {
        total,
        applied: appliedCount,
        interviews: interviewCount,
        offers: offerCount,
        refusals: refusalCount,
        responseRate,
        byStatus,
        byLocation,
        byCv,
        byMonth
      }
    })
  } catch (err) {
    console.error('API Analytics Error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la récupération des statistiques.' } },
      { status: 500 }
    )
  }
}
