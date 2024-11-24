class TodoOrganizer {
    constructor() {
        this.todos = [];
        this.isDarkMode = false;
        this.draggedItem = null;
        this.isPreviewMode = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTodos();
        this.loadThemePreference();
        this.updateEmptyState();
        this.setupKeyboardShortcuts();
        this.initializeMarkdown();
        this.initializeAISupport();
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
        
        this.descriptionPreview = document.getElementById('descriptionPreview');
        this.markdownModal = document.getElementById('markdownModal');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.markdownHint = document.querySelector('.hint-icon');
        this.writeButton = document.querySelector('[data-mode="write"]');
        this.previewButton = document.querySelector('[data-mode="preview"]');
        this.aiButton = document.getElementById('aiSupportBtn');
        this.aiModal = document.getElementById('aiModal');
        this.aiLoading = document.getElementById('aiLoading');
        this.aiSuggestions = document.getElementById('aiSuggestions');
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
            // Handle global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'p':
                        // Ctrl/Cmd + P: Toggle preview
                        e.preventDefault();
                        this.togglePreview();
                        break;
                    case 'n':
                        // Ctrl/Cmd + N: New task
                        e.preventDefault();
                        this.titleInput.focus();
                        break;
                    case 'enter':
                        // Ctrl/Cmd + Enter: Save task from anywhere
                        e.preventDefault();
                        if (this.titleInput.value.trim()) {
                            this.addTodo();
                        }
                        break;
                }
            }

            // Handle Escape key
            if (e.key === 'Escape') {
                if (this.isPreviewMode) {
                    e.preventDefault();
                    this.togglePreview();
                }
                // Close any open modals here
                this.markdownModal.style.display = 'none';
            }
        });

        // Handle description input shortcuts
        this.descriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd + Enter to save
                    e.preventDefault();
                    this.addTodo();
                } else if (!e.shiftKey) {
                    // Enter for new line (default behavior)
                    return;
                }
            }
        });

        // Handle title input shortcuts
        this.titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift + Enter to move to description
                    this.descriptionInput.focus();
                } else {
                    // Enter to add todo if description is empty
                    if (!this.descriptionInput.value.trim()) {
                        this.addTodo();
                    } else {
                        this.descriptionInput.focus();
                    }
                }
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
        todoItem.querySelector('.todo-description').innerHTML = marked.parse(todo.description || '');
        todoItem.querySelector('.todo-description').classList.add('markdown-body');

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
                    e.preventDefault();
                    this.deleteTodo(todo.id);
                    break;
                case ' ':
                    e.preventDefault();
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

    initializeMarkdown() {
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });

        // Mode toggle
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.dataset.mode;
                if (mode === 'preview') {
                    this.showPreview();
                } else {
                    this.showEditor();
                }
            });
        });

        // Live preview on input
        this.descriptionInput.addEventListener('input', () => {
            if (this.descriptionPreview.style.display === 'block') {
                this.updatePreview();
            }
        });

        // Markdown help
        this.markdownHint.addEventListener('click', () => {
            this.markdownModal.style.display = 'flex';
        });

        // Close modal
        this.markdownModal.querySelector('.close-modal').addEventListener('click', () => {
            this.markdownModal.style.display = 'none';
        });

        // Click outside to close
        this.markdownModal.addEventListener('click', (e) => {
            if (e.target === this.markdownModal) {
                this.markdownModal.style.display = 'none';
            }
        });
    }

    togglePreview() {
        this.isPreviewMode = !this.isPreviewMode;
        if (this.isPreviewMode) {
            this.showPreview();
            this.previewButton.classList.add('active');
            this.writeButton.classList.remove('active');
        } else {
            this.showEditor();
            this.writeButton.classList.add('active');
            this.previewButton.classList.remove('active');
        }
    }

    showPreview() {
        this.updatePreview();
        this.descriptionInput.style.display = 'none';
        this.descriptionPreview.style.display = 'block';
        this.isPreviewMode = true;
    }

    showEditor() {
        this.descriptionInput.style.display = 'block';
        this.descriptionPreview.style.display = 'none';
        this.isPreviewMode = false;
        this.descriptionInput.focus();
    }

    updatePreview() {
        const markdown = this.descriptionInput.value;
        const html = marked.parse(markdown); // Use marked.parse instead of marked
        this.descriptionPreview.innerHTML = html;
    }

    initializeAISupport() {
        this.aiButton.addEventListener('click', () => this.getAISuggestions());
        
        // Close modal button
        const closeBtn = this.aiModal.querySelector('.close-modal-btn');
        closeBtn.addEventListener('click', () => this.closeAIModal());
        
        // Click outside to close
        this.aiModal.addEventListener('click', (e) => {
            if (e.target === this.aiModal) this.closeAIModal();
        });
    }

    async getAISuggestions() {
        // Show modal with loading state
        this.aiModal.style.display = 'flex';
        this.aiLoading.style.display = 'block';
        this.aiSuggestions.style.display = 'none';

        try {
            const tasks = this.todos.map(todo => ({
                id: todo.id,
                title: todo.title,
                description: todo.description,
                completed: todo.completed
            }));

            const response = await this.callOpenAI(tasks);
            this.displayAISuggestions(response);
        } catch (error) {
            this.displayAIError(error);
        }
    }

    async callOpenAI(tasks) {
        const API_KEY = process.env.OPENAI_API_KEY;
        if (!API_KEY) {
            throw new Error('OpenAI API key not found');
        }

        const API_URL = 'https://api.openai.com/v1/chat/completions';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: [{
                        role: "user",
                        content: this.createAIPrompt(tasks)
                    }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get AI suggestions');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI suggestion error:', error);
            throw error;
        }
    }

    createAIPrompt(tasks) {
        return `
            I have the following tasks in my todo list:
            ${tasks.map(task => `- ${task.title}${task.description ? `: ${task.description}` : ''}`).join('\n')}

            Please analyze these tasks and provide:
            1. A suggested order of completion based on priority and efficiency
            2. A brief explanation of the reasoning
            3. Any additional tips for task management

            Format the response in markdown with clear sections.
        `;
    }

    displayAISuggestions(response) {
        this.aiLoading.style.display = 'none';
        this.aiSuggestions.style.display = 'block';
        
        // Parse markdown and display
        this.aiSuggestions.innerHTML = marked.parse(response);

        // Add apply button if there's a suggested order
        const applyButton = document.createElement('button');
        applyButton.className = 'ai-button';
        applyButton.textContent = 'Apply Suggested Order';
        applyButton.addEventListener('click', () => this.applyAISuggestions(response));
        this.aiSuggestions.appendChild(applyButton);
    }

    displayAIError(error) {
        this.aiLoading.style.display = 'none';
        this.aiSuggestions.style.display = 'block';
        this.aiSuggestions.innerHTML = `
            <div class="error-message">
                <p>Error: ${error.message || 'Failed to get AI suggestions'}</p>
                <p>Please check your API key and try again.</p>
            </div>
        `;
    }

    closeAIModal() {
        this.aiModal.style.display = 'none';
        this.aiSuggestions.innerHTML = '';
    }

    applyAISuggestions(response) {
        // This is a simple implementation - you might want to make it more robust
        const lines = response.split('\n');
        const orderedTasks = [];
        
        // Find ordered list in response
        let capturingList = false;
        for (const line of lines) {
            if (line.match(/^\d+\.\s/)) {
                capturingList = true;
                const taskTitle = line.replace(/^\d+\.\s/, '').trim();
                const matchingTask = this.todos.find(t => 
                    t.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
                    taskTitle.toLowerCase().includes(t.title.toLowerCase())
                );
                if (matchingTask) {
                    orderedTasks.push(matchingTask);
                }
            } else if (capturingList && !line.trim()) {
                break;
            }
        }

        // Reorder tasks if we found matches
        if (orderedTasks.length > 0) {
            this.todos = [
                ...orderedTasks,
                ...this.todos.filter(t => !orderedTasks.includes(t))
            ];
            this.renderAllTodos();
            this.saveTodos();
        }

        this.closeAIModal();
    }

    renderAllTodos() {
        this.todoList.innerHTML = '';
        this.todos.forEach(todo => this.renderTodo(todo));
        this.updateEmptyState();
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoOrganizer();
});