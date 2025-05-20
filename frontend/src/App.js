import React, { useEffect, useState } from 'react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(setTasks);
  }, []);

  const addTask = () => {
    if (!newTitle.trim()) return;
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    .then(res => res.json())
    .then(task => {
      setTasks(prev => [...prev, task]);
      setNewTitle('');
    });
  };

  const toggleTask = (task) => {
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    .then(res => res.json())
    .then(updated => {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    });
  };

  const deleteTask = (id) => {
    fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      .then(() => setTasks(prev => prev.filter(t => t.id !== id)));
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Task Manager</h1>
      <div className="flex mb-2">
        <input
          className="border flex-1 p-2"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title"
        />
        <button
          className="ml-2 px-4 py-2 bg-blue-500 text-white"
          onClick={addTask}
        >Add</button>
      </div>
      <ul>
        {tasks.map(task => (
          <li key={task.id} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task)}
            />
            <span
              className={`ml-2 flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}
            >{task.title}</span>
            <button
              className="ml-2 text-red-500"
              onClick={() => deleteTask(task.id)}
            >×</button>
          </li>
        ))}
      </ul>
    </div>
)}