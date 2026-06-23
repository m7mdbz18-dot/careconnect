import { useState } from 'react'

const initialTasks = [
  { id: 1, room: '204', bed: 'B', ward: 'A', time: '10:00 AM – 12:00 PM', note: 'Please handle gently, delicate items', status: 'new', requester: 'Patient' },
  { id: 2, room: '118', bed: 'A', ward: 'A', time: '8:00 AM – 10:00 AM', note: '', status: 'inprogress', requester: 'Visitor' },
  { id: 3, room: '307', bed: 'C', ward: 'B', time: '2:00 PM – 4:00 PM', note: '', status: 'done', requester: 'Patient' },
  { id: 4, room: '112', bed: 'B', ward: 'A', time: '12:00 PM – 2:00 PM', note: '', status: 'new', requester: 'Patient' },
  { id: 5, room: '205', bed: 'A', ward: 'B', time: '4:00 PM – 6:00 PM', note: 'Only bedsheets', status: 'new', requester: 'Patient' },
]

const statusConfig = {
  new: { label: 'New', color: '#0F6E56', bg: '#E1F5EE' },
  inprogress: { label: 'Picked up', color: '#854F0B', bg: '#FAEEDA' },
  done: { label: 'Returned', color: '#888', bg: '#f0f0f0' },
}

const nextStatus = { new: 'inprogress', inprogress: 'done', done: 'done' }
const nextLabel = { new: 'Mark picked up', inprogress: 'Mark returned', done: 'Completed' }

export default function LaundryDashboard() {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState('all')

  function advance(id) {
    setTasks(t => t.map(task => task.id === id ? { ...task, status: nextStatus[task.status] } : task))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    new: tasks.filter(t => t.status === 'new').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#534AB7', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Staff dashboard</p>
            <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 600 }}>Laundry</h1>
          </div>
          <div style={{ background: '#fff', color: '#534AB7', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
            {counts.new} new
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 16 }}>
          {[['all', 'All', tasks.length], ['new', 'New', counts.new], ['inprogress', 'Picked up', counts.inprogress], ['done', 'Returned', counts.done]].map(([val, label, count]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: filter === val ? '#fff' : 'rgba(255,255,255,0.2)', color: filter === val ? '#534AB7' : '#fff', fontWeight: filter === val ? 700 : 400, fontSize: 12, cursor: 'pointer' }}>
              {label} {count > 0 && `(${count})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(task => (
          <div key={task.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Room {task.room} · Bed {task.bed}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: statusConfig[task.status].bg, color: statusConfig[task.status].color, fontWeight: 600 }}>
                {statusConfig[task.status].label}
              </span>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500, color: '#111' }}>⏰ Pickup: {task.time}</p>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>Ward {task.ward} · Requested by {task.requester}</p>
              {task.note ? <p style={{ margin: '0 0 10px', fontSize: 12, color: '#555', background: '#f9f9f9', padding: '8px 10px', borderRadius: 8 }}>📝 {task.note}</p> : null}
              <button
                onClick={() => advance(task.id)}
                disabled={task.status === 'done'}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: task.status === 'done' ? '#f0f0f0' : '#534AB7', color: task.status === 'done' ? '#aaa' : '#fff', fontWeight: 600, fontSize: 13, cursor: task.status === 'done' ? 'not-allowed' : 'pointer' }}>
                {nextLabel[task.status]}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
            <p style={{ fontSize: 32 }}>✅</p>
            <p>No tasks in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}