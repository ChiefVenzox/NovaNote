const { ipcRenderer } = require('electron');
const i18n = require('./i18n');

// --- Elements ---
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const closeBtn = document.getElementById('close-btn');
const minBtn = document.getElementById('min-btn');
const themeBtn = document.getElementById('theme-btn');
const todoInput = document.getElementById('todo-input');
const timeInput = document.getElementById('todo-time');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note-btn');
const notesList = document.getElementById('notes-list');

// Time Picker Elements
const timePopup = document.getElementById('time-popup');
const timeOptions = document.querySelectorAll('.time-option');
const customTimeInput = document.getElementById('custom-time-input');
const customTimeAdd = document.getElementById('custom-time-add');
const timeClear = document.getElementById('time-clear');

// Pomodoro Elements
const pomodoroTime = document.getElementById('pomodoro-time');
const pomodoroLabel = document.getElementById('pomodoro-label');
const pomodoroStart = document.getElementById('pomodoro-start');
const pomodoroReset = document.getElementById('pomodoro-reset');
const pomodoroSection = document.querySelector('.pomodoro-section');

// Stats Elements
const statToday = document.getElementById('stat-today');
const statWeek = document.getElementById('stat-week');
const statTotal = document.getElementById('stat-total');

// Language Elements
const langBtn = document.getElementById('lang-btn');
const langDropdown = document.getElementById('lang-dropdown');
const langOptions = document.querySelectorAll('.lang-option');

// --- State ---
let currentTab = 'daily';
let todos = [];
let completedTasks = [];
let pomodoroInterval = null;
let pomodoroSeconds = 25 * 60;
let isWorkSession = true;
let currentTheme = 'dark';
let notes = [];

// --- Language Selector ---
langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle('show');
});

langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        i18n.setLanguage(lang);
        langDropdown.classList.remove('show');
        updateClock(); // Refresh date format
        renderTodos(); // Refresh category badges
    });
});

document.addEventListener('click', () => {
    langDropdown.classList.remove('show');
});

// --- Window Controls ---
closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-app');
});

minBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-app');
});

// --- Theme Toggle ---
function loadTheme() {
    const savedTheme = localStorage.getItem('nova-theme') || 'dark';
    currentTheme = savedTheme;
    document.body.setAttribute('data-theme', savedTheme);
    themeBtn.textContent = savedTheme === 'dark' ? '◐' : '◑';
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    themeBtn.textContent = currentTheme === 'dark' ? '◐' : '◑';
    localStorage.setItem('nova-theme', currentTheme);
}

themeBtn.addEventListener('click', toggleTheme);
loadTheme();

// --- Clock Logic ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;

    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateEl.textContent = now.toLocaleDateString(i18n.getDateLocale(), options);
}

setInterval(updateClock, 1000);
updateClock();

// --- Pomodoro Timer ---
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updatePomodoroDisplay() {
    pomodoroTime.textContent = formatTime(pomodoroSeconds);
    pomodoroLabel.textContent = isWorkSession ? i18n.t('focus') : i18n.t('break');
}

function startPomodoro() {
    if (pomodoroInterval) {
        // Pause
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        pomodoroStart.textContent = '▶';
        pomodoroStart.classList.remove('active');
        pomodoroSection.classList.remove('running');
    } else {
        // Start
        pomodoroStart.textContent = '⏸';
        pomodoroStart.classList.add('active');
        pomodoroSection.classList.add('running');
        pomodoroInterval = setInterval(() => {
            pomodoroSeconds--;
            updatePomodoroDisplay();

            if (pomodoroSeconds <= 0) {
                clearInterval(pomodoroInterval);
                pomodoroInterval = null;

                // Switch session
                if (isWorkSession) {
                    isWorkSession = false;
                    pomodoroSeconds = 5 * 60; // 5 min break
                } else {
                    isWorkSession = true;
                    pomodoroSeconds = 25 * 60; // 25 min work
                }

                updatePomodoroDisplay();
                pomodoroStart.textContent = '▶';
                pomodoroStart.classList.remove('active');
                pomodoroSection.classList.remove('running');

                // Browser notification with translated message
                new Notification('Nova Dashboard', {
                    body: isWorkSession ? i18n.t('breakOver') : i18n.t('workDone'),
                    silent: false
                });
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    isWorkSession = true;
    pomodoroSeconds = 25 * 60;
    updatePomodoroDisplay();
    pomodoroStart.textContent = '▶';
    pomodoroStart.classList.remove('active');
    pomodoroSection.classList.remove('running');
}

pomodoroStart.addEventListener('click', startPomodoro);
pomodoroReset.addEventListener('click', resetPomodoro);
updatePomodoroDisplay();

// --- Statistics ---
function updateStats() {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    let todayCount = 0;
    let weekCount = 0;

    completedTasks.forEach(task => {
        const taskDate = new Date(task.completedAt);
        if (taskDate.toDateString() === todayStr) {
            todayCount++;
        }
        if (taskDate >= weekStart) {
            weekCount++;
        }
    });

    statToday.textContent = todayCount;
    statWeek.textContent = weekCount;
    statTotal.textContent = completedTasks.length;
}

// --- Tab Logic ---
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        renderTodos();
    });
});

