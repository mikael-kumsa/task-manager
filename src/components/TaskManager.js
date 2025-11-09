// src/components/TaskManager.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import CreateBoardModal from './CreateBoardModal';
import './TaskManager.css';

// Sortable Task Component
const SortableTask = ({ task, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`task-card ${isDragging ? 'dragging' : ''}`}
        >
            {/* Drag handle area - only this part is draggable */}
            <div className="drag-handle" {...attributes} {...listeners}>
                ⋮⋮
            </div>

            <div className="task-content">
                {task.content}
            </div>
            <div className="task-actions">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                    }}
                    className="edit-btn"
                    title="Edit task"
                >
                    ✏️
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this task?')) {
                            onDelete(task.id);
                        }
                    }}
                    className="delete-btn"
                    title="Delete task"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

// Column Component
const Column = ({ column, tasks, onAddTask, onEditTask, onDeleteTask }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isOver,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const columnTasks = column.taskIds.map(taskId => tasks[taskId]).filter(Boolean);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`column ${isOver ? 'drag-over' : ''}`}
        >
            <h3 {...listeners}>
                {column.title}
                <span className="task-count">({column.taskIds.length})</span>
            </h3>

            <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="tasks-list">
                    {columnTasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </div>
            </SortableContext>

            <button
                onClick={() => onAddTask(column)}
                className="add-task-btn"
            >
                + Add Task
            </button>
        </div>
    );
};

