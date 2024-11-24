class TodoOrganizer {
    constructor() {
        this.todos = [];
        this.isDarkMode = false;
        this.draggedItem = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTodos();
        this.loadThemePreference();
        this.updateEmptyState();
        this.setupKeyboardShortcuts();
    }

    initializeElements() {
        // Forms and containers
        this.todoForm = document.getElementById('todoForm');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        
        // Inputs
        this.titleInput = document.getElementById('todoTitle');
        this.descriptionInput = document.getElementById('todoDescription');
        
        // Theme toggle
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Template
        this.todoTemplate = document.getElementById('todoItemTemplate');
    }

    setupEventListeners() {
        // Form submission
        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Drag and drop events for the container
        this.todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(this.todoList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement) {
                this.todoList.insertBefore(draggable, afterElement);
            } else {
                this.todoList.appendChild(draggable);
            }
        });

        // Add keyboard event for description input
        this.descriptionInput.addEventListener('keydown', (e) => {
            // Shift + Enter for new line in description
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addTodo();
            }
        });

        // Add keyboard events for title input
        this.titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.titleInput.value.trim()) {
                    if (this.descriptionInput.value.trim() || e.shiftKey) {
                        this.descriptionInput.focus();
                    } else {
                        this.addTodo();
                    }
                }
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only process shortcuts if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'n':
                    // Press 'N' to focus title input
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.titleInput.focus();
                    }
                    break;
                case 'escape':
                    // Escape to blur inputs
                    this.titleInput.blur();
                    this.descriptionInput.blur();
                    break;
                case '/':
                    // Press '/' to focus search (if we add search functionality)
                    e.preventDefault();
                    this.titleInput.focus();
                    break;
            }
        });
    }

    addTodo() {
        const title = this.titleInput.value.trim();
        const description = this.descriptionInput.value.trim();
        
        if (!title) return;

        const todo = {
            id: Date.now(),
            title,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.renderTodo(todo);
        this.saveTodos();
        this.updateEmptyState();
        
        // Reset form and focus title input for quick entry
        this.todoForm.reset();
        this.titleInput.focus();
    }

    renderTodo(todo) {
        const clone = this.todoTemplate.content.cloneNode(true);
        const todoItem = clone.querySelector('.todo-item');
        
        // Set todo content
        todoItem.dataset.id = todo.id;
        todoItem.querySelector('.todo-title').textContent = todo.title;
        todoItem.querySelector('.todo-description').textContent = todo.description;

        // Add completed class if necessary
        if (todo.completed) {
            todoItem.classList.add('completed');
        }

        // Setup drag and drop
        todoItem.addEventListener('dragstart', () => {
            todoItem.classList.add('dragging');
            this.draggedItem = todoItem;
        });

        todoItem.addEventListener('dragend', () => {
            todoItem.classList.remove('dragging');
            this.draggedItem = null;
            this.updateTodoOrder();
        });

        // Setup buttons
        const completeBtn = todoItem.querySelector('.complete-button');
        const deleteBtn = todoItem.querySelector('.delete-button');

        completeBtn.addEventListener('click', () => this.toggleComplete(todo.id));
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

        // Add keyboard navigation for todo items
        todoItem.setAttribute('tabindex', '0');
        
        todoItem.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Delete':
                case 'Backspace':
                    if (e.ctrlKey || e.metaKey) {
                        this.deleteTodo(todo.id);
                    }
                    break;
                case 'Enter':
                case ' ':
                    this.toggleComplete(todo.id);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.moveTodoUp(todoItem);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveTodoDown(todoItem);
                    break;
            }
        });

        // Add to list
        this.todoList.insertBefore(clone, this.todoList.firstChild);
    }

    toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            const todoItem = this.todoList.querySelector(`[data-id="${id}"]`);
            todoItem.classList.toggle('completed');
            this.saveTodos();
        }
    }

    deleteTodo(id) {
        const todoItem = this.todoList.querySelector(`[data-id="${id}"]`);
        if (todoItem) {
            todoItem.classList.add('fade-out');
            todoItem.addEventListener('animationend', () => {
                todoItem.remove();
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.updateEmptyState();
            });
        }
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateTodoOrder() {
        const todoElements = [...this.todoList.querySelectorAll('.todo-item')];
        const newTodos = todoElements.map(element => {
            const id = parseInt(element.dataset.id);
            return this.todos.find(t => t.id === id);
        });
        
        this.todos = newTodos;
        this.saveTodos();
    }

    updateEmptyState() {
        if (this.todos.length === 0) {
            this.emptyState.style.display = 'block';
            this.todoList.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.todoList.style.display = 'flex';
        }

        // Update counter
        const counter = document.querySelector('.todo-count');
        counter.textContent = `${this.todos.length} task${this.todos.length !== 1 ? 's' : ''}`;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            this.todos = JSON.parse(savedTodos);
            this.todos.forEach(todo => this.renderTodo(todo));
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        this.darkModeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            this.isDarkMode = savedTheme === 'true';
            document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
            this.darkModeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        }
    }

    // New methods for keyboard navigation
    moveTodoUp(todoItem) {
        const previousSibling = todoItem.previousElementSibling;
        if (previousSibling) {
            this.todoList.insertBefore(todoItem, previousSibling);
            todoItem.focus();
            this.updateTodoOrder();
        }
    }

    moveTodoDown(todoItem) {
        const nextSibling = todoItem.nextElementSibling;
        if (nextSibling) {
            this.todoList.insertBefore(nextSibling, todoItem);
            todoItem.focus();
            this.updateTodoOrder();
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoOrganizer();
});