// --- To-Do Logic ---
function renderTodos() {
    todoList.innerHTML = '';

    let filteredTodos = [];
    if (currentTab === 'general') {
        filteredTodos = todos;
    } else {
        filteredTodos = todos.filter(todo => todo.category === currentTab);
    }

    filteredTodos.forEach((todo) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        const timeBadge = todo.deadline ? `<span class="todo-badge">${todo.deadline}</span>` : '';

        let categoryBadge = '';
        if (currentTab === 'general') {
            let catName = '';
            let catClass = '';

            if (todo.category === 'daily') { catName = i18n.t('catDaily'); catClass = 'cat-daily'; }
            else if (todo.category === 'weekly') { catName = i18n.t('catWeekly'); catClass = 'cat-weekly'; }
            else { catName = i18n.t('catOther'); catClass = 'cat-others'; }

            categoryBadge = `<span class="category-badge ${catClass}">${catName}</span>`;
        }

        li.innerHTML = `
            <div class="todo-item-left">
                <div class="todo-checkbox" data-id="${todo.id}"></div>
                ${categoryBadge}
                <div class="todo-content">
                    <span class="todo-text">${todo.text}</span>
                    ${timeBadge}
                </div>
            </div>
            <button class="todo-delete" data-id="${todo.id}">&times;</button>
        `;

        // Toggle completion
        li.querySelector('.todo-checkbox').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTodo(todo.id);
        });

        li.querySelector('.todo-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
        });

        todoList.appendChild(li);
    });
}

function addTodo() {
    const text = todoInput.value.trim();
    const time = timeInput.value.trim();

    if (text === '') return;

    const categoryToSave = (currentTab === 'general') ? 'others' : currentTab;

    const newTodo = {
        id: Date.now(),
        text: text,
        deadline: time,
        category: categoryToSave,
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    saveTodos();
    renderTodos();

    todoInput.value = '';
    timeInput.value = '';
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;

        if (todo.completed) {
            // Add to completed tasks for stats
            completedTasks.push({
                id: todo.id,
                text: todo.text,
                completedAt: new Date().toISOString()
            });
            saveCompletedTasks();
            updateStats();
        } else {
            // Remove from completed tasks
            completedTasks = completedTasks.filter(t => t.id !== id);
            saveCompletedTasks();
            updateStats();
        }

        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    completedTasks = completedTasks.filter(t => t.id !== id);
    saveTodos();
    saveCompletedTasks();
    renderTodos();
    updateStats();
}

const handleEnter = (e) => {
    if (e.key === 'Enter') addTodo();
};

todoInput.addEventListener('keypress', handleEnter);
addBtn.addEventListener('click', addTodo);

// --- Time Picker Popup ---
function showTimePopup() {
    timePopup.classList.add('show');
}

function hideTimePopup() {
    timePopup.classList.remove('show');
}

timeInput.addEventListener('click', (e) => {
    e.stopPropagation();
    if (timePopup.classList.contains('show')) {
        hideTimePopup();
    } else {
        showTimePopup();
    }
});

timeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        timeInput.value = option.dataset.value;
        hideTimePopup();
    });
});

customTimeAdd.addEventListener('click', (e) => {
    e.stopPropagation();
    if (customTimeInput.value) {
        timeInput.value = customTimeInput.value;
        customTimeInput.value = '';
        hideTimePopup();
    }
});

timeClear.addEventListener('click', (e) => {
    e.stopPropagation();
    timeInput.value = '';
    hideTimePopup();
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    if (!timePopup.contains(e.target) && e.target !== timeInput) {
        hideTimePopup();
    }
});

// Prevent popup from closing when clicking inside
timePopup.addEventListener('click', (e) => {
    e.stopPropagation();
});

// --- Notes ---
function renderNotes() {
    notesList.innerHTML = '';
    notes.forEach((note) => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `
            <span class="note-text">${note.text}</span>
            <button class="note-delete" data-id="${note.id}">&times;</button>
        `;
        li.querySelector('.note-delete').addEventListener('click', () => {
            deleteNote(note.id);
        });
        notesList.appendChild(li);
    });
}

function addNote() {
    const text = noteInput.value.trim();
    if (text === '') return;

    const newNote = {
        id: Date.now(),
        text: text,
        createdAt: new Date().toISOString()
    };

    notes.push(newNote);
    saveNotes();
    renderNotes();
    noteInput.value = '';
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
}

function saveNotes() {
    localStorage.setItem('nova-notes-v2', JSON.stringify(notes));
}

function loadNotes() {
    const stored = localStorage.getItem('nova-notes-v2');
    if (stored) {
        notes = JSON.parse(stored);
    } else {
        notes = [];
    }
    renderNotes();
}

noteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNote();
});
addNoteBtn.addEventListener('click', addNote);
loadNotes();

// --- Local Storage ---
function saveTodos() {
    localStorage.setItem('nova-todos-v4', JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem('nova-todos-v4');
    if (stored) {
        todos = JSON.parse(stored);
    } else {
        // Try to migrate from v3
        const oldStored = localStorage.getItem('nova-todos-v3');
        if (oldStored) {
            todos = JSON.parse(oldStored).map(t => ({
                ...t,
                completed: false,
                createdAt: new Date().toISOString()
            }));
            saveTodos();
        } else {
            todos = [];
        }
    }
    renderTodos();
}

function saveCompletedTasks() {
    localStorage.setItem('nova-completed', JSON.stringify(completedTasks));
}

function loadCompletedTasks() {
    const stored = localStorage.getItem('nova-completed');
    if (stored) {
        completedTasks = JSON.parse(stored);
    } else {
        completedTasks = [];
    }
    updateStats();
}

// Listen for language changes
document.addEventListener('languageChanged', () => {
    updatePomodoroDisplay();
    renderTodos();
});

// Initialize
i18n.loadSavedLanguage();
loadTodos();
loadCompletedTasks();
