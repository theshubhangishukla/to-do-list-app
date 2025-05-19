const inputBox = document.getElementById('input-box');
const listContainer = document.getElementById('list-container');
const tasksCounter = document.getElementById('tasks-counter');
const themeToggle = document.querySelector('.theme-toggle');
const searchBtn = document.getElementById('search-btn');
const searchBar = document.getElementById('search-bar');
const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-task-input');
const sortSelect = document.getElementById('sort-select');

let tasks = [];
let currentEditId = null;

// Initialize app
function init() {
    loadData();
    setupEventListeners();
    setupServiceWorker();
}

// Event Listeners
function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    searchBtn.addEventListener('click', toggleSearch);
    document.querySelector('.close-search').addEventListener('click', toggleSearch);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('save-edit').addEventListener('click', saveEdit);
    document.getElementById('cancel-edit').addEventListener('click', closeModal);
    sortSelect.addEventListener('change', () => renderTasks());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'n') {
            inputBox.focus();
        }
    });
}

// Service Worker
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.log('SW registration failed:', err));
    }
}

// Theme Management
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme'));
}

// Search Functionality
function toggleSearch() {
    searchBar.classList.toggle('active');
}

// Task Management
function addTask() {
    const taskText = inputBox.value.trim();
    if (!taskText) return;

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        category: document.getElementById('category-select').value,
        priority: document.getElementById('priority-select').value,
        dueDate: document.getElementById('due-date').value,
        createdAt: new Date().toISOString(),
        notes: '',
        subtasks: []
    };

    tasks.unshift(newTask);
    inputBox.value = '';
    saveData();
    renderTasks();
}

function renderTasks(filterType = 'all') {
    const filter = document.querySelector('.filter-btn.active').dataset.filter;
    const sortBy = sortSelect.value;
    
    let filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    filteredTasks.sort((a, b) => {
        if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
        if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return 0;
    });

    listContainer.innerHTML = filteredTasks.map(task => `
        <li class="task-item" data-id="${task.id}">
            <div class="task-content">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${task.id})">
                <span class="priority-tag ${task.priority}">${task.priority}</span>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                ${task.dueDate ? `
                    <span class="due-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(task.dueDate).toLocaleDateString()}
                    </span>
                ` : ''}
            </div>
            <div class="task-actions">
                <button class="icon-btn" onclick="openEditModal(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');

    updateCounters();
}

// Modal Functions
function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    currentEditId = taskId;
    editInput.value = task.text;
    editModal.style.display = 'flex';
}

function saveEdit() {
    if (currentEditId) {
        const task = tasks.find(t => t.id === currentEditId);
        task.text = editInput.value.trim();
        saveData();
        renderTasks();
    }
    closeModal();
}

function closeModal() {
    editModal.style.display = 'none';
    currentEditId = null;
}

// Data Management
function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateCounters();
}

function loadData() {
    tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    renderTasks();
}

function updateCounters() {
    const activeTasks = tasks.filter(t => !t.completed).length;
    const completedTasks = tasks.length - activeTasks;
    
    tasksCounter.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} remaining`;
    document.getElementById('completed-counter').textContent = `${completedTasks} completed`;
}

// Initialize the app
init();