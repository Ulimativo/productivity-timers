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
        this.aiPrompt = null;
        this.loadAIPrompt();
        this.renderAllTodos();
        this.todoPriority = document.getElementById('todoPriority');
        this.initializeDataControls();
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
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importInput = document.getElementById('importInput');
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
            const draggable = document.querySelector('.dragging');
            if (!draggable) return;

            // Find the closest priority-tasks container
            const priorityTasks = e.target.closest('.priority-tasks');
            if (!priorityTasks) return;

            const afterElement = this.getDragAfterElement(priorityTasks, e.clientY);
            if (afterElement) {
                priorityTasks.insertBefore(draggable, afterElement);
            } else {
                priorityTasks.appendChild(draggable);
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
        
        if (title) {
            const todo = {
                id: Date.now(),
                title,
                description,
                completed: false,
                priority: 'C' // Default priority
            };
            
            this.todos.push(todo);
            this.renderAllTodos();
            this.saveTodos();
            
            // Clear inputs
            this.titleInput.value = '';
            this.descriptionInput.value = '';
            this.titleInput.focus();
        }
    }

    renderTodo(todo, container) {
        const li = document.createElement('li');
        li.className = `todo-item${todo.completed ? ' completed' : ''}`;
        li.draggable = true;
        li.dataset.id = todo.id;
        
        li.innerHTML = `
            <div class="todo-content">
                <div class="todo-header">
                    <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
                    <h3 class="todo-title">${todo.title}</h3>
                    <div class="todo-actions">
                        <button class="complete-button" aria-label="Mark as complete">✓</button>
                        <button class="delete-button" aria-label="Delete task">×</button>
                    </div>
                </div>
                ${todo.description ? `<p class="todo-description">${marked.parse(todo.description)}</p>` : ''}
            </div>
            <div class="drag-handle" aria-label="Drag to reorder">⋮⋮</div>
        `;

        // Update drag events
        li.addEventListener('dragstart', () => {
            li.classList.add('dragging');
            this.draggedItem = li;
        });
        
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            
            // Find the new priority section
            const newPrioritySection = li.closest('.priority-section');
            if (newPrioritySection) {
                // Get all priority sections and find the index of the new section
                const allSections = Array.from(this.todoList.children);
                const sectionIndex = allSections.indexOf(newPrioritySection);
                const newPriority = ['A', 'B', 'C', 'D', 'E'][sectionIndex];
                
                // Update the todo's priority
                const todoId = parseInt(li.dataset.id);
                const todo = this.todos.find(t => t.id === todoId);
                if (todo) {
                    todo.priority = newPriority;
                    this.saveTodos();
                }
            }
            this.draggedItem = null;
        });

        // Add other event listeners
        li.querySelector('.delete-button').addEventListener('click', () => this.deleteTodo(todo.id));
        li.querySelector('.complete-button').addEventListener('click', () => this.toggleComplete(todo.id));

        container.appendChild(li);
    }

    toggleComplete(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.renderAllTodos();
            this.saveTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.renderAllTodos();
        this.saveTodos();
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
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
            console.log('Saved todos:', this.todos.map(t => t.title)); // Debug log
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }

    loadTodos() {
        try {
            const savedTodos = localStorage.getItem('todos');
            if (savedTodos) {
                this.todos = JSON.parse(savedTodos);
                console.log('Loaded todos:', this.todos.map(t => t.title)); // Debug log
                this.todos.forEach(todo => this.renderTodo(todo));
                this.updateEmptyState();
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            this.todos = [];
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

    async loadAIPrompt() {
        try {
            const response = await fetch('../prompt.txt');
            this.aiPrompt = await response.text();
            console.log('AI Prompt loaded successfully');
        } catch (error) {
            console.error('Error loading AI prompt:', error);
            // Fallback prompt if file loading fails
            this.aiPrompt = "You are a task management AI. Please analyze and prioritize the following tasks.";
        }
    }

    async callOpenAI(tasks) {
        const API_KEY = process.env.OPENAI_API_KEY;
        if (!API_KEY) {
            throw new Error('OpenAI API key not found');
        }

        // Wait for prompt to be loaded if it hasn't been already
        if (!this.aiPrompt) {
            await this.loadAIPrompt();
        }

        const API_URL = 'https://api.openai.com/v1/chat/completions';
        
        // Create the task list in a structured format
        const taskList = tasks.map((task, index) => {
            return `Task ${index + 1}: ${task.title}${
                task.description ? ` (Description: ${task.description})` : ''
            }${
                task.completed ? ' (Status: Completed)' : ' (Status: Pending)'
            }`;
        }).join('\n');

        // Combine system prompt with task list
        const messages = [
            {
                role: "system",
                content: this.aiPrompt
            },
            {
                role: "user",
                content: `Please analyze and prioritize these tasks:\n\n${taskList}\n\nProvide a detailed analysis including:\n1. Task categorization (Eisenhower Matrix)\n2. ABCDE priority assignments\n3. Ranked priority list with clear actions\n4. Additional insights for better task management`
            }
        ];

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
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

    displayAISuggestions(response) {
        this.aiLoading.style.display = 'none';
        this.aiSuggestions.style.display = 'block';
        
        // Create a formatted display of the AI analysis
        const formattedResponse = this.formatAIResponse(response);
        this.aiSuggestions.innerHTML = formattedResponse;

        // Add apply button
        const applyButton = document.createElement('button');
        applyButton.className = 'apply-button';
        applyButton.innerHTML = '✨ Apply Suggested Order';
        applyButton.addEventListener('click', () => this.applyAISuggestions(response));
        this.aiSuggestions.appendChild(applyButton);
    }

    formatAIResponse(response) {
        // Convert the raw response to HTML with better formatting
        let html = marked.parse(response);
        
        // Add custom styling for different sections
        html = html.replace(
            /(Task Analysis and Categorization|Ranked Priority List|Insights)/g,
            '<h3 class="ai-section-header">$1</h3>'
        );
        
        return html;
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
        const orderedTasks = this.parseAISuggestions(response);
        console.log('Parsed ordered tasks:', orderedTasks); // Debug log
        
        if (orderedTasks.length > 0) {
            // Create new array for reordered tasks
            const newTodoOrder = [];
            
            // First, add matched tasks in the suggested order
            orderedTasks.forEach(suggestedTitle => {
                const matchingTask = this.todos.find(todo => 
                    this.normalizeText(todo.title).includes(this.normalizeText(suggestedTitle)) ||
                    this.normalizeText(suggestedTitle).includes(this.normalizeText(todo.title))
                );
                
                if (matchingTask && !newTodoOrder.includes(matchingTask)) {
                    newTodoOrder.push(matchingTask);
                    console.log('Matched task:', matchingTask.title); // Debug log
                }
            });
            
            // Add remaining tasks that weren't in the AI suggestion
            this.todos.forEach(todo => {
                if (!newTodoOrder.includes(todo)) {
                    newTodoOrder.push(todo);
                    console.log('Adding remaining task:', todo.title); // Debug log
                }
            });
            
            // Update the todos array
            this.todos = [...newTodoOrder];
            console.log('Final todo order:', this.todos.map(t => t.title)); // Debug log
            
            // Clear and rebuild the todo list in the DOM
            this.todoList.innerHTML = '';
            this.todos.forEach(todo => this.renderTodo(todo));
            
            // Save to localStorage
            this.saveTodos();
            
            // Show success notification
            this.showNotification('Tasks reordered successfully!');
        } else {
            this.showNotification('Could not determine task order from AI response', 'error');
        }
        
        this.closeAIModal();
    }

    parseAISuggestions(response) {
        const orderedTasks = [];
        const lines = response.split('\n');
        
        // Look for the ranked priority list section
        let capturingList = false;
        let rankPattern = /^\d+\.\s+(?:Task \d+:|"?)(.+?)(?:"?\s+\(|$)/i;
        
        for (const line of lines) {
            // Look for section headers that indicate priority list
            if (line.toLowerCase().includes('ranked priority list') || 
                line.toLowerCase().includes('recommended order')) {
                capturingList = true;
                continue;
            }
            
            if (capturingList) {
                const match = line.match(rankPattern);
                if (match) {
                    let taskTitle = match[1].trim();
                    // Remove any additional markers or classifications
                    taskTitle = taskTitle.replace(/\(.*?\)/g, '').trim();
                    orderedTasks.push(taskTitle);
                } else if (line.trim() === '' && orderedTasks.length > 0) {
                    // Stop capturing when we hit an empty line after finding tasks
                    break;
                }
            }
        }
        
        console.log('Parsed ordered tasks:', orderedTasks);
        return orderedTasks;
    }

    normalizeText(text) {
        return text.toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ');    // Normalize whitespace
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    renderAllTodos() {
        this.todoList.innerHTML = '';
        
        // Create priority sections
        const prioritySections = {
            A: this.createPrioritySection('A - Must do', 'High priority tasks with severe consequences if not completed'),
            B: this.createPrioritySection('B - Should do', 'Medium priority tasks with moderate consequences'),
            C: this.createPrioritySection('C - Nice to do', 'Low priority tasks with minor consequences'),
            D: this.createPrioritySection('D - Delegate', 'Tasks that can be delegated to others'),
            E: this.createPrioritySection('E - Eliminate', 'Tasks to eliminate or defer indefinitely')
        };

        // Add priority sections to the list
        Object.values(prioritySections).forEach(section => {
            this.todoList.appendChild(section);
        });

        // Sort and render todos into their sections
        this.todos.forEach(todo => {
            const priority = todo.priority || 'C'; // Default to C if no priority set
            const section = prioritySections[priority].querySelector('.priority-tasks');
            this.renderTodo(todo, section);
        });

        this.updateEmptyState();
        this.saveTodos();
    }

    createPrioritySection(title, description) {
        const section = document.createElement('div');
        section.className = 'priority-section';
        section.innerHTML = `
            <div class="priority-header">
                <h3>${title}</h3>
                <p class="priority-description">${description}</p>
            </div>
            <ul class="priority-tasks"></ul>
        `;
        return section;
    }

    updateTodoOrder() {
        const newOrder = [];
        document.querySelectorAll('.priority-section').forEach(section => {
            const tasks = section.querySelector('.priority-tasks');
            const sectionPriority = ['A', 'B', 'C', 'D', 'E'][
                Array.from(this.todoList.children).indexOf(section)
            ];
            
            tasks.querySelectorAll('.todo-item').forEach(item => {
                const todo = this.todos.find(t => t.id === parseInt(item.dataset.id));
                if (todo) {
                    todo.priority = sectionPriority;
                    newOrder.push(todo);
                }
            });
        });
        
        this.todos = newOrder;
        this.saveTodos();
    }

    initializeDataControls() {
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importBtn.addEventListener('click', () => this.importInput.click());
        this.importInput.addEventListener('change', (e) => this.importTasks(e));
    }

    exportTasks() {
        // Create export data structure
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tasks: this.todos
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Create blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Tasks exported successfully!');
    }

    async importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate import data
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid task data format');
            }

            // Validate each task
            const validTasks = data.tasks.filter(task => {
                return task.title && 
                       typeof task.title === 'string' &&
                       ['A', 'B', 'C', 'D', 'E'].includes(task.priority);
            });

            // Merge with existing tasks or replace them
            const shouldMerge = confirm('Do you want to merge with existing tasks? Click Cancel to replace all tasks.');
            
            if (shouldMerge) {
                // Add new IDs to avoid conflicts
                const importedTasks = validTasks.map(task => ({
                    ...task,
                    id: Date.now() + Math.random()
                }));
                this.todos = [...this.todos, ...importedTasks];
            } else {
                this.todos = validTasks;
            }

            // Update display
            this.renderAllTodos();
            this.saveTodos();
            this.showNotification(`${validTasks.length} tasks imported successfully!`);

        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Error importing tasks. Please check the file format.', 'error');
        }

        // Reset file input
        event.target.value = '';
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoOrganizer();
});