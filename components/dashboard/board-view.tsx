'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { 
  Plus, 
  Search, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Link as LinkIcon,
  Link2,
  Loader2,
  X,
  Mail,
  Phone,
  User,
  Trash2,
  Save,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  Tag,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { KanbanColumn } from '@/types'

// Type local de candidature pour le typage interne du state
type ClientJob = KanbanColumn['jobApplications'][number]

interface BoardViewProps {
  initialColumns: KanbanColumn[]
  userId: string
  boardId?: string
  boardName?: string
  boardEmoji?: string
  boards?: { id: string; name: string; emoji: string | null }[]
}

export function BoardView({ initialColumns, userId, boardId, boardName, boardEmoji, boards = [] }: BoardViewProps) {
  const router = useRouter()
  
  // États de données et filtres
  const [columns, setColumns] = React.useState<KanbanColumn[]>(initialColumns)
  const [searchQuery, setSearchQuery] = React.useState('')
  
  // États pour le formulaire d'importation de liens
  const [showImportForm, setShowImportForm] = React.useState(false)
  const [importUrl, setImportUrl] = React.useState('')
  const [importSource, setImportSource] = React.useState<'indeed' | 'hellowork' | 'linkedin'>('indeed')
  const [isImporting, setIsImporting] = React.useState(false)

  // États pour l'import de fichier Excel / CSV
  const [showExcelImport, setShowExcelImport] = React.useState(false)
  const [fileData, setFileData] = React.useState<any[][]>([])
  const [hasHeaders, setHasHeaders] = React.useState(true)
  const [startRow, setStartRow] = React.useState(2)
  const [endRow, setEndRow] = React.useState(0)
  const [columnFields, setColumnFields] = React.useState<string[]>([])
  const [showMappingStep, setShowMappingStep] = React.useState(false)
  const [isImportingFile, setIsImportingFile] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState(0)
  const [importTotal, setImportTotal] = React.useState(0)
  const [importErrors, setImportErrors] = React.useState<string[]>([])

  // États pour la modale de détails / édition
  const [selectedJob, setSelectedJob] = React.useState<ClientJob | null>(null)
  const [editTitle, setEditTitle] = React.useState('')
  const [editLocation, setEditLocation] = React.useState('')
  const [editSalary, setEditSalary] = React.useState('')
  const [editUrl, setEditUrl] = React.useState('')
  const [editColumnId, setEditColumnId] = React.useState('')
  
  // Recruteur / RH
  const [editContactName, setEditContactName] = React.useState('')
  const [editContactEmail, setEditContactEmail] = React.useState('')
  const [editContactPhone, setEditContactPhone] = React.useState('')

  // Bloc-notes
  const [newNote, setNewNote] = React.useState('')
  const [isSavingNote, setIsSavingNote] = React.useState(false)
  const [isSavingJob, setIsSavingJob] = React.useState(false)
  const [isArchiving, setIsArchiving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Gestion des colonnes (étapes)
  const [showColumnsModal, setShowColumnsModal] = React.useState(false)
  const [newColumnName, setNewColumnName] = React.useState('')
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = React.useState('')

  // Gestion des étiquettes (tags)
  const [selectedTagFilter, setSelectedTagFilter] = React.useState('')
  const [editTags, setEditTags] = React.useState<string[]>([])
  const [newTagInput, setNewTagInput] = React.useState('')

  // Date d'envoi de la candidature
  const [editAppliedAt, setEditAppliedAt] = React.useState('')

  // Onglet actif pour la modale de détails
  const [activeTab, setActiveTab] = React.useState<'info' | 'notes' | 'contacts' | 'documents' | 'history'>('info')

  // Document à prévisualiser dans l'onglet Documents
  const [previewDoc, setPreviewDoc] = React.useState<{ id: string; name: string; url: string; type: string } | null>(null)

  // Sélecteur de board et modal de création de board
  const [showBoardDropdown, setShowBoardDropdown] = React.useState(false)
  const [showCreateBoardModal, setShowCreateBoardModal] = React.useState(false)
  const [newBoardName, setNewBoardName] = React.useState('')
  const [newBoardEmoji, setNewBoardEmoji] = React.useState('🚀')
  const [isCreatingBoard, setIsCreatingBoard] = React.useState(false)

  // Ajout rapide d'offres dans les colonnes
  const [activeQuickAddColId, setActiveQuickAddColId] = React.useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = React.useState('')
  const [quickAddCompany, setQuickAddCompany] = React.useState('')
  const [isQuickAdding, setIsQuickAdding] = React.useState(false)

  // Synchronisation de l'état local quand le parent (Server Component) se rafraîchit
  React.useEffect(() => {
    setColumns(initialColumns)
    
    // Si la modale est ouverte, on rafraîchit l'objet sélectionné pour avoir les nouvelles notes
    if (selectedJob) {
      const refreshedJob = initialColumns
        .flatMap(c => c.jobApplications)
        .find(j => j.id === selectedJob.id)
      if (refreshedJob) {
        setSelectedJob(refreshedJob)
      }
    }
  }, [initialColumns])

  // Chargement des données dans le formulaire d'édition au clic sur une carte
  const handleOpenModal = (job: ClientJob) => {
    setActiveTab('info')
    setPreviewDoc(null)
    setSelectedJob(job)
    setEditTitle(job.title)
    setEditLocation(job.location || '')
    setEditSalary(job.salary || '')
    setEditUrl(job.url || '')
    setEditColumnId(job.columnId)
    const primaryContact = job.contacts?.[0] || null
    setEditContactName(primaryContact?.name || '')
    setEditContactEmail(primaryContact?.email || '')
    setEditContactPhone(primaryContact?.phone || '')
    setNewNote('')
    setEditTags(job.tags?.map(t => t.name) || [])
    setNewTagInput('')
    setEditAppliedAt(job.appliedAt ? new Date(job.appliedAt).toISOString().split('T')[0] : '')
  }

  // Extrait tous les tags uniques pour le filtrage
  const allUniqueTags = React.useMemo(() => {
    const tags = new Set<string>()
    columns.forEach(col => {
      col.jobApplications.forEach(job => {
        job.tags?.forEach(tag => {
          if (tag.name) tags.add(tag.name)
        })
      })
    })
    return Array.from(tags)
  }, [columns])

  // Filtrage des colonnes selon la recherche et le tag sélectionné
  const filteredColumns = React.useMemo(() => {
    let result = columns
    
    if (selectedTagFilter) {
      result = result.map(col => ({
        ...col,
        jobApplications: col.jobApplications.filter(job => 
          job.tags?.some(tag => tag.name.toLowerCase() === selectedTagFilter.toLowerCase())
        )
      }))
    }

    if (!searchQuery.trim()) return result

    const query = searchQuery.toLowerCase()
    return result.map(col => ({
      ...col,
      jobApplications: col.jobApplications.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.name.toLowerCase().includes(query) ||
        (job.location && job.location.toLowerCase().includes(query)) ||
        (job.source && job.source.toLowerCase().includes(query)) ||
        job.tags?.some(tag => tag.name.toLowerCase().includes(query))
      )
    }))
  }, [columns, searchQuery, selectedTagFilter])

  // Statistiques globales du Kanban
  const stats = React.useMemo(() => {
    const allJobs = columns.flatMap(col => col.jobApplications)
    const totalJobs = allJobs.length
    
    const interviewCol = columns.find(col => col.name.toLowerCase().includes('entretien'))
    const interviewCount = interviewCol ? interviewCol.jobApplications.length : 0

    const toApplyCol = columns.find(col => col.name.toLowerCase().includes('à postuler'))
    const toApplyCount = toApplyCol ? toApplyCol.jobApplications.length : 0
    const appliedOrMoreCount = totalJobs - toApplyCount
    const respondedCount = allJobs.filter(job => {
      const colName = columns.find(c => c.id === job.columnId)?.name.toLowerCase() || ''
      return colName.includes('entretien') || colName.includes('offre') || colName.includes('refusé')
    }).length
    
    const responseRate = appliedOrMoreCount > 0 
      ? Math.round((respondedCount / appliedOrMoreCount) * 100) 
      : 0

    return [
      { title: "Total Candidatures", value: totalJobs.toString(), icon: Briefcase, color: "text-primary" },
      { title: "Entretiens Planifiés", value: interviewCount.toString(), icon: Calendar, color: "text-amber-500", highlight: interviewCount > 0 },
      { title: "Taux de Réponse", value: `${responseRate}%`, icon: TrendingUp, color: "text-emerald-500" },
      { title: "Temps de réponse moyen", value: "N/A", icon: Clock, color: "text-primary" }
    ]
  }, [columns])

  // Gestionnaires pour les documents
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, type: 'CV' | 'COVER_LETTER' | 'OTHER') => {
    const file = e.target.files?.[0]
    if (!file || !selectedJob) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/documents`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedJob(prev => {
          if (!prev) return null
          return {
            ...prev,
            documents: [...(prev.documents || []), data.document]
          }
        })
        router.refresh()
      } else {
        alert("Erreur lors du téléversement du fichier.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors du téléversement.")
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSelectedJob(prev => {
          if (!prev) return null
          return {
            ...prev,
            documents: prev.documents.filter(d => d.id !== docId)
          }
        })
        router.refresh()
      } else {
        alert("Erreur lors de la suppression.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Gestionnaires pour les étapes (colonnes)
  const handleMoveColumn = async (columnId: string, direction: 'left' | 'right') => {
    const colIndex = columns.findIndex(c => c.id === columnId)
    if (colIndex === -1) return
    
    const currentOrder = columns[colIndex].order
    const newOrder = direction === 'left' ? currentOrder - 1 : currentOrder + 1
    
    if (newOrder < 1 || newOrder > columns.length) return
    
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      })
      
      if (res.ok) {
        router.refresh()
      } else {
        alert("Erreur lors du déplacement de la colonne.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnName.trim() || !boardId) return
    
    try {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColumnName, color: '#6b7280' })
      })
      
      if (res.ok) {
        setNewColumnName('')
        router.refresh()
      } else {
        alert("Erreur lors de la création de la colonne.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    const col = columns.find(c => c.id === columnId)
    if (!col) return
    
    if (col.jobApplications.length > 0) {
      if (!confirm(`Attention: cette colonne contient ${col.jobApplications.length} candidature(s). La supprimer supprimera également toutes ces candidatures définitivement ! Voulez-vous continuer ?`)) {
        return
      }
    } else {
      if (!confirm("Voulez-vous vraiment supprimer cette colonne ?")) return
    }
    
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        router.refresh()
      } else {
        alert("Erreur lors de la suppression de la colonne.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRenameColumn = async (columnId: string, newName: string) => {
    if (!newName.trim()) return
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      if (res.ok) {
        setEditingColumnId(null)
        router.refresh()
      } else {
        alert("Erreur lors du renommage de la colonne.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ----------------------------------------------------
  // GESTION DU DRAG & DROP NATIVE HTML5
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('text/plain', jobId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    const jobId = e.dataTransfer.getData('text/plain')
    if (!jobId) return

    // 1. Recherche de la candidature et de sa colonne actuelle
    let sourceColIdx = -1
    let jobIdx = -1
    let jobToMove: ClientJob | null = null

    for (let i = 0; i < columns.length; i++) {
      const idx = columns[i].jobApplications.findIndex(j => j.id === jobId)
      if (idx !== -1) {
        sourceColIdx = i
        jobIdx = idx
        jobToMove = columns[i].jobApplications[idx]
        break
      }
    }

    if (!jobToMove || columns[sourceColIdx].id === targetColumnId) return

    // 2. Mise à jour optimiste de l'état local pour fluidité de l'UI
    const updatedColumns = [...columns]
    
    // Retrait de la colonne source
    updatedColumns[sourceColIdx].jobApplications.splice(jobIdx, 1)
    
    // Ajout dans la colonne cible
    const targetColIdx = updatedColumns.findIndex(c => c.id === targetColumnId)
    if (targetColIdx !== -1) {
      const movedJob = { ...jobToMove, columnId: targetColumnId }
      updatedColumns[targetColIdx].jobApplications.push(movedJob)
    }

    setColumns(updatedColumns)

    // 3. Persistance en base de données
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: targetColumnId })
      })

      if (!res.ok) {
        // En cas d'échec, on restaure l'état d'origine
        setColumns(initialColumns)
        alert('Erreur lors du déplacement de l\'offre.')
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setColumns(initialColumns)
    }
  }

  // ----------------------------------------------------
  // OPERATIONS D'IMPORT DE FICHIER (EXCEL / CSV)
  // ----------------------------------------------------
  const getColLetter = (index: number) => {
    let temp = index
    let letter = ''
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter
      temp = Math.floor(temp / 26) - 1
    }
    return letter
  }

  const handleHeadersToggle = (checked: boolean) => {
    setHasHeaders(checked)
    if (checked) {
      setStartRow(2)
      if (fileData.length > 0) {
        const firstRow = fileData[0]
        const mappings = firstRow.map(cell => {
          const text = String(cell).toLowerCase()
          if (/titre|poste|job|title|role/i.test(text)) return 'title'
          if (/entreprise|company|societe|employeur/i.test(text)) return 'company'
          if (/lieu|location|ville|adresse|city/i.test(text)) return 'location'
          if (/salaire|remuneration|salary|compensation/i.test(text)) return 'salary'
          if (/lien|url|link|annonce/i.test(text)) return 'url'
          if (/description|desc|details/i.test(text)) return 'description'
          if (/source/i.test(text)) return 'source'
          return 'ignore'
        })
        setColumnFields(mappings)
      }
    } else {
      setStartRow(1)
      if (fileData.length > 0) {
        setColumnFields(new Array(fileData[0].length).fill('ignore'))
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        // Parse as array of arrays (header: 1)
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' })

        if (rawRows.length === 0) {
          alert("Le fichier Excel ou CSV est vide.")
          return
        }

        setFileData(rawRows)
        setEndRow(rawRows.length)
        setStartRow(2)
        setHasHeaders(true)

        // Détecte automatiquement les correspondances sur la première ligne
        const firstRow = rawRows[0] || []
        const mappings = firstRow.map(cell => {
          const text = String(cell).toLowerCase()
          if (/titre|poste|job|title|role/i.test(text)) return 'title'
          if (/entreprise|company|societe|employeur/i.test(text)) return 'company'
          if (/lieu|location|ville|adresse|city/i.test(text)) return 'location'
          if (/salaire|remuneration|salary|compensation/i.test(text)) return 'salary'
          if (/lien|url|link|annonce/i.test(text)) return 'url'
          if (/description|desc|details/i.test(text)) return 'description'
          if (/source/i.test(text)) return 'source'
          return 'ignore'
        })
        setColumnFields(mappings)
        setShowMappingStep(true)
      } catch (err) {
        console.error(err)
        alert("Erreur lors de la lecture du fichier.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleStartImport = async () => {
    const titleIdx = columnFields.indexOf('title')
    const companyIdx = columnFields.indexOf('company')

    if (titleIdx === -1 || companyIdx === -1) {
      alert("L'intitulé du poste et l'entreprise sont requis pour l'import.")
      return
    }

    const startIdx = startRow - 1
    const endIdx = Math.min(endRow, fileData.length)
    const rowsToImport = fileData.slice(startIdx, endIdx)

    setIsImportingFile(true)
    setImportProgress(0)
    setImportTotal(rowsToImport.length)
    setImportErrors([])

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i]
      setImportProgress(i + 1)

      let titleVal = ''
      let companyVal = ''
      let locationVal = ''
      let salaryVal = ''
      let urlVal = ''
      let descriptionVal = ''
      let sourceVal = ''

      columnFields.forEach((field, colIdx) => {
        const val = String(row[colIdx] || '').trim()
        if (field === 'title') titleVal = val
        if (field === 'company') companyVal = val
        if (field === 'location') locationVal = val
        if (field === 'salary') salaryVal = val
        if (field === 'url') urlVal = val
        if (field === 'description') descriptionVal = val
        if (field === 'source') sourceVal = val
      })

      if (!titleVal || !companyVal) {
        continue
      }

      const jobData = {
        title: titleVal,
        companyName: companyVal,
        location: locationVal,
        salary: salaryVal,
        url: urlVal,
        description: descriptionVal,
        source: sourceVal || 'Fichier Excel'
      }

      let scraped = false
      if (jobData.url) {
        let siteType: 'indeed' | 'hellowork' | 'linkedin' | null = null
        if (jobData.url.includes('indeed.')) siteType = 'indeed'
        else if (jobData.url.includes('hellowork.com')) siteType = 'hellowork'
        else if (jobData.url.includes('linkedin.com')) siteType = 'linkedin'

        if (siteType) {
          try {
            const scrapeRes = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: jobData.url, siteType })
            })

            if (scrapeRes.ok) {
              const { jobData: scrapedData } = await scrapeRes.json()
              jobData.title = scrapedData.title || jobData.title
              jobData.companyName = scrapedData.companyName || jobData.companyName
              jobData.location = scrapedData.location || jobData.location
              jobData.description = scrapedData.description || jobData.description
              jobData.salary = scrapedData.salary || jobData.salary
              jobData.source = scrapedData.source || jobData.source
              scraped = true
            }
          } catch (e) {
            console.error('Scraping error during import:', e)
          }
        }
      }

      try {
        const saveRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: jobData.title,
            companyName: jobData.companyName,
            location: jobData.location || null,
            description: jobData.description || null,
            url: jobData.url || null,
            salary: jobData.salary || null,
            source: jobData.source || (scraped ? 'Import Excel (Scrapé)' : 'Import Excel')
          })
        })

        if (!saveRes.ok) {
          throw new Error('Save error')
        }
      } catch (err) {
        console.error(err)
        setImportErrors(prev => [...prev, `Ligne ${startIdx + i + 1} (${titleVal}) : Échec d'importation.`])
      }
    }

    setIsImportingFile(false)
    setShowExcelImport(false)
    setShowMappingStep(false)
    setFileData([])
    router.refresh()
  }

  // ----------------------------------------------------
  // OPERATIONS D'IMPORT & DE MODIFICATION
  // ----------------------------------------------------
  const handleImportLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl.trim()) return

    setIsImporting(true)
    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, siteType: importSource })
      })

      if (!scrapeRes.ok) throw new Error('Erreur de scraping')
      const { jobData } = await scrapeRes.json()

      const saveRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobData.title,
          companyName: jobData.companyName,
          location: jobData.location,
          description: jobData.description,
          url: jobData.url,
          salary: jobData.salary,
          source: jobData.source
        })
      })

      if (saveRes.ok) {
        setImportUrl('')
        setShowImportForm(false)
        router.refresh()
      } else {
        alert("Erreur lors de l'enregistrement de l'offre.")
      }
    } catch (err) {
      console.error(err)
      alert("Une erreur est survenue lors de l'importation de l'offre.")
    } finally {
      setIsImporting(false)
    }
  }

  // Sauvegarde des modifications globales de la carte
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return

    setIsSavingJob(true)
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          location: editLocation || null,
          salary: editSalary || null,
          url: editUrl || null,
          columnId: editColumnId,
          contactName: editContactName || null,
          contactEmail: editContactEmail || null,
          contactPhone: editContactPhone || null,
          appliedAt: editAppliedAt || null,
          tags: editTags
        })
      })

      if (res.ok) {
        setSelectedJob(null)
        router.refresh()
      } else {
        alert("Erreur de sauvegarde.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la mise à jour.")
    } finally {
      setIsSavingJob(false)
    }
  }

  // Archivage (soft delete) de la carte
  const handleArchiveJob = async () => {
    if (!selectedJob) return
    if (!confirm("Voulez-vous vraiment archiver cette offre d'emploi ? Elle n'apparaîtra plus sur votre tableau.")) return

    setIsArchiving(true)
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: true })
      })

      if (res.ok) {
        setSelectedJob(null)
        router.refresh()
      } else {
        alert("Erreur d'archivage.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsArchiving(false)
    }
  }

  // Suppression définitive de l'offre
  const handleDeleteJob = async () => {
    if (!selectedJob) return
    if (!confirm("Voulez-vous supprimer définitivement cette offre d'emploi ? Cette action est irréversible et supprimera tout l'historique et les notes.")) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSelectedJob(null)
        router.refresh()
      } else {
        alert("Erreur lors de la suppression.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Ajout de notes sur la carte
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob || !newNote.trim()) return

    setIsSavingNote(true)
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      })

      if (res.ok) {
        setNewNote('')
        router.refresh() // Met à jour le composant parent, qui rafraîchira la modale via useEffect
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingNote(false)
    }
  }

  // Création d'un nouveau board rapidement
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return
    setIsCreatingBoard(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoardName,
          emoji: newBoardEmoji,
          description: ''
        })
      })
      if (res.ok) {
        const board = await res.json()
        setNewBoardName('')
        setShowCreateBoardModal(false)
        setShowBoardDropdown(false)
        router.push(`/dashboard/${board.id}`)
      } else {
        alert("Erreur lors de la création du tableau.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreatingBoard(false)
    }
  }

  // Ajout rapide d'une offre directement dans une colonne
  const handleQuickAddJob = async (columnId: string) => {
    if (!quickAddTitle.trim() || !quickAddCompany.trim()) return
    setIsQuickAdding(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickAddTitle,
          companyName: quickAddCompany,
          columnId
        })
      })
      if (res.ok) {
        setQuickAddTitle('')
        setQuickAddCompany('')
        setActiveQuickAddColId(null)
        router.refresh()
      } else {
        alert("Erreur lors de l'ajout rapide de la candidature.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsQuickAdding(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      
      {/* Barre du haut */}
      <header className="h-[64px] border-b border-border-color flex items-center justify-between px-6 gap-4 flex-shrink-0">
        {/* Gauche : lien retour + nom du board + recherche */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/boards"
            className="flex items-center gap-1.5 text-text-muted hover:text-foreground text-xs font-medium transition-colors flex-shrink-0"
          >
            <ChevronLeft size={14} />
            Tableaux
          </Link>
          <span className="text-border-color text-xs">/</span>
          <div className="relative">
            <button
              onClick={() => setShowBoardDropdown(!showBoardDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border-color bg-card-bg hover:bg-foreground/5 text-foreground transition-all duration-200 cursor-pointer min-w-0 select-none"
            >
              <span className="text-base flex-shrink-0">{boardEmoji ?? '📋'}</span>
              <span className="font-display font-semibold text-sm truncate text-foreground max-w-[140px] md:max-w-[200px]">
                {boardName ?? 'Mon tableau'}
              </span>
              <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${showBoardDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showBoardDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowBoardDropdown(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-bg-side border border-border-color rounded-2xl shadow-xl z-20 py-2 animate-slide-up">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Mes Tableaux ({boards.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                    {boards.map(b => (
                      <Link
                        key={b.id}
                        href={`/dashboard/${b.id}`}
                        onClick={() => setShowBoardDropdown(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          b.id === boardId
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:text-foreground hover:bg-foreground/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm flex-shrink-0">{b.emoji ?? '📋'}</span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        {b.id === boardId && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-border-color mt-2 pt-2 px-2">
                    <button
                      onClick={() => {
                        setShowCreateBoardModal(true)
                        setShowBoardDropdown(false)
                      }}
                      className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/15 text-purple-400 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer"
                    >
                      <Plus size={14} />
                      Nouveau tableau
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <span className="text-border-color hidden sm:block">|</span>
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-foreground/4 border border-border-color py-2 pl-9 pr-3 rounded-xl text-sm w-[240px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              placeholder="Rechercher..." 
            />
          </div>

          {allUniqueTags.length > 0 && (
            <div className="relative hidden lg:block">
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="bg-foreground/4 border border-border-color py-2 px-3 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer transition-all duration-200"
              >
                <option value="">Tous les tags</option>
                {allUniqueTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Droite : actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button 
            onClick={() => setShowColumnsModal(true)}
            className="py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border border-border-color bg-card-bg hover:bg-foreground/5 text-foreground transition-all duration-200 cursor-pointer"
            title="Gérer les étapes"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Étapes</span>
          </button>

          <button 
            onClick={() => {
              setShowImportForm(!showImportForm)
              setShowExcelImport(false)
            }}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all duration-200 cursor-pointer ${showImportForm ? 'bg-primary/10 border-primary/20 text-purple-400' : 'border-border-color bg-card-bg hover:bg-foreground/5'}`}
            title="Importer via lien"
          >
            <Link2 size={14} />
            <span className="hidden sm:inline">Lien</span>
          </button>

          <button 
            onClick={() => {
              setShowExcelImport(!showExcelImport)
              setShowImportForm(false)
            }}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all duration-200 cursor-pointer ${showExcelImport ? 'bg-primary/10 border-primary/20 text-purple-400' : 'border-border-color bg-card-bg hover:bg-foreground/5'}`}
            title="Importer Excel/CSV"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </header>

      {/* Formulaire d'importation collapsable */}
      {showImportForm && (
        <form onSubmit={handleImportLink} className="mx-10 mt-6 bg-card-bg border border-border-color p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-end animate-fadeIn">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-text-muted mb-2">Lien de l'offre d'emploi (Scraping Serveur)</label>
            <div className="relative">
              <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="url" 
                required
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                placeholder="Ex: https://fr.indeed.com/viewjob... ou https://www.hellowork.com/..." 
              />
            </div>
          </div>
          
          <div className="w-[180px]">
            <label className="block text-xs font-semibold text-text-muted mb-2">Sélectionnez le Site</label>
            <select
              value={importSource}
              onChange={(e) => setImportSource(e.target.value as any)}
              className="w-full bg-foreground/4 border border-border-color py-2.5 px-4 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
            >
              <option value="indeed" className="bg-bg-side text-foreground">Indeed</option>
              <option value="hellowork" className="bg-bg-side text-foreground">HelloWork</option>
              <option value="linkedin" className="bg-bg-side text-foreground">LinkedIn</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={isImporting}
            className="bg-primary hover:bg-primary-hover text-white py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 h-[42px]"
          >
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
            Importer
          </button>
        </form>
      )}

      {/* Formulaire d'importation Excel / CSV autonome */}
      {showExcelImport && (
        <div className="mx-10 mt-6 bg-card-bg border border-border-color p-6 rounded-2xl animate-fadeIn text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <FileSpreadsheet size={18} className="text-primary" />
              Importer des offres via fichier Excel ou CSV
            </h3>
            <button 
              onClick={() => {
                setShowExcelImport(false)
                setShowMappingStep(false)
                setFileData([])
              }}
              className="text-text-muted hover:text-foreground cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {!showMappingStep ? (
            <div className="border border-dashed border-border-color rounded-xl p-8 text-center bg-foreground/2 hover:bg-foreground/3 transition-all duration-200">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                id="excel-file-upload"
                className="hidden"
              />
              <label htmlFor="excel-file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Cliquez pour téléverser votre fichier</p>
                  <p className="text-xs text-text-muted mt-1">Accepte les formats .xlsx, .xls, et .csv</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              
              {/* Options de ligne et intervalle */}
              <div className="flex flex-wrap items-center gap-6 bg-foreground/2 border border-border-color p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="excel-has-headers"
                    checked={hasHeaders}
                    onChange={(e) => handleHeadersToggle(e.target.checked)}
                    className="w-4 h-4 text-primary bg-foreground/4 border-border-color rounded focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="excel-has-headers" className="text-xs font-semibold text-text-main cursor-pointer select-none">
                    La première ligne contient les en-têtes de colonnes
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-text-muted">Intervalle de lignes :</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={hasHeaders ? 2 : 1}
                      max={endRow}
                      value={startRow}
                      onChange={(e) => setStartRow(Math.max(hasHeaders ? 2 : 1, parseInt(e.target.value) || (hasHeaders ? 2 : 1)))}
                      className="w-16 bg-foreground/4 border border-border-color py-1 px-2 rounded-lg text-xs text-center text-foreground font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="text-xs text-text-muted">à</span>
                    <input
                      type="number"
                      min={startRow}
                      max={fileData.length}
                      value={endRow}
                      onChange={(e) => setEndRow(Math.min(fileData.length, Math.max(startRow, parseInt(e.target.value) || fileData.length)))}
                      className="w-16 bg-foreground/4 border border-border-color py-1 px-2 rounded-lg text-xs text-center text-foreground font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="text-xs text-text-muted">(Total: {fileData.length} lignes)</span>
                  </div>
                </div>
              </div>

              {/* Table de prévisualisation avec dropdowns de mapping au-dessus de chaque colonne */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-muted">Prévisualisation du fichier & Correspondance des colonnes :</span>
                <div className="border border-border-color rounded-xl overflow-hidden bg-foreground/2">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-foreground/5 border-b border-border-color">
                          <th className="p-3 font-semibold text-text-muted w-14 text-center">Ligne</th>
                          {columnFields.map((field, colIdx) => (
                            <th key={colIdx} className="p-3 min-w-[160px] border-r border-border-color last:border-0 font-sans">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-semibold text-text-muted uppercase text-[9px] tracking-wider font-display">
                                  {hasHeaders && fileData[0] ? String(fileData[0][colIdx] || '') : `Colonne ${getColLetter(colIdx)}`}
                                </span>
                                <select
                                  value={field}
                                  onChange={(e) => {
                                    const nextFields = [...columnFields]
                                    nextFields[colIdx] = e.target.value
                                    setColumnFields(nextFields)
                                  }}
                                  className="w-full bg-bg-side border border-border-color py-1 px-2 rounded-md font-medium text-foreground focus:outline-none cursor-pointer text-xs"
                                >
                                  <option value="ignore" className="bg-bg-side text-foreground">❌ Ignorer</option>
                                  <option value="title" className="bg-bg-side text-foreground">💼 Poste (Requis)</option>
                                  <option value="company" className="bg-bg-side text-foreground">🏢 Entreprise (Requis)</option>
                                  <option value="location" className="bg-bg-side text-foreground">📍 Lieu</option>
                                  <option value="salary" className="bg-bg-side text-foreground">💰 Salaire</option>
                                  <option value="url" className="bg-bg-side text-foreground">🔗 Lien</option>
                                  <option value="description" className="bg-bg-side text-foreground">📝 Description</option>
                                  <option value="source" className="bg-bg-side text-foreground">📣 Source</option>
                                </select>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.slice(hasHeaders ? 1 : 0, hasHeaders ? 6 : 5).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-border-color/50 last:border-0 hover:bg-foreground/1">
                            <td className="p-3 text-center text-text-muted bg-foreground/3 border-r border-border-color font-medium">
                              {rowIdx + (hasHeaders ? 2 : 1)}
                            </td>
                            {columnFields.map((_, colIdx) => (
                              <td key={colIdx} className="p-3 truncate max-w-[200px] border-r border-border-color/50 last:border-0 text-text-main font-medium font-sans">
                                {String(row[colIdx] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {isImportingFile ? (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-primary flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      Importation de la ligne {importProgress} sur {importTotal}...
                    </span>
                    <span>{Math.round((importProgress / importTotal) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(importProgress / importTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-end mt-2">
                  <button
                    onClick={() => {
                      setShowMappingStep(false)
                      setFileData([])
                    }}
                    className="bg-foreground/5 hover:bg-foreground/10 border border-border-color py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-text-main"
                  >
                    Changer de fichier
                  </button>
                  <button
                    onClick={handleStartImport}
                    className="bg-primary hover:bg-primary-hover text-white py-2.5 px-5 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all duration-200 cursor-pointer"
                  >
                    Lancer l'importation ({Math.max(0, endRow - startRow + 1)} lignes)
                  </button>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-red-400 text-xs mt-2 max-h-[100px] overflow-y-auto">
                  <p className="font-semibold mb-1">Erreurs lors de l'import :</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {importErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ligne des KPIs */}
      <section className="flex gap-5 px-10 pt-6 pb-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="flex-1 bg-card-bg border border-border-color rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-foreground/3 border border-border-color`}>
                <Icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">{stat.title}</p>
                <h3 className={`font-display text-2xl font-bold ${stat.highlight ? 'text-amber-500' : ''}`}>{stat.value}</h3>
              </div>
            </div>
          )
        })}
      </section>

      {/* Zone de Tableau Kanban */}
      <div className="flex-1 flex gap-5 px-10 pb-10 pt-4 overflow-x-auto items-stretch">
        {filteredColumns.map((col) => (
          <div 
            key={col.id} 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
            className="w-[320px] min-w-[320px] bg-foreground/3 border border-border-color rounded-[20px] flex flex-col p-4 transition-colors duration-150 group/col"
          >
            
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color || 'bg-col-to-apply'}`} />
                <span className="font-semibold text-sm">{col.name}</span>
                <span className="bg-foreground/5 border border-border-color px-2 py-0.5 rounded-full text-[10px] text-text-muted font-bold ml-1">
                  {col.jobApplications.length}
                </span>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity duration-150">
                {col.order > 1 && (
                  <button
                    onClick={() => handleMoveColumn(col.id, 'left')}
                    className="p-1 rounded hover:bg-foreground/5 text-text-muted hover:text-foreground cursor-pointer"
                    title="Déplacer à gauche"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                {col.order < columns.length && (
                  <button
                    onClick={() => handleMoveColumn(col.id, 'right')}
                    className="p-1 rounded hover:bg-foreground/5 text-text-muted hover:text-foreground cursor-pointer"
                    title="Déplacer à droite"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {col.jobApplications.length === 0 ? (
                <div className="flex-1 border border-dashed border-border-color rounded-2xl flex flex-col items-center justify-center p-6 text-center opacity-40">
                  <Briefcase size={24} className="mb-2" />
                  <p className="text-xs">Aucune offre</p>
                </div>
              ) : (
                col.jobApplications.map((job) => (
                  <div 
                    key={job.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, job.id)}
                    onClick={() => handleOpenModal(job)}
                    className="bg-card-bg border border-border-color rounded-2xl p-4 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 relative group hover:shadow-xl hover:shadow-black/20 select-none"
                  >
                    
                    <div className="flex items-start justify-between mb-3">
                      {/* Liaison vers la fiche entreprise */}
                      <Link 
                        href={`/company/${job.company.name.toLowerCase()}`}
                        onClick={(e) => e.stopPropagation()} // Empêche l'ouverture de la modale
                        className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors duration-150 group/link"
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] bg-black text-white">
                          {job.company.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-semibold group-hover/link:underline">{job.company.name}</span>
                      </Link>
                      
                      {job.salary && (
                        <span className="text-[10px] py-0.5 px-2 rounded-md font-medium border bg-emerald-500/8 border-emerald-500/15 text-emerald-400">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold mb-2.5 leading-snug">{job.title}</h4>

                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {job.location && (
                        <span className="text-[10px] bg-foreground/3 border border-border-color text-foreground px-2 py-0.5 rounded-full font-medium">
                          {job.location}
                        </span>
                      )}
                      {job.tags.map((tag) => (
                        <span key={tag.id} className="text-[10px] bg-foreground/3 border border-border-color text-foreground px-2 py-0.5 rounded-full font-medium">
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <div className="border-t border-border-color pt-2.5 flex items-center justify-between text-[10px] text-text-muted">
                      {job.url ? (
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()} // Empêche l'ouverture de la modale
                          className="flex items-center gap-1 hover:text-primary transition-colors font-medium text-purple-400"
                        >
                          <LinkIcon size={12} />
                          Lien Offre ↗
                        </a>
                      ) : (
                        <div className="flex items-center gap-1">
                          <LinkIcon size={12} />
                          {job.source || 'Manuel'}
                        </div>
                      )}
                      <span>
                        {job.appliedAt 
                          ? `Envoyé le ${new Date(job.appliedAt).toLocaleDateString('fr-FR')}` 
                          : new Date(job.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Formulaire ou bouton d'ajout rapide de carte */}
            <div className="mt-3 border-t border-border-color/40 pt-3">
              {activeQuickAddColId === col.id ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleQuickAddJob(col.id)
                  }}
                  className="bg-card-bg border border-border-color rounded-2xl p-3 flex flex-col gap-2 animate-slide-up"
                >
                  <input 
                    type="text"
                    required
                    autoFocus
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    placeholder="Intitulé du poste..."
                    className="w-full bg-foreground/4 border border-border-color py-1.5 px-2 rounded-lg text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
                  />
                  <input 
                    type="text"
                    required
                    value={quickAddCompany}
                    onChange={(e) => setQuickAddCompany(e.target.value)}
                    placeholder="Entreprise..."
                    className="w-full bg-foreground/4 border border-border-color py-1.5 px-2 rounded-lg text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
                  />
                  <div className="flex justify-end gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuickAddColId(null)
                        setQuickAddTitle('')
                        setQuickAddCompany('')
                      }}
                      className="px-2.5 py-1.5 border border-border-color rounded-lg text-[10px] font-semibold hover:bg-foreground/5 text-foreground cursor-pointer transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isQuickAdding || !quickAddTitle.trim() || !quickAddCompany.trim()}
                      className="bg-primary hover:bg-primary-hover text-white py-1.5 px-2.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all duration-150 disabled:opacity-50"
                    >
                      {isQuickAdding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                      Ajouter
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setActiveQuickAddColId(col.id)
                    setQuickAddTitle('')
                    setQuickAddCompany('')
                  }}
                  className="w-full py-2 border border-dashed border-border-color hover:border-primary/40 rounded-xl text-text-muted hover:text-primary hover:bg-primary-subtle text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                >
                  <Plus size={14} />
                  Ajouter une offre
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* ----------------------------------------------------
          MODALE DE DETAIL & EDITION D'OFFRE
          ---------------------------------------------------- */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-side border border-border-color rounded-2xl w-full max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50">
            
            {/* Header Modale */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-color">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center font-display font-bold text-sm text-white">
                  {selectedJob.company.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg leading-none mb-1">{editTitle || 'Sans titre'}</h3>
                  <p className="text-xs text-text-muted">{selectedJob.company.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-foreground/5 cursor-pointer transition-colors duration-150"
              >
                <X size={18} />
              </button>
            </div>

            {/* Barre d'onglets premium */}
            <div className="flex border-b border-border-color bg-foreground/2 px-6 overflow-x-auto scrollbar-none">
              {[
                { id: 'info', label: 'Détails', icon: Briefcase },
                { id: 'notes', label: `Notes (${selectedJob.notes.length})`, icon: MessageSquare },
                { id: 'contacts', label: 'Contact Recruteur', icon: User },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'history', label: 'Historique', icon: Clock }
              ].map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-3 px-1 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap mr-6 ${
                      active
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-text-muted hover:text-foreground'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Corps Modale - Contenu par Onglet */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[350px] text-left">
              
              {activeTab === 'info' && (
                <form onSubmit={handleSaveChanges} className="flex flex-col gap-4 h-full justify-between">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display">Intitulé du Poste</label>
                      <input 
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display font-medium">Localisation</label>
                        <input 
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                          placeholder="Ex: Paris / Remote"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display font-medium">Rémunération</label>
                        <input 
                          type="text"
                          value={editSalary}
                          onChange={(e) => setEditSalary(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                          placeholder="Ex: 45k - 50k"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display font-medium">Étape (Colonne Kanban)</label>
                        <select
                          value={editColumnId}
                          onChange={(e) => setEditColumnId(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2.5 px-3 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
                        >
                          {columns.map(c => (
                            <option key={c.id} value={c.id} className="bg-bg-side text-foreground">{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display font-medium">Date d'envoi</label>
                        <input 
                          type="date"
                          value={editAppliedAt}
                          onChange={(e) => setEditAppliedAt(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display font-medium">Lien de l'offre</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="flex-1 bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                            placeholder="https://..."
                          />
                          {editUrl && (
                            <a 
                              href={editUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-foreground/5 hover:bg-primary/10 border border-border-color text-text-muted hover:text-primary p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border-color/60 pt-4 mt-2">
                      <h4 className="text-xs font-bold text-text-main mb-3 flex items-center gap-1.5 font-display">
                        <Tag size={14} className="text-primary" />
                        Étiquettes / Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {editTags.length === 0 ? (
                          <span className="text-[11px] text-text-muted italic">Aucune étiquette</span>
                        ) : (
                          editTags.map((tag, index) => (
                            <span key={index} className="text-[11px] bg-primary/15 border border-primary/30 text-purple-400 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => setEditTags(editTags.filter(t => t !== tag))}
                                className="hover:text-red-400 cursor-pointer font-bold text-xs"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2 max-w-[280px]">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="Ajouter un tag..."
                          className="flex-1 bg-foreground/4 border border-border-color py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (newTagInput.trim() && !editTags.includes(newTagInput.trim())) {
                                setEditTags([...editTags, newTagInput.trim()])
                                setNewTagInput('')
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newTagInput.trim() && !editTags.includes(newTagInput.trim())) {
                              setEditTags([...editTags, newTagInput.trim()])
                              setNewTagInput('')
                            }
                          }}
                          className="bg-primary/10 border border-primary/20 hover:bg-primary/15 text-purple-400 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border-color pt-6 mt-6 flex justify-between gap-3">
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        disabled={isArchiving}
                        onClick={handleArchiveJob}
                        className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 text-amber-400 hover:text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                      >
                        {isArchiving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Archiver
                      </button>
                      <button 
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDeleteJob}
                        className="bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Supprimer
                      </button>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSavingJob}
                      className="bg-primary hover:bg-primary-hover text-white py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                    >
                      {isSavingJob ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'notes' && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 font-display">
                    <MessageSquare size={14} className="text-primary" />
                    Commentaires & Notes ({selectedJob.notes.length})
                  </h4>

                  {/* Formulaire d'ajout de note */}
                  <form onSubmit={handleAddNote}>
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                      placeholder="Ajouter une note de préparation, un compte-rendu d'appel..."
                      className="w-full h-[100px] bg-foreground/4 border border-border-color rounded-xl p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:border-primary resize-none mb-2"
                    />
                    <button 
                      type="submit"
                      disabled={isSavingNote || !newNote.trim()}
                      className="bg-primary hover:bg-primary-hover text-white py-1.5 px-4 rounded-lg text-xs font-bold float-right cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNote ? 'Envoi...' : 'Ajouter la note'}
                    </button>
                    <div className="clear-both" />
                  </form>

                  {/* Historique des notes */}
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 mt-2">
                    {selectedJob.notes.length === 0 ? (
                      <p className="text-[11px] text-text-muted italic py-6 text-center">Aucune note enregistrée.</p>
                    ) : (
                      selectedJob.notes.map((note) => (
                        <div key={note.id} className="bg-foreground/2 border border-border-color rounded-xl p-3">
                          <p className="text-[11px] text-text-main leading-relaxed mb-1.5 whitespace-pre-wrap">{note.content}</p>
                          <span className="text-[9px] text-text-muted font-medium">
                            Le {new Date(note.createdAt).toLocaleDateString('fr-FR')} à {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <form onSubmit={handleSaveChanges} className="flex flex-col gap-4 h-full justify-between">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 font-display">
                      <User size={14} className="text-primary" />
                      Contact Recruteur / RH
                    </h4>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display">Nom du contact</label>
                        <input 
                          type="text"
                          value={editContactName}
                          onChange={(e) => setEditContactName(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                          placeholder="Ex: Jean Dupont"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display">Email</label>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input 
                              type="email"
                              value={editContactEmail}
                              onChange={(e) => setEditContactEmail(e.target.value)}
                              className="w-full bg-foreground/4 border border-border-color py-2 pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                              placeholder="recruteur@entreprise.com"
                            />
                          </div>
                        </div>
                        <div className="relative">
                          <label className="block text-[11px] font-semibold text-text-muted mb-1.5 font-display">Téléphone</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input 
                              type="text"
                              value={editContactPhone}
                              onChange={(e) => setEditContactPhone(e.target.value)}
                              className="w-full bg-foreground/4 border border-border-color py-2 pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                              placeholder="06 12 34 56 78"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border-color pt-6 mt-6 flex justify-end">
                    <button 
                      type="submit"
                      disabled={isSavingJob}
                      className="bg-primary hover:bg-primary-hover text-white py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                    >
                      {isSavingJob ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Enregistrer les contacts
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'documents' && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 font-display">
                    <FileText size={14} className="text-primary" />
                    CV & Lettre de motivation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {/* Curriculum Vitae */}
                    <div className="bg-foreground/2 border border-border-color rounded-xl p-4 flex flex-col justify-between h-[110px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-text-muted">Curriculum Vitae (CV)</span>
                        {selectedJob.documents?.find(d => d.type === 'CV') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteDocument(selectedJob.documents.find(d => d.type === 'CV')!.id)
                              setPreviewDoc(null)
                            }}
                            className="text-text-muted hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                            title="Supprimer le CV"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {selectedJob.documents?.find(d => d.type === 'CV') ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(selectedJob.documents.find(d => d.type === 'CV')!)}
                            className="text-xs font-semibold text-purple-400 hover:text-primary transition-colors text-left truncate max-w-[250px] cursor-pointer hover:underline flex items-center gap-1.5"
                            title="Cliquer pour prévisualiser"
                          >
                            <Eye size={12} className="flex-shrink-0" />
                            {selectedJob.documents.find(d => d.type === 'CV')!.name}
                          </button>
                          <a
                            href={selectedJob.documents.find(d => d.type === 'CV')!.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-text-muted hover:text-foreground flex items-center gap-1"
                          >
                            <ExternalLink size={10} />
                            Ouvrir dans un nouvel onglet ↗
                          </a>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer hover:text-foreground">
                          <Upload size={12} />
                          <span>Choisir un fichier CV</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                            className="hidden"
                            onChange={(e) => handleUploadDocument(e, 'CV')}
                          />
                        </label>
                      )}
                    </div>

                    {/* Lettre de motivation */}
                    <div className="bg-foreground/2 border border-border-color rounded-xl p-4 flex flex-col justify-between h-[110px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-text-muted">Lettre de motivation (LM)</span>
                        {selectedJob.documents?.find(d => d.type === 'COVER_LETTER') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteDocument(selectedJob.documents.find(d => d.type === 'COVER_LETTER')!.id)
                              setPreviewDoc(null)
                            }}
                            className="text-text-muted hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                            title="Supprimer la LM"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {selectedJob.documents?.find(d => d.type === 'COVER_LETTER') ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(selectedJob.documents.find(d => d.type === 'COVER_LETTER')!)}
                            className="text-xs font-semibold text-purple-400 hover:text-primary transition-colors text-left truncate max-w-[250px] cursor-pointer hover:underline flex items-center gap-1.5"
                            title="Cliquer pour prévisualiser"
                          >
                            <Eye size={12} className="flex-shrink-0" />
                            {selectedJob.documents.find(d => d.type === 'COVER_LETTER')!.name}
                          </button>
                          <a
                            href={selectedJob.documents.find(d => d.type === 'COVER_LETTER')!.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-text-muted hover:text-foreground flex items-center gap-1"
                          >
                            <ExternalLink size={10} />
                            Ouvrir dans un nouvel onglet ↗
                          </a>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer hover:text-foreground">
                          <Upload size={12} />
                          <span>Choisir un fichier Lettre</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                            className="hidden"
                            onChange={(e) => handleUploadDocument(e, 'COVER_LETTER')}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Zone de prévisualisation de document intégrée */}
                  {previewDoc && (
                    <div className="mt-6 border-t border-border-color pt-4 flex flex-col gap-3 animate-slide-up">
                      <div className="flex justify-between items-center bg-foreground/2 px-4 py-2 rounded-xl border border-border-color">
                        <span className="text-xs font-semibold truncate text-foreground flex items-center gap-1.5">
                          <FileText size={14} className="text-primary" />
                          Aperçu : {previewDoc.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(null)}
                          className="text-text-muted hover:text-foreground text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer"
                        >
                          Masquer l'aperçu
                        </button>
                      </div>
                      <div className="bg-foreground/2 border border-border-color rounded-xl overflow-hidden h-[450px] flex items-center justify-center relative">
                        {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                          <iframe 
                            src={previewDoc.url} 
                            className="w-full h-full border-none"
                            title="Aperçu PDF"
                          />
                        ) : previewDoc.url.toLowerCase().match(/\.(png|jpe?g|gif|webp)$/) ? (
                          <img 
                            src={previewDoc.url} 
                            alt={previewDoc.name}
                            className="max-w-full max-h-full object-contain p-2"
                          />
                        ) : previewDoc.url.toLowerCase().endsWith('.txt') ? (
                          <iframe 
                            src={previewDoc.url} 
                            className="w-full h-full border-none p-4 bg-foreground/2 text-xs font-mono text-foreground"
                            title="Aperçu Texte"
                          />
                        ) : (
                          <div className="text-center p-6 flex flex-col items-center gap-2">
                            <FileText size={48} className="text-text-muted opacity-40 animate-pulse" />
                            <p className="text-xs font-semibold">Prévisualisation non supportée localement pour ce format</p>
                            <a 
                              href={previewDoc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                            >
                              <ExternalLink size={12} />
                              Ouvrir dans un nouvel onglet
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 font-display">
                    <Clock size={14} className="text-primary" />
                    Historique de candidature
                  </h4>

                  <div className="bg-foreground/2 border border-border-color rounded-2xl p-4 flex flex-col gap-3 text-xs text-foreground mt-2">
                    <div className="flex justify-between border-b border-border-color/60 pb-2">
                      <span className="text-text-muted">Importé le</span>
                      <span className="font-semibold">{new Date(selectedJob.createdAt).toLocaleDateString('fr-FR')} à {new Date(selectedJob.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-color/60 pb-2">
                      <span className="text-text-muted">Dernière modification</span>
                      <span className="font-semibold">{new Date(selectedJob.updatedAt).toLocaleDateString('fr-FR')} à {new Date(selectedJob.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-color/60 pb-2">
                      <span className="text-text-muted">Source d'acquisition</span>
                      <span className="font-semibold">{selectedJob.source || 'Saisie Manuelle'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">ID de candidature</span>
                      <span className="font-mono text-[10px] text-text-muted">{selectedJob.id}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODALE DE GESTION DES ETAPES (COLONNES)
          ---------------------------------------------------- */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-side border border-border-color rounded-2xl w-full max-w-[550px] overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-fadeIn">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-color">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                Gérer les étapes du tableau
              </h3>
              <button 
                onClick={() => setShowColumnsModal(false)}
                className="text-text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps */}
            <div className="p-6 flex flex-col gap-6">
              
              {/* Formulaire d'ajout de colonne */}
              <form onSubmit={handleCreateColumn} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Nouvelle étape</label>
                  <input 
                    type="text"
                    required
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Ex: Entretien technique..."
                    className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-150 h-[38px]"
                >
                  <Plus size={16} />
                  Créer
                </button>
              </form>

              {/* Liste des colonnes */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Étapes actuelles</h4>
                
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {columns.map((col, index) => (
                    <div 
                      key={col.id}
                      className="bg-foreground/2 border border-border-color rounded-xl p-3 flex items-center justify-between gap-3 hover:border-foreground/10 transition-all duration-150"
                    >
                      <div className="flex-1 flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.color || 'bg-col-to-apply'}`} />
                        
                        {editingColumnId === col.id ? (
                          <input
                            type="text"
                            value={editingColumnName}
                            onChange={(e) => setEditingColumnName(e.target.value)}
                            onBlur={() => handleRenameColumn(col.id, editingColumnName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameColumn(col.id, editingColumnName)
                              }
                            }}
                            className="bg-foreground/4 border border-primary/40 py-1 px-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary w-[160px]"
                            autoFocus
                          />
                        ) : (
                          <span 
                            onClick={() => {
                              setEditingColumnId(col.id)
                              setEditingColumnName(col.name)
                            }}
                            className="text-xs font-semibold cursor-pointer hover:text-primary transition-colors"
                            title="Double-cliquez pour renommer"
                          >
                            {col.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Déplacer */}
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveColumn(col.id, 'left')}
                            className="p-1.5 rounded hover:bg-foreground/5 text-text-muted hover:text-foreground cursor-pointer"
                            title="Déplacer à gauche"
                          >
                            <ChevronLeft size={14} />
                          </button>
                        )}
                        {index < columns.length - 1 && (
                          <button
                            onClick={() => handleMoveColumn(col.id, 'right')}
                            className="p-1.5 rounded hover:bg-foreground/5 text-text-muted hover:text-foreground cursor-pointer"
                            title="Déplacer à droite"
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                        
                        {/* Supprimer */}
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 cursor-pointer ml-1.5 transition-colors"
                          title="Supprimer la colonne"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODALE DE CREATION DE TABLEAU RAPIDE
          ---------------------------------------------------- */}
      {showCreateBoardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-side border border-border-color rounded-2xl w-full max-w-[450px] overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-color">
              <h3 className="font-display font-bold text-base flex items-center gap-2 text-foreground">
                <Plus size={18} className="text-primary" />
                Nouveau tableau
              </h3>
              <button 
                onClick={() => setShowCreateBoardModal(false)}
                className="text-text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps */}
            <form onSubmit={handleCreateBoard} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Nom du tableau</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Ex: Recherche CDI / Alternance..."
                  className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {['🚀', '💼', '🎯', '⭐', '🔥', '💡', '🏆', '📋', '🎨', '🌟'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewBoardEmoji(emoji)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all cursor-pointer ${
                        newBoardEmoji === emoji
                          ? 'border-primary bg-primary/10 text-primary scale-105 shadow-md'
                          : 'border-border-color bg-foreground/2 text-foreground hover:bg-foreground/5 hover:border-foreground/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateBoardModal(false)}
                  className="px-4 py-2 border border-border-color rounded-lg text-xs font-semibold hover:bg-foreground/5 text-foreground cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBoard || !newBoardName.trim()}
                  className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                >
                  {isCreatingBoard ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Créer le tableau
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  )
}
