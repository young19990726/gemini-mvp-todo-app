import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

function App() {
    const [todos, setTodos] = useState([]);
    const [folders, setFolders] = useState([]);
    const [newTodoInput, setNewTodoInput] = useState('');
    const [newFolderInput, setNewFolderInput] = useState('');
    const [activeFolder, setActiveFolder] = useState(null); // null for all todos
    const [loading, setLoading] = useState(true);
    const [newTodoCreatedAt, setNewTodoCreatedAt] = useState(new Date()); // 新增待辦事項的創建時間

    // Helper function to format date to YYYY-MM-DD string
    const formatDateToYYYYMMDD = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch todos and folders on component mount
    useEffect(() => {
        const fetchData = async () => {
            await fetchTodos();
            await fetchFolders();
            setLoading(false);
        };
        fetchData();
    }, []);

    const fetchTodos = async (folderId = null) => {
        let url = 'http://localhost:8000/todos';
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

    const addTodo = async () => {
        if (newTodoInput.trim() === '') return;

        const response = await fetch('http://localhost:8000/todos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTodoInput, // 只發送 title
            }),
        });
        const newTodo = await response.json();
        setTodos([...todos, newTodo]);
        setNewTodoInput('');
        setNewTodoCreatedAt(new Date()); // 重置為當前時間
    };

    const updateTodo = async (todoId, updatedFields) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;

        const response = await fetch(`http://localhost:8000/todos/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...todo, ...updatedFields }),
        });
        const updatedTodo = await response.json();
        setTodos(todos.map(t => (t.id === todoId ? updatedTodo : t)));
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const newCompleted = !todo.completed;
        // 如果取消完成，則將 completed_at 設為 null
        // 如果標記完成，則不自動設定 completed_at，讓使用者手動選擇
        const newCompletedAt = newCompleted ? todo.completed_at : null;

        await updateTodo(id, { completed: newCompleted, completed_at: newCompletedAt });
    };

    const handleCompletedAtChange = async (id, date) => {
        await updateTodo(id, { completed_at: formatDateToYYYYMMDD(date) }); // 發送 YYYY-MM-DD 格式字串
    };

    const deleteTodo = async (id) => {
        await fetch(`http://localhost:8000/todos/${id}`, {
            method: 'DELETE',
        });
        setTodos(todos.filter(t => t.id !== id));
    };

    const addFolder = async () => {
        if (newFolderInput.trim() === '') return;

        const response = await fetch('http://localhost:8000/folders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newFolderInput }),
        });
        const newFolder = await response.json();
        setFolders([...folders, newFolder]);
        setNewFolderInput('');
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

        if (!destination) {
            return;
        }

        if (destination.droppableId.startsWith('folder-')) {
            const folderId = parseInt(destination.droppableId.replace('folder-', ''));
            const todoId = parseInt(draggableId);
            const todoToMove = todos.find(t => t.id === todoId);

            if (todoToMove && todoToMove.completed) {
                await updateTodo(todoId, { folder_id: folderId });
                fetchTodos(activeFolder);
            }
            return;
        }

        if (source.droppableId === destination.droppableId) {
            return;
        }
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
                            value={newTodoInput} 
                            onChange={(e) => setNewTodoInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                        />
                        <DatePicker
                            selected={newTodoCreatedAt}
                            onChange={(date) => setNewTodoCreatedAt(date)}
                            dateFormat="yyyy/MM/dd" // 只顯示日期
                            className="date-picker-input"
                        />
                        <button onClick={addTodo}>Add Todo</button>
                    </div>
                    <Droppable droppableId="todos-list">
                        {(provided) => (
                            <ul 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                            >
                                {filteredTodos.map((todo, index) => (
                                    <Draggable key={todo.id} draggableId={String(todo.id)} index={index}>
                                        {(provided) => (
                                            <li 
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={todo.completed ? 'completed' : ''}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={todo.completed} 
                                                    onChange={() => toggleTodo(todo.id)}
                                                />
                                                <span onClick={() => toggleTodo(todo.id)}>
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
                                                <button onClick={() => deleteTodo(todo.id)}>Delete</button>
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