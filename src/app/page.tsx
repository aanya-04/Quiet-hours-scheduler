

'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from './lib/supabase_client'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface Slot {
  _id: string
  title: string
  startTime: Date
  endTime: Date
  email: string
  reminderSent: boolean
}

interface SlotResponse {
  _id: string
  title: string
  startTime: string
  endTime: string
  email: string
  reminderSent: boolean
}

export default function Dashboard() {
  const [submiting, setsubmiting] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null)
  const [crons, setCrons] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const router = useRouter();
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        setSession(session)

        if (session?.user?.email) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getslot/${session.user.email}`, { cache: "no-store" })
          if (!res.ok) return
          const data = await res.json()
          const slots: Slot[] = data.slots.map((slot: SlotResponse) => ({
            ...slot,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
          }))
          setCrons(slots)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    getSession()
  }, [])

  const handleAddSlot = async () => {
    if (!title || !date || !startTime || !endTime) {
      alert('Please fill in all fields.')
      return
    }
    setsubmiting(true)
    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)

    if (start < new Date()) {
      alert('You cannot create a slot in the past.')
      setsubmiting(false)
      return
    }
    if (start >= end) {
      alert('End time must be after start time.')
      setsubmiting(false)
      return
    }

    const hasOverlap = crons.some(slot =>
      (start < slot.endTime && end > slot.startTime)
    )
    if (hasOverlap) {
      alert("This slot overlaps with an existing one.")
      setsubmiting(false)
      return
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/addslot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        startTime: start,
        endTime: end,
        email: session?.user?.email
      })
    })
    const data = await res.json()
    const newSlot: Slot = {
      ...data.slot,
      startTime: new Date(data.slot.startTime),
      endTime: new Date(data.slot.endTime),
    }
    setCrons(prev => [...prev, newSlot])
    setAdding(false)
    setTitle('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setsubmiting(false)
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setCrons([]);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/deleteslot/${id}`, { method: 'DELETE' })
      setCrons(prev => prev.filter(slot => slot._id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-purple-50 to-pink-50">
      <p className="text-purple-700 text-xl font-semibold animate-pulse">Loading dashboard...</p>
    </div>
  )

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-yellow-50 to-orange-50">
      <div className="p-10 bg-white shadow-2xl rounded-3xl text-center max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">Please log in to continue.</p>
        <button onClick={() => router.push('auth/sign-in')} className="px-6 py-2 bg-yellow-500 text-white rounded-2xl shadow hover:bg-yellow-600 transition">
          Go to Login
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Hello, <span className="text-pink-600">{session.user.user_metadata?.name || session.user.email}</span>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setAdding(!adding)}
              className="px-5 py-2 bg-pink-500 text-white font-medium rounded-2xl shadow hover:bg-pink-600 transition"
            >
              {adding ? 'Cancel' : '+ Add Slot'}
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500 text-white font-medium rounded-2xl shadow hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add Slot Form */}
        {adding && (
          <div className="mb-10 p-6 border border-pink-200 rounded-3xl bg-pink-50 shadow-inner">
            <h2 className="text-lg font-semibold text-pink-700 mb-4">Add New Slot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Slot Title" value={title} onChange={e => setTitle(e.target.value)} className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500" />
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500" />
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500" />
            </div>
            <button disabled={submiting} onClick={handleAddSlot} className="mt-6 w-full py-3 bg-purple-600 text-white font-semibold rounded-2xl shadow hover:bg-purple-700 transition">
              Save Slot
            </button>
          </div>
        )}

        {/* Slots List */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Your Study Slots</h2>
        {crons.length === 0 ? (
          <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center">
            <p className="text-gray-500 text-lg">No slots scheduled yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {crons.map((cron) => (
              <div key={cron._id} className="relative p-6 bg-gradient-to-br from-pink-50 via-white to-purple-100 rounded-3xl shadow-lg border border-pink-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <p className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">{cron.title}</p>
                <p className="text-gray-700 flex items-center mb-2"><span className="mr-2">📅</span><span className="font-medium">{cron.startTime.toLocaleDateString()}</span></p>
                <p className="text-gray-700 flex items-center mb-4"><span className="mr-2">⏰</span>{cron.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {cron.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${cron.reminderSent ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                  {cron.reminderSent ? 'Notified' : 'Pending'}
                </span>
                <button onClick={() => handleDelete(cron._id)} className="absolute top-4 right-4 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}