function TaskManager({ user }) {
    const { isDarkMode, toggleTheme } = useTheme();
    const [boards, setBoards] = useState([]);
    const [currentBoard, setCurrentBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [switchingBoard, setSwitchingBoard] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Save board to Firebase
    const saveBoardToFirebase = async (board) => {
        try {
            if (board && board.id) {
                const boardRef = doc(db, 'boards', board.id);
                await setDoc(boardRef, {
                    ...board,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
                console.log('Board saved to Firebase:', board.title, 'Tasks:', Object.keys(board.tasks || {}).length);
            }
        } catch (error) {
            console.error('Error saving board to Firebase:', error);
        }
    };

    // Update boards state when current board changes
    const updateBoardsState = (updatedBoard) => {
        setBoards(prev => prev.map(board =>
            board.id === updatedBoard.id ? updatedBoard : board
        ));
    };

    // Load all boards for the user
    useEffect(() => {
        const loadBoards = async () => {
            try {
                const boardsRef = collection(db, 'boards');
                const querySnapshot = await getDocs(boardsRef);
                const userBoards = [];

                querySnapshot.forEach((doc) => {
                    const boardData = doc.data();
                    if (boardData.userId === user.uid) {
                        userBoards.push({
                            id: doc.id,
                            ...boardData,
                            // Ensure tasks and columns exist
                            tasks: boardData.tasks || {},
                            columns: boardData.columns || [
                                { id: 'todo', title: 'To Do', taskIds: [] },
                                { id: 'inprogress', title: 'In Progress', taskIds: [] },
                                { id: 'stuck', title: 'Stuck', taskIds: [] },
                                { id: 'done', title: 'Done', taskIds: [] }
                            ]
                        });
                    }
                });

                console.log('Loaded boards:', userBoards.map(b => ({
                    title: b.title,
                    taskCount: Object.keys(b.tasks || {}).length
                })));

                setBoards(userBoards);

                if (userBoards.length > 0) {
                    setCurrentBoard(userBoards[0]);
                }
            } catch (error) {
                console.error('Error loading boards:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBoards();
    }, [user.uid]);

    // Auto-save when board changes
    useEffect(() => {
        if (currentBoard && !loading && !switchingBoard) {
            const autoSave = setTimeout(() => {
                saveBoardToFirebase(currentBoard);
                // Also update the boards state to keep it in sync
                updateBoardsState(currentBoard);
            }, 500); // Save 0.5 second after changes

            return () => clearTimeout(autoSave);
        }
    }, [currentBoard, loading, switchingBoard]);

    const handleLogout = () => {
        signOut(auth);
    };

    const handleCreateBoard = async (boardName) => {
        const newBoard = {
            id: Date.now().toString(),
            title: boardName || 'New Board',
            columns: [
                {
                    id: 'todo',
                    title: 'To Do',
                    taskIds: []
                },
                {
                    id: 'inprogress',
                    title: 'In Progress',
                    taskIds: []
                },
                {
                    id: 'stuck',
                    title: 'Stuck',
                    taskIds: []
                },
                {
                    id: 'done',
                    title: 'Done',
                    taskIds: []
                }
            ],
            tasks: {},
            createdAt: new Date().toISOString(),
            userId: user.uid
        };

        setBoards(prev => [...prev, newBoard]);
        setCurrentBoard(newBoard);
        await saveBoardToFirebase(newBoard);
    };

    const handleSwitchBoard = async (board) => {
        if (currentBoard?.id === board.id) return; // Already on this board

        setSwitchingBoard(true);
        console.log('Switching from:', currentBoard?.title, 'to:', board.title);

        // First, ensure current board is saved
        if (currentBoard) {
            console.log('Saving current board before switch...');
            await saveBoardToFirebase(currentBoard);
            updateBoardsState(currentBoard);
        }

        // Then switch to the new board
        setCurrentBoard(board);
        setSwitchingBoard(false);
        console.log('Board switch complete');
    };

    const handleDeleteBoard = async (boardId) => {
        if (window.confirm('Are you sure you want to delete this board? All tasks will be lost.')) {
            try {
                // Delete from Firebase
                await deleteDoc(doc(db, 'boards', boardId));

                // Update local state
                const updatedBoards = boards.filter(board => board.id !== boardId);
                setBoards(updatedBoards);

                // Switch to another board if available
                if (updatedBoards.length > 0) {
                    setCurrentBoard(updatedBoards[0]);
                } else {
                    setCurrentBoard(null);
                }
            } catch (error) {
                console.error('Error deleting board:', error);
            }
        }
    };

    const handleAddTask = async (column, content) => {
        if (!content) return;

        const newTask = {
            id: Date.now().toString(),
            content: content.trim(),
            columnId: column.id,
            createdAt: new Date().toISOString()
        };

        const updatedBoard = {
            ...currentBoard,
            tasks: {
                ...currentBoard.tasks,
                [newTask.id]: newTask
            },
            columns: currentBoard.columns.map(col =>
                col.id === column.id
                    ? { ...col, taskIds: [...col.taskIds, newTask.id] }
                    : col
            )
        };

        setCurrentBoard(updatedBoard);
        // Update boards state immediately
        updateBoardsState(updatedBoard);
    };

    const handleEditTask = async (taskId, newContent) => {
        if (!newContent.trim()) return;

        const updatedBoard = {
            ...currentBoard,
            tasks: {
                ...currentBoard.tasks,
                [taskId]: {
                    ...currentBoard.tasks[taskId],
                    content: newContent.trim(),
                    updatedAt: new Date().toISOString()
                }
            }
        };

        setCurrentBoard(updatedBoard);
        // Update boards state immediately
        updateBoardsState(updatedBoard);
    };

    const handleDeleteTask = async (taskId) => {
        const taskColumn = currentBoard.columns.find(column =>
            column.taskIds.includes(taskId)
        );

        if (!taskColumn) return;

        const updatedBoard = {
            ...currentBoard,
            tasks: { ...currentBoard.tasks },
            columns: currentBoard.columns.map(column =>
                column.id === taskColumn.id
                    ? { ...column, taskIds: column.taskIds.filter(id => id !== taskId) }
                    : column
            )
        };

        delete updatedBoard.tasks[taskId];

        setCurrentBoard(updatedBoard);
        // Update boards state immediately
        updateBoardsState(updatedBoard);
    };

    // Drag and Drop Handlers
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find source and destination columns
        const sourceColumn = currentBoard.columns.find(col =>
            col.taskIds.includes(activeId)
        );
        const overColumn = currentBoard.columns.find(col =>
            col.id === overId
        );

        if (!sourceColumn || !overColumn) return;

        // Moving within same column
        if (sourceColumn.id === overColumn.id) {
            const oldIndex = sourceColumn.taskIds.indexOf(activeId);
            const newIndex = overColumn.taskIds.indexOf(overId);

            if (oldIndex !== newIndex && newIndex >= 0) {
                const newTaskIds = arrayMove(sourceColumn.taskIds, oldIndex, newIndex);

                const updatedBoard = {
                    ...currentBoard,
                    columns: currentBoard.columns.map(col =>
                        col.id === sourceColumn.id
                            ? { ...col, taskIds: newTaskIds }
                            : col
                    )
                };

                setCurrentBoard(updatedBoard);
                updateBoardsState(updatedBoard);
            }
        } else {
            // Moving to different column
            const sourceTaskIds = sourceColumn.taskIds.filter(id => id !== activeId);
            const overIndex = overColumn.taskIds.indexOf(overId);
            const destTaskIds = [
                ...overColumn.taskIds.slice(0, overIndex >= 0 ? overIndex : overColumn.taskIds.length),
                activeId,
                ...overColumn.taskIds.slice(overIndex >= 0 ? overIndex : overColumn.taskIds.length)
            ];

            const updatedBoard = {
                ...currentBoard,
                tasks: {
                    ...currentBoard.tasks,
                    [activeId]: {
                        ...currentBoard.tasks[activeId],
                        columnId: overColumn.id
                    }
                },
                columns: currentBoard.columns.map(col => {
                    if (col.id === sourceColumn.id) {
                        return { ...col, taskIds: sourceTaskIds };
                    }
                    if (col.id === overColumn.id) {
                        return { ...col, taskIds: destTaskIds };
                    }
                    return col;
                })
            };

            setCurrentBoard(updatedBoard);
            updateBoardsState(updatedBoard);
        }
    };

    if (loading) {
        return (
            <div className="task-manager">
                <div className="loading-state">Loading your boards...</div>
            </div>
        );
    }

    const activeTask = activeId ? currentBoard.tasks[activeId] : null;

    return (
        <div className="task-manager">
            {switchingBoard && (
                <div className="switching-overlay">
                    <div className="loading-spinner">Switching boards...</div>
                </div>
            )}

            <header className="task-manager-header">
                <div className="header-content">
                    <h1>{user.email.toUpperCase().split('@')[0]}'s Task Manager</h1>
                    <div className="user-info">
                        <span>Welcome, {user.email}</span>
                        <button onClick={toggleTheme} className="theme-toggle-btn">
                            {isDarkMode ? '☀️' : '🌑'}
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Boards Navigation */}
            <div className="boards-navigation">
                <div className="boards-tabs">
                    {boards.map((board) => (
                        <button
                            key={board.id}
                            onClick={() => handleSwitchBoard(board)}
                            className={`board-tab ${currentBoard?.id === board.id ? 'active' : ''}`}
                            disabled={switchingBoard}
                        >
                            {board.title}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBoard(board.id);
                                }}
                                className="delete-board-btn"
                                title="Delete board"
                                disabled={switchingBoard}
                            >
                                ×
                            </button>
                        </button>
                    ))}
                    <button
                        onClick={() => setIsCreateBoardModalOpen(true)}
                        className="add-board-btn"
                        disabled={switchingBoard}
                    >
                        + New Board
                    </button>
                </div>
            </div>

            <div className="task-manager-content">
                <div className="boards-container">
                    {currentBoard ? (
                        <div className="board-view">
                            <h2>{currentBoard.title}</h2>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="columns-container">
                                    {currentBoard.columns.map(column => (
                                        <Column
                                            key={column.id}
                                            column={column}
                                            tasks={currentBoard.tasks}
                                            onAddTask={(col) => {
                                                setSelectedColumn(col);
                                                setIsAddModalOpen(true);
                                            }}
                                            onEditTask={(task) => {
                                                setSelectedTask(task);
                                                setIsEditModalOpen(true);
                                            }}
                                            onDeleteTask={handleDeleteTask}
                                        />
                                    ))}
                                </div>

                                <DragOverlay>
                                    {activeTask ? (
                                        <div className="task-card dragging-overlay">
                                            {activeTask.content}
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h2>No boards yet</h2>
                            <p>Create your first board to get started!</p>
                            <button
                                onClick={() => setIsCreateBoardModalOpen(true)}
                                className="create-board-btn"
                            >
                                Create Board
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddTask={(content) => {
                    if (selectedColumn) {
                        handleAddTask(selectedColumn, content);
                    }
                }}
                columnTitle={selectedColumn?.title || ''}
            />

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSaveTask={(content) => {
                    if (selectedTask) {
                        handleEditTask(selectedTask.id, content);
                    }
                }}
                task={selectedTask}
            />

            {/* Create Board Modal */}
            <CreateBoardModal
                isOpen={isCreateBoardModalOpen}
                onClose={() => setIsCreateBoardModalOpen(false)}
                onCreateBoard={handleCreateBoard}
            />
        </div>
    );
}

export default TaskManager;