import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

function App() {
    const [todos, setTodos] = useState([]);
    const [folders, setFolders] = useState([]);
    const [priorityLevels, setPriorityLevels] = useState([]);
    const [newTodoInput, setNewTodoInput] = useState('');
    const [newFolderInput, setNewFolderInput] = useState('');
    const [activeFolder, setActiveFolder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newTodoCreatedAt, setNewTodoCreatedAt] = useState(new Date());
    const [selectedPriority, setSelectedPriority] = useState(null);
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [selectedTodoIds, setSelectedTodoIds] = useState(new Set());
    const [selectedMoveFolder, setSelectedMoveFolder] = useState("");

    const formatDateToYYYYMMDD = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchTodos();
            await fetchFolders();
            await fetchPriorityLevels();
            setLoading(false);
        };
        fetchData();
    }, []);

    const fetchTodos = async (folderId = null) => {
        let url = 'http://localhost:8000/todos/';
        if (folderId !== null) {
            url += `?folder_id=${folderId}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setTodos(data);
    };

    const fetchFolders = async () => {
        const response = await fetch('http://localhost:8000/folders/');
        const data = await response.json();
        setFolders(data);
    };

    const fetchPriorityLevels = async () => {
        const response = await fetch('http://localhost:8000/priority_levels/');
        const data = await response.json();
        setPriorityLevels(data);
        if (data.length > 0) {
            setSelectedPriority(data[0].id);
        }
    };

    const addTodo = async () => {
        if (newTodoInput.trim() === '') return;
        const response = await fetch('http://localhost:8000/todos/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTodoInput,
                completed: false,
                folder_id: activeFolder,
                created_at: formatDateToYYYYMMDD(newTodoCreatedAt),
                priority_level_id: selectedPriority,
            }),
        });
        await response.json();
        setNewTodoInput('');
        setNewTodoCreatedAt(new Date());
        fetchTodos(activeFolder);
    };

    const updateTodo = async (todoId, updatedFields) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;
        const response = await fetch(`http://localhost:8000/todos/${todoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...todo, ...updatedFields }),
        });
        const updatedTodo = await response.json();
        setTodos(todos.map(t => (t.id === todoId ? updatedTodo : t)));
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        const newCompleted = !todo.completed;
        // 如果取消完成，則清空 completed_at；如果設為完成，則不自動設定日期，讓使用者手動選擇
        const newCompletedAt = newCompleted ? todo.completed_at : null;
        await updateTodo(id, { completed: newCompleted, completed_at: newCompletedAt });
    };

    const handleCompletedAtChange = async (id, date) => {
        await updateTodo(id, { completed_at: formatDateToYYYYMMDD(date) });
    };

    const toggleTodoSelection = (id) => {
        const newSelection = new Set(selectedTodoIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedTodoIds(newSelection);
    };

    const deleteSelectedTodos = async () => {
        const todoIds = Array.from(selectedTodoIds);
        if (todoIds.length === 0) return;
        await fetch('http://localhost:8000/todos/', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ todo_ids: todoIds }),
        });
        setTodos(todos.filter(t => !selectedTodoIds.has(t.id)));
        setSelectedTodoIds(new Set());
    };

    const moveSelectedTodos = async () => {
        const todoIds = Array.from(selectedTodoIds);
        if (todoIds.length === 0 || selectedMoveFolder === "") return;

        const targetFolderId = selectedMoveFolder === 'null' ? null : parseInt(selectedMoveFolder);
        const payload = { todo_ids: todoIds, folder_id: targetFolderId };
        console.log("Sending move request payload:", payload);

        await fetch('http://localhost:8000/todos/move', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        // 重新獲取 todos 以更新 UI
        fetchTodos();
        setSelectedTodoIds(new Set());
        setSelectedMoveFolder(""); // 重置選擇
    };

    const addFolder = async () => {
        if (newFolderInput.trim() === '') return;
        const response = await fetch('http://localhost:8000/folders/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newFolderInput }),
        });
        await response.json();
        setNewFolderInput('');
        fetchFolders();
    };

    const deleteFolder = async (id) => {
        await fetch(`http://localhost:8000/folders/${id}`, {
            method: 'DELETE',
        });
        setFolders(folders.filter(f => f.id !== id));
        if (activeFolder === id) {
            setActiveFolder(null);
            fetchTodos(null);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId.startsWith('folder-')) {
            const folderId = parseInt(destination.droppableId.replace('folder-', ''));
            const todoId = parseInt(draggableId);
            await updateTodo(todoId, { folder_id: folderId });
            fetchTodos(activeFolder);
        }
    };

    const handlePriorityChange = async (todoId, newPriorityId) => {
        await updateTodo(todoId, { priority_level_id: newPriorityId });
        setEditingTodoId(null);
    };

    const filteredTodos = activeFolder === null
        ? todos
        : todos.filter(todo => todo.folder_id === activeFolder);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="App">
                <div className="sidebar">
                    <h2>Folders</h2>
                    <div className="folder-input">
                        <input
                            type="text"
                            placeholder="New folder name"
                            value={newFolderInput}
                            onChange={(e) => setNewFolderInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addFolder()}
                        />
                        <button onClick={addFolder}>Add Folder</button>
                    </div>
                    <ul>
                        <li
                            className={activeFolder === null ? 'active' : ''}
                            onClick={() => {
                                setActiveFolder(null);
                                fetchTodos(null);
                            }}
                        >
                            All Todos
                        </li>
                        {folders.map(folder => (
                            <Droppable droppableId={`folder-${folder.id}`} key={folder.id}>
                                {(provided) => (
                                    <li
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={activeFolder === folder.id ? 'active' : ''}
                                        onClick={() => {
                                            setActiveFolder(folder.id);
                                            fetchTodos(folder.id);
                                        }}
                                    >
                                        {folder.name}
                                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}>Delete</button>
                                        {provided.placeholder}
                                    </li>
                                )}
                            </Droppable>
                        ))}
                    </ul>
                </div>

                <div className="main-content">
                    <h1>Todo List {activeFolder !== null ? `(${folders.find(f => f.id === activeFolder)?.name})` : ''}</h1>
                    <div className="input-container">
                        <input
                            type="text"
                            placeholder="Todo title"
                            value={newTodoInput}
                            onChange={(e) => setNewTodoInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                        />
                        <DatePicker
                            selected={newTodoCreatedAt}
                            onChange={(date) => setNewTodoCreatedAt(date)}
                            dateFormat="yyyy/MM/dd"
                            className="date-picker-input"
                        />
                        <select
                            value={selectedPriority || ''}
                            onChange={(e) => setSelectedPriority(parseInt(e.target.value))}
                            className="priority-select"
                        >
                            {priorityLevels.map(level => (
                                <option key={level.id} value={level.id}>
                                    {level.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={addTodo}>Add Todo</button>
                    </div>

                    {selectedTodoIds.size > 0 && (
                        <div className="batch-actions">
                            <button onClick={deleteSelectedTodos} className="delete-selected-btn">
                                Delete Selected ({selectedTodoIds.size})
                            </button>
                            <select
                                value={selectedMoveFolder}
                                onChange={(e) => setSelectedMoveFolder(e.target.value)}
                                className="move-to-folder-select"
                            >
                                <option value="" disabled>Move Selected To...</option>
                                <option value="null">No Folder</option>
                                {folders.map(folder => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                            <button onClick={moveSelectedTodos}>Move</button>
                        </div>
                    )}

                    <Droppable droppableId="todos-list">
                        {(provided) => (
                            <ul {...provided.droppableProps} ref={provided.innerRef}>
                                {filteredTodos.map((todo, index) => (
                                    <Draggable key={todo.id} draggableId={String(todo.id)} index={index}>
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`${todo.completed ? 'completed' : ''} ${selectedTodoIds.has(todo.id) ? 'selected-for-action' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={todo.completed}
                                                    onChange={() => toggleTodo(todo.id)}
                                                />
                                                <span className="todo-title">
                                                    {todo.title}
                                                </span>
                                                <div className="timestamps">
                                                    <p>Created: {new Date(todo.created_at).toLocaleDateString()}</p>
                                                    {todo.completed && (
                                                        <p>Completed:
                                                            {todo.completed_at ?
                                                                new Date(todo.completed_at).toLocaleDateString() :
                                                                <DatePicker
                                                                    selected={null}
                                                                    onChange={(date) => handleCompletedAtChange(todo.id, date)}
                                                                    dateFormat="yyyy/MM/dd"
                                                                    className="date-picker-input"
                                                                />
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                {todo.priority_level && (
                                                    editingTodoId === todo.id ? (
                                                        <select
                                                            value={todo.priority_level.id}
                                                            onChange={(e) => handlePriorityChange(todo.id, parseInt(e.target.value))}
                                                            onBlur={() => setEditingTodoId(null)}
                                                            autoFocus
                                                            className="priority-select-inline"
                                                        >
                                                            {priorityLevels.map(level => (
                                                                <option key={level.id} value={level.id}>
                                                                    {level.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span
                                                            className="priority-display"
                                                            style={{ backgroundColor: todo.priority_level.color }}
                                                            onClick={() => setEditingTodoId(todo.id)}
                                                        >
                                                            {todo.priority_level.name}
                                                        </span>
                                                    )
                                                )}
                                                <button onClick={() => toggleTodoSelection(todo.id)} className="select-btn">
                                                    {selectedTodoIds.has(todo.id) ? 'Unselect' : 'Select'}
                                                </button>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </div>
            </div>
        </DragDropContext>
    );
}

export default App;
