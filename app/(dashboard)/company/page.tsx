import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { CompanyView } from '@/components/company/company-view'

export const dynamic = 'force-dynamic'

export default async function CompanyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  const userId = session.user.id

  const companies = await db.company.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          jobApplications: { where: { deletedAt: null } },
          contacts: true,
        }
      },
      jobApplications: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          column: { select: { name: true, color: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }
    },
    orderBy: { name: 'asc' }
  })

  const companiesData = companies.map((c: any) => ({
    id: c.id,
    name: c.name,
    website: c.website,
    logoUrl: c.logoUrl,
    _count: c._count,
    jobApplications: c.jobApplications.map((j: any) => ({
      id: j.id,
      title: j.title,
      column: j.column ? { name: j.column.name, color: j.column.color ?? '#6b7280' } : null
    }))
  }))

  return <CompanyView initialCompanies={companiesData} />
}
