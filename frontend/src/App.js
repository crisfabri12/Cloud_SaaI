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
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Task Manager</h1>
      <div className="flex mb-4">
        <input
          className="border border-gray-300 rounded-l-md p-3 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title"
          onKeyDown={e => e.key === 'Enter' && addTask()}
          aria-label="New task title"
        />
        <button
          className="ml-1 px-5 py-3 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={addTask}
          aria-label="Add task"
        >
          Add
        </button>
      </div>
      <ul>
        {tasks.map(task => (
          <li
            key={task.id}
            className="flex items-center mb-3 p-3 bg-gray-50 rounded-md shadow-sm hover:bg-gray-100 transition"
          >
            <input
              id={`task-${task.id}`}
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              aria-label={`Mark ${task.title} as completed`}
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`ml-3 flex-1 cursor-pointer select-none ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {task.title}
            </label>
            <button
              className="ml-4 text-red-500 hover:text-red-700 focus:outline-none"
              onClick={() => deleteTask(task.id)}
              aria-label={`Delete task ${task.title}`}
              title="Delete task"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="text-center text-gray-500 mt-10 italic">No tasks yet, add one above!</p>
      )}
    </div>
  );
}
