'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { KanbanColumn } from '@/types'

// Type local de candidature pour le typage interne du state
type ClientJob = KanbanColumn['jobApplications'][number]

interface BoardViewProps {
  initialColumns: KanbanColumn[]
  userId: string
}

export function BoardView({ initialColumns, userId }: BoardViewProps) {
  const router = useRouter()
  
  // États de données et filtres
  const [columns, setColumns] = React.useState<KanbanColumn[]>(initialColumns)
  const [searchQuery, setSearchQuery] = React.useState('')
  
  // États pour le formulaire d'importation de liens
  const [showImportForm, setShowImportForm] = React.useState(false)
  const [importUrl, setImportUrl] = React.useState('')
  const [importSource, setImportSource] = React.useState<'indeed' | 'hellowork' | 'linkedin'>('indeed')
  const [isImporting, setIsImporting] = React.useState(false)

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
  }

  // Filtrage des colonnes selon la recherche
  const filteredColumns = React.useMemo(() => {
    if (!searchQuery.trim()) return columns

    const query = searchQuery.toLowerCase()
    return columns.map(col => ({
      ...col,
      jobApplications: col.jobApplications.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.name.toLowerCase().includes(query) ||
        (job.location && job.location.toLowerCase().includes(query)) ||
        (job.source && job.source.toLowerCase().includes(query))
      )
    }))
  }, [columns, searchQuery])

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
          contactPhone: editContactPhone || null
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

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      
      {/* Barre du haut */}
      <header className="h-[70px] border-b border-border-color flex items-center justify-between px-10">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm w-[320px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            placeholder="Rechercher une offre, entreprise, tag..." 
          />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportForm(!showImportForm)}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-border-color transition-all duration-200 cursor-pointer ${showImportForm ? 'bg-primary/10 border-primary/20 text-purple-400' : 'bg-card-bg hover:bg-foreground/5'}`}
          >
            <Link2 size={16} />
            Importer via Lien
          </button>

          <button 
            onClick={() => alert("Ajouter une candidature manuelle en cours d'implémentation...")}
            className="bg-primary hover:bg-primary-hover text-white py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle offre
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
              className="w-full bg-foreground/4 border border-border-color py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
            >
              <option value="indeed">Indeed</option>
              <option value="hellowork">HelloWork</option>
              <option value="linkedin">LinkedIn</option>
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
            className="w-[320px] min-w-[320px] bg-foreground/3 border border-border-color rounded-[20px] flex flex-col p-4 transition-colors duration-150"
          >
            
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="flex items-center gap-2.5 font-semibold text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color || 'bg-col-to-apply'}`} />
                {col.name}
              </span>
              <span className="bg-foreground/5 border border-border-color px-2.5 py-0.5 rounded-full text-[11px] text-text-muted">
                {col.jobApplications.length}
              </span>
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
                      <span>{new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                  </div>
                ))
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

            {/* Corps Modale */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Formulaire Principal (Gauche) */}
              <form onSubmit={handleSaveChanges} className="md:col-span-3 flex flex-col gap-4">
                
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Intitulé du Poste</label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Localisation</label>
                    <input 
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Ex: Paris / Remote"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Rémunération</label>
                    <input 
                      type="text"
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                      className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Ex: 45k - 50k"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Étape (Colonne Kanban)</label>
                    <select
                      value={editColumnId}
                      onChange={(e) => setEditColumnId(e.target.value)}
                      className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary cursor-pointer transition-colors"
                    >
                      {columns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Lien de l'offre</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="flex-1 bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="https://..."
                      />
                      {editUrl && (
                        <a 
                          href={editUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-foreground/5 hover:bg-primary/10 border border-border-color text-text-muted hover:text-primary p-2 rounded-lg flex items-center justify-center"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Contacts RH */}
                <div className="border-t border-border-color pt-4 mt-2">
                  <h4 className="text-xs font-bold text-text-main mb-3 flex items-center gap-1.5">
                    <User size={14} className="text-primary" />
                    Contact Recruteur / RH
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <input 
                        type="text"
                        value={editContactName}
                        onChange={(e) => setEditContactName(e.target.value)}
                        className="w-full bg-foreground/4 border border-border-color py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="Nom du recruteur..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                          type="email"
                          value={editContactEmail}
                          onChange={(e) => setEditContactEmail(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2 pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                          placeholder="Email..."
                        />
                      </div>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                          type="text"
                          value={editContactPhone}
                          onChange={(e) => setEditContactPhone(e.target.value)}
                          className="w-full bg-foreground/4 border border-border-color py-2 pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                          placeholder="Téléphone..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions de la colonne gauche */}
                <div className="border-t border-border-color pt-4 mt-4 flex justify-between">
                  <button 
                    type="button"
                    disabled={isArchiving}
                    onClick={handleArchiveJob}
                    className="bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                  >
                    {isArchiving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Archiver l'offre
                  </button>

                  <button 
                    type="submit"
                    disabled={isSavingJob}
                    className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 disabled:opacity-50"
                  >
                    {isSavingJob ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Enregistrer les modifications
                  </button>
                </div>

              </form>

              {/* Bloc-notes (Droite) */}
              <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-border-color pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-main mb-3 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-primary" />
                    Commentaires & Notes ({selectedJob.notes.length})
                  </h4>

                  {/* Formulaire d'ajout de note */}
                  <form onSubmit={handleAddNote} className="mb-4">
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                      placeholder="Ajouter une note de préparation, un compte-rendu d'appel..."
                      className="w-full h-[80px] bg-foreground/4 border border-border-color rounded-xl p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:border-primary resize-none mb-2"
                    />
                    <button 
                      type="submit"
                      disabled={isSavingNote || !newNote.trim()}
                      className="bg-primary/10 border border-primary/20 hover:bg-primary/15 text-purple-400 py-1.5 px-3 rounded-lg text-[10px] font-bold float-right cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNote ? 'Envoi...' : 'Ajouter la note'}
                    </button>
                    <div className="clear-both" />
                  </form>

                  {/* Historique des notes */}
                  <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                    {selectedJob.notes.length === 0 ? (
                      <p className="text-[11px] text-text-muted italic py-4 text-center">Aucune note enregistrée.</p>
                    ) : (
                      selectedJob.notes.map((note) => (
                        <div key={note.id} className="bg-foreground/2 border border-border-color rounded-lg p-3">
                          <p className="text-[11px] text-text-main leading-relaxed mb-1.5 whitespace-pre-wrap">{note.content}</p>
                          <span className="text-[9px] text-text-muted">
                            Le {new Date(note.createdAt).toLocaleDateString('fr-FR')} à {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Historique des transitions */}
                <div className="border-t border-border-color pt-4 mt-4">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                    Historique de candidature
                  </h4>
                  <div className="text-[10px] text-text-muted flex flex-col gap-1">
                    <div>Importé le : {new Date(selectedJob.createdAt).toLocaleDateString('fr-FR')}</div>
                    <div>Source : {selectedJob.source || 'Manuel'}</div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </main>
  )
}
