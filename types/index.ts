import { JobApplication, Company, Column, Contact, Note, Event } from '@prisma/client'

// Types de données étendus pour les requêtes complexes
export type JobApplicationWithCompany = JobApplication & {
  company: Company
}

export type KanbanColumn = Column & {
  jobApplications: (JobApplication & {
    company: Company
    tags: Tag[]
    notes: Note[]
    events: Event[]
    contacts: Contact[]
  })[]
}

export type CompanyWithStats = Company & {
  jobApplications: JobApplication[]
  contacts: Contact[]
}

export type Tag = {
  id: string
  name: string
  color: string | null
}
