import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { readRaimuFile } from '../lib/raimuFileReader'
import './raimu-knowledge.css'

const categories = ['policy', 'procedure', 'recipe', 'menu', 'inventory', 'orders', 'payments', 'customers', 'system', 'other']
const blank = { title: '', category: 'procedure', content: '', allowed_roles: ['admin', 'staff'], status: 'draft' }

export default function RaimuKnowledgePage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function refresh() {
    const { data, error } = await supabase.from('raimu_knowledge').select('id,title,category,content,allowed_roles,status,updated_at').order('updated_at', { ascending: false })
    if (error) { setNotice(error.message); return }
    setEntries(data || [])
  }
  useEffect(() => { void refresh() }, [])

  const reset = () => { setForm(blank); setEditing(null) }
  const save = async (event) => {
    event.preventDefault()
    if (!form.allowed_roles.length) { setNotice('Choose at least one role.'); return }
    setBusy(true); setNotice('')
    const values = { title: form.title.trim(), category: form.category, content: form.content.trim(), allowed_roles: form.allowed_roles, status: form.status, updated_by: user.id, updated_at: new Date().toISOString() }
    const { error } = editing
      ? await supabase.from('raimu_knowledge').update(values).eq('id', editing)
      : await supabase.from('raimu_knowledge').insert({ ...values, created_by: user.id })
    setBusy(false)
    if (error) { setNotice(error.message); return }
    reset(); setNotice('Knowledge saved.'); void refresh()
  }
  const select = (entry) => { setEditing(entry.id); setForm({ title: entry.title, category: entry.category, content: entry.content, allowed_roles: entry.allowed_roles, status: entry.status }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggleRole = (role) => setForm((current) => ({ ...current, allowed_roles: current.allowed_roles.includes(role) ? current.allowed_roles.filter((item) => item !== role) : [...current.allowed_roles, role] }))
  const importFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true); setNotice('Reading file…')
    try {
      const result = await readRaimuFile(file)
      setForm((current) => ({ ...current, title: current.title || result.name.replace(/\.[^.]+$/, ''), content: result.text, status: 'draft' }))
      setNotice('File text loaded as a draft. Review it before publishing.')
    } catch (error) { setNotice(error.message) } finally { setBusy(false); event.target.value = '' }
  }

  return <AppShell role="admin" title="Raimu Knowledge" eyebrow="Keep Raimu’s store answers accurate and role appropriate.">
    <div className="rk-page">
      <p className="rk-intro">Add approved store procedures, recipes, policies, and system guidance here. Live orders, inventory, and sales are read from their original records; do not copy passwords, API keys, or customer payment details into knowledge.</p>
      <form className="rk-editor" onSubmit={save}>
        <h2>{editing ? 'Edit knowledge' : 'Add knowledge'}</h2>
        <label>Import a document or image<input type="file" accept=".txt,.md,.csv,.xlsx,.pdf,.jpg,.jpeg,.png,.webp" onChange={importFile} /></label>
        <div className="rk-fields"><label>Title<input value={form.title} maxLength={160} minLength={3} required onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div>
        <label>What Raimu should know<textarea value={form.content} minLength={10} maxLength={20000} required rows={9} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
        <div className="rk-fields"><fieldset><legend>Visible to</legend>{['admin', 'staff', 'cashier'].map((role) => <label key={role}><input type="checkbox" checked={form.allowed_roles.includes(role)} onChange={() => toggleRole(role)} /> {role}</label>)}</fieldset><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="retired">Retired</option></select></label></div>
        <div className="rk-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save knowledge'}</button>{editing && <button type="button" onClick={reset}>Cancel edit</button>}</div>
      </form>
      {notice && <p className="rk-notice" role="status">{notice}</p>}
      <section className="rk-list" aria-label="Knowledge entries"><h2>Knowledge entries</h2>{entries.length ? entries.map((entry) => <article key={entry.id}><div><h3>{entry.title}</h3><p>{entry.category} · {entry.status} · {entry.allowed_roles.join(', ')} · Updated {new Date(entry.updated_at).toLocaleDateString('en-PH')}</p></div><button type="button" onClick={() => select(entry)}>Edit</button></article>) : <p>No knowledge entries yet.</p>}</section>
    </div>
  </AppShell>
}
