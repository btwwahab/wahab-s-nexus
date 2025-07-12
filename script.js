// AI Chatbot - Modern, futuristic implementation (Optimized)
document.addEventListener('DOMContentLoaded', function () {
    // Cache DOM Elements for better performance
    const elements = {
        // Core UI
        menuItems: document.querySelectorAll('.menu-item'),
        tabContents: document.querySelectorAll('.tab-content'),
        chatInput: document.getElementById('chat-input'),
        sendButton: document.getElementById('send-button'),
        chatMessages: document.getElementById('chat-messages'),
        suggestionChips: document.querySelectorAll('.suggestion-chip'),
        menuToggleBtn: document.getElementById('menu-toggle-btn'),
        sidePanel: document.getElementById('side-panel'),
        contentArea: document.getElementById('content-area'),
        sectionTitle: document.querySelector('.section-title'),

        // Theme Toggle
        darkThemeToggle: document.getElementById('dark-theme'),
        lightThemeToggle: document.getElementById('light-theme'),

        // Modals
        modalOverlay: document.getElementById('modal-overlay'),
        renameBtn: document.getElementById('rename-btn'),
        exportBtn: document.getElementById('export-btn'),
        optionsBtn: document.getElementById('options-btn'),
        renameModal: document.getElementById('rename-modal'),
        optionsModal: document.getElementById('options-modal'),
        renameModalClose: document.getElementById('rename-modal-close'),
        optionsModalClose: document.getElementById('options-modal-close'),
        renameCancel: document.getElementById('rename-cancel'),
        renameSave: document.getElementById('rename-save'),
        renameInput: document.getElementById('rename-input'),

        // Settings
        historyToggle: document.getElementById('history-toggle'),
        usageToggle: document.getElementById('usage-toggle'),
        languageSelect: document.getElementById('language-select'),
        voiceSelect: document.getElementById('voice-select'),

        // Personality
        personalityCards: document.querySelectorAll('.personality-card'),
        customInstructions: document.getElementById('custom-instructions'),
        savePersonalityBtn: document.getElementById('save-personality'),

        // Other
        voiceInputBtn: document.getElementById('voice-input'),
        attachFileBtn: document.getElementById('attach-file'),
        historyContainer: document.getElementById('history-container'),
        notificationContainer: document.getElementById('notification-container'),
        deleteConversationBtn: document.getElementById('delete-conversation'),
        resetSettingsBtn: document.getElementById('reset-settings'),

        // Search & Clear
        searchHistoryBtn: document.querySelector('#library-content .action-btn[title="Search"]'),
        clearHistoryBtn: document.querySelector('#library-content .action-btn[title="Clear All"]')
    };

    // APP STATE - using a single state object for better organization
    const state = {
        chatHistory: [],
        isTyping: false,
        activeConversationId: generateId(),
        activeConversationName: 'New Conversation',
        isNewConversation: false, // Add this new property
        settings: {
            theme: 'dark',
            saveHistory: true,
            shareData: false,
            language: 'en-US',
            voiceOutput: 'none',
            model: 'llama-3.3-70b-versatile',
            messageLimit: 50
        },
        personality: {
            type: 'assistant',
            customInstructions: ''
        }
    };

    // Constants for better maintainability
    const STORAGE_KEYS = {
        SETTINGS: 'nova-settings',
        PERSONALITY: 'nova-personality',
        CONVERSATIONS: 'nova-conversations',
        ACTIVE_CONVERSATION: 'nova-active-conversation'
    };

    const PERSONALITY_INSTRUCTIONS = {
        'assistant': "You are Aziona , a professional AI assistant. Provide clear and concise answers to inquiries.",
        'developer': "You are Aziona , a technical AI assistant focused on code and development. Provide explanations with code examples when appropriate.",
        'teacher': "You are Aziona , an educational AI assistant. Explain concepts thoroughly with examples and analogies that are easy to understand.",
        'creative': "You are Aziona , a creative AI partner. Provide imaginative and inspiring responses to help with creative projects."
    };

    // Chat history for API context (separate from state.chatHistory for API usage)
    let chatHistory = [];

    /**
     * Initialization
     */
    function init() {
        // Load settings and personality
        loadSavedState();
        initializeTheme();
        initParticles();

        // Handle conversation loading
        if (state.settings.saveHistory) {
            try {
                const savedHistory = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
                if (savedHistory) {
                    state.chatHistory = JSON.parse(savedHistory);
                    updateHistoryUI();

                    // Check for an active conversation
                    const activeConvId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
                    if (activeConvId) {
                        const conversation = state.chatHistory.find(c => c.id === activeConvId);
                        if (conversation) {
                            // Load this conversation
                            loadConversation(activeConvId);
                        } else if (state.chatHistory.length > 0) {
                            // If active conversation not found but history exists, load most recent
                            const mostRecent = [...state.chatHistory].sort((a, b) => b.timestamp - a.timestamp)[0];
                            loadConversation(mostRecent.id);
                        }
                    } else if (state.chatHistory.length > 0) {
                        // If no active conversation but history exists, load the most recent one
                        const mostRecent = [...state.chatHistory].sort((a, b) => b.timestamp - a.timestamp)[0];
                        loadConversation(mostRecent.id);
                    } else {
                        // Empty UI state
                        elements.chatMessages.innerHTML = '';
                        elements.sectionTitle.textContent = "Select a conversation";
                    }
                } else {
                    // Empty UI state
                    elements.chatMessages.innerHTML = '';
                    elements.sectionTitle.textContent = "Start a new conversation";
                    showEmptyHistoryState();
                }
            } catch (error) {
                console.error('Error loading conversation history:', error);
                showNotification('Failed to load conversation history', 'error');
                showEmptyHistoryState();
            }
        } else {
            // History saving disabled - just show empty state
            elements.chatMessages.innerHTML = '';
            elements.sectionTitle.textContent = "Start a new conversation";
        }

        setupEventListeners();
    }

    /**
     * Load saved state from localStorage
     */
    function loadSavedState() {
        try {
            // Load settings
            const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                Object.assign(state.settings, JSON.parse(savedSettings));
                elements.historyToggle.classList.toggle('active', state.settings.saveHistory);
                elements.usageToggle.classList.toggle('active', state.settings.shareData);
            }

            // Load personality settings
            const savedPersonality = localStorage.getItem(STORAGE_KEYS.PERSONALITY);
            if (savedPersonality) {
                Object.assign(state.personality, JSON.parse(savedPersonality));
                updatePersonalityUI();
            }

            // Load conversation history
            if (state.settings.saveHistory) {
                loadConversationHistory();
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
            // If loading fails, continue with default state
        }
    }

    /**
     * Update the UI to reflect the current personality
     */
    function updatePersonalityUI() {
        elements.personalityCards.forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-personality') === state.personality.type);
        });

        if (state.personality.customInstructions) {
            elements.customInstructions.value = state.personality.customInstructions;
        }
    }

    /**
     * Initialize theme based on saved settings
     */
    function initializeTheme() {
        const isLightTheme = state.settings.theme === 'light';
        document.body.classList.toggle('light-theme', isLightTheme);
        elements.darkThemeToggle.classList.toggle('active', !isLightTheme);
        elements.lightThemeToggle.classList.toggle('active', isLightTheme);
    }

    /**
     * Initialize particles animation
     */
    function initParticles() {
        const particlesContainer = document.getElementById('particles');
        const particlesCount = 50;
        const fragment = document.createDocumentFragment();

        // Create animation style once
        if (!document.getElementById('particle-animation')) {
            const style = document.createElement('style');
            style.id = 'particle-animation';
            style.textContent = `
                @keyframes float {
                    0% { transform: translateY(0) translateX(0) rotate(0); }
                    50% { transform: translateY(-20px) translateX(10px) rotate(5deg); }
                    100% { transform: translateY(20px) translateX(-10px) rotate(-5deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Create particles
        for (let i = 0; i < particlesCount; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 4 + 1;

            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.1));
                border-radius: 50%;
                opacity: ${Math.random() * 0.6 + 0.2};
                animation: float ${Math.random() * 10 + 10}s ease-in-out ${Math.random() * 5}s infinite alternate;
                filter: blur(${Math.random() + 0.5}px);
                box-shadow: 0 0 ${size * 2}px rgba(139, 92, 246, 0.6);
            `;

            fragment.appendChild(particle);
        }

        particlesContainer.appendChild(fragment);
    }

    /**
     * Generate unique ID for conversations
     * @returns {string} Unique identifier
     */
    function generateId() {
        return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Load conversation history from localStorage
     */
    function loadConversationHistory() {
        try {
            const savedHistory = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
            if (savedHistory) {
                state.chatHistory = JSON.parse(savedHistory);
                updateHistoryUI();

                // Load active conversation if exists
                const activeConvId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
                if (activeConvId) {
                    state.activeConversationId = activeConvId;
                    loadConversation(activeConvId);
                }
            } else {
                showEmptyHistoryState();
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
            showNotification('Failed to load conversation history', 'error');
            showEmptyHistoryState();
        }
    }

    /**
     * Show empty state in history container
     */
    function showEmptyHistoryState() {
        elements.historyContainer.innerHTML = `
            <div class="history-empty">
                <i class="far fa-comment-alt"></i>
                <h4>No conversation history</h4>
                <p>Your conversations will appear here</p>
            </div>
        `;
    }

    /**
     * Update history UI with current state
     */
    function updateHistoryUI() {
        if (!state.chatHistory.length) {
            showEmptyHistoryState();
            return;
        }

        const fragment = document.createDocumentFragment();

        state.chatHistory.forEach(convo => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.id = convo.id;

            // Get first message preview or default text
            const preview = convo.messages && convo.messages.length > 0
                ? convo.messages[0].content.substring(0, 60) + (convo.messages[0].content.length > 60 ? '...' : '')
                : 'Empty conversation';

            historyItem.innerHTML = `
                <div class="history-header">
                    <div class="history-title">${convo.name || 'Unnamed Conversation'}</div>
                    <div class="history-date">${formatDate(convo.timestamp || Date.now())}</div>
                </div>
                <div class="history-preview">${preview}</div>
            `;

            historyItem.addEventListener('click', () => loadConversation(convo.id));
            fragment.appendChild(historyItem);
        });

        elements.historyContainer.innerHTML = '';
        elements.historyContainer.appendChild(fragment);
    }

    /**
     * Format date for history items
     * @param {number} timestamp - Timestamp to format
     * @returns {string} Formatted date string
     */
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${timeStr}`;
        }

        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${timeStr}`;
        }

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    /**
     * Get current time formatted for messages
     * @returns {string} Formatted current time
     */
    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Load a specific conversation
     * @param {string} conversationId - ID of conversation to load
     */
    function loadConversation(conversationId) {
        const conversation = state.chatHistory.find(c => c.id === conversationId);
        if (!conversation) return;

        // Update state
        state.activeConversationId = conversationId;
        state.activeConversationName = conversation.name || 'Unnamed Conversation';

        // Update UI
        elements.sectionTitle.textContent = state.activeConversationName;
        elements.chatMessages.innerHTML = '';

        // Reset chat history array for API context
        chatHistory = [];

        // Populate messages
        if (conversation.messages?.length) {
            conversation.messages.forEach(msg => {
                // Add to UI
                addMessageToUI(msg.role, msg.content);

                // Add to API context history
                chatHistory.push({
                    role: msg.role,
                    content: msg.content
                });
            });
        }

        // Save active conversation to localStorage
        if (state.settings.saveHistory) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, conversationId);
        }

        // Change this in loadConversation function:
        const conversationsTab = document.getElementById('conversations-content');
        if (conversationsTab) {
            elements.menuItems.forEach(mi => mi.classList.remove('active'));
            // Change this line that's causing the error:
            document.querySelector('.menu-item[data-tab="conversations"]').classList.add('active');
            elements.tabContents.forEach(content => content.classList.remove('active'));
            conversationsTab.classList.add('active');
        }
    }

    /**
     * Add a message to the UI
     * @param {string} role - Role of message sender ('user' or 'assistant')
     * @param {string} content - Message content
     */
    function addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        // Set up marked.js options
        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function (code, lang) {
                // Simple syntax formatting without highlight.js
                return code;
            },
            langPrefix: 'language-',
            pedantic: false,
            gfm: true,
            breaks: true,
            sanitize: false,
            smartypants: true,
            xhtml: false
        });

        // Process content based on role
        let processedContent;
        if (role === 'assistant') {
            // Process markdown for AI responses
            processedContent = marked.parse(content);

            // Add code block headers with language name and copy button
            processedContent = processedContent.replace(
                /<pre><code class="language-([a-zA-Z0-9]+)">/g,
                (match, language) => {
                    const displayLang = language === 'javascript' ? 'JavaScript' :
                        language === 'typescript' ? 'TypeScript' :
                            language === 'python' ? 'Python' :
                                language === 'html' ? 'HTML' :
                                    language === 'css' ? 'CSS' :
                                        language === 'sql' ? 'SQL' :
                                            language === 'json' ? 'JSON' :
                                                language === 'java' ? 'Java' :
                                                    language === 'csharp' ? 'C#' :
                                                        language === 'cpp' ? 'C++' :
                                                            language === 'php' ? 'PHP' :
                                                                language === 'go' ? 'Go' :
                                                                    language === 'ruby' ? 'Ruby' :
                                                                        language === 'bash' ? 'Bash' :
                                                                            language.charAt(0).toUpperCase() + language.slice(1);

                    return `<div class="code-header">
                    <span class="language-name">${displayLang}</span>
                    <button class="copy-button" data-clipboard-action="copy">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre><code class="language-${language}">`;
                }
            );
        } else {
            // User messages - just replace newlines with <br>
            processedContent = content.replace(/\n/g, '<br>');
        }

        // Create message content
        messageDiv.innerHTML = `
    <div class="message-content">
        <div class="message-bubble ${role === 'assistant' ? 'markdown-content' : ''}">
            ${processedContent}
        </div>
        <div class="message-time">${getCurrentTime()}</div>
        <div class="message-actions">
            ${role === 'assistant' ? `
                <button class="message-action-btn" title="Copy to clipboard">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="message-action-btn" title="Read aloud">
                    <i class="fas fa-volume-up"></i>
                </button>
            ` : `
                <button class="message-action-btn" title="Edit">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            `}
        </div>
    </div>
`;

        // Add this new code to ensure mobile responsiveness
        if (window.innerWidth <= 768) {
            // Force reflow for mobile
            messageDiv.style.maxWidth = '95%';

            // Ensure all pre elements in the message are scrollable
            const preElements = messageDiv.querySelectorAll('pre');
            preElements.forEach(pre => {
                pre.style.overflowX = 'auto';
                pre.style.maxWidth = '100%';
            });

            // Ensure tables are scrollable
            const tables = messageDiv.querySelectorAll('table');
            tables.forEach(table => {
                const wrapper = document.createElement('div');
                wrapper.style.overflowX = 'auto';
                wrapper.style.maxWidth = '100%';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            });
        }

        // Add event listeners for message actions
        setupMessageActions(messageDiv, content, role);

        // Add event listeners for code copy buttons
        if (role === 'assistant') {
            const copyButtons = messageDiv.querySelectorAll('.copy-button');
            copyButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const codeBlock = button.parentElement.nextElementSibling.querySelector('code');
                    if (codeBlock) {
                        const textToCopy = codeBlock.textContent;
                        navigator.clipboard.writeText(textToCopy)
                            .then(() => {
                                // Change button text temporarily
                                const originalHTML = button.innerHTML;
                                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                                setTimeout(() => {
                                    button.innerHTML = originalHTML;
                                }, 2000);
                                showNotification('Code copied to clipboard', 'success');
                            })
                            .catch(err => {
                                console.error('Copy failed:', err);
                                showNotification('Failed to copy code', 'error');
                            });
                    }
                });
            });
        }

        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

        // Apply syntax highlighting to code blocks
        if (role === 'assistant') {
            messageDiv.querySelectorAll('pre code').forEach((block) => {
                block.classList.add('code-no-highlight');
            });
        }
    }

    /**
     * Set up message action buttons
     * @param {HTMLElement} messageDiv - Message container element
     * @param {string} content - Message content
     * @param {string} role - Role of message sender
     */
    function setupMessageActions(messageDiv, content, role) {
        // Copy button
        const copyBtn = messageDiv.querySelector('.fa-copy')?.parentElement;
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content)
                    .then(() => showNotification('Copied to clipboard', 'success'))
                    .catch(err => {
                        console.error('Copy failed:', err);
                        showNotification('Failed to copy', 'error');
                    });
            });
        }

        // Text-to-speech button
        const speakerBtn = messageDiv.querySelector('.fa-volume-up')?.parentElement;
        if (speakerBtn) {
            speakerBtn.addEventListener('click', () => handleTextToSpeech(speakerBtn, content));
        }

        // Edit button
        const editBtn = messageDiv.querySelector('.fa-pencil-alt')?.parentElement;
        if (editBtn) {
            editBtn.addEventListener('click', () => handleMessageEdit(messageDiv, content));
        }
    }

    /**
 * Handle text-to-speech functionality
 * @param {HTMLElement} speakerBtn - The speaker button element
 * @param {string} text - Text to speak
 */
    async function handleTextToSpeech(speakerBtn, text) {
        // Check if speech is currently active for this specific button
        if (speakerBtn.classList.contains('speaking')) {
            // Stop current speech
            window.speechSynthesis.cancel();
            speakerBtn.classList.remove('speaking');
            speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            showNotification('Speech stopped by user', 'info');
            return;
        }

        // Check if text is valid
        if (!text || text.trim().length === 0) {
            showNotification('No text to read', 'warning');
            return;
        }

        // Check if speech synthesis is supported
        if (!window.speechSynthesis) {
            showNotification('Text-to-speech not supported in your browser', 'error');
            return;
        }

        // Additional check for production environments
        if (window.location.protocol === 'https:' && !document.hasFocus()) {
            showNotification('Please click in the browser window first, then try again', 'warning');
            return;
        }

        // Stop any other active speech first
        window.speechSynthesis.cancel();

        // Reset all other speaker buttons
        document.querySelectorAll('.message-action-btn .fa-pause').forEach(btn => {
            const speakerButton = btn.parentElement;
            speakerButton.classList.remove('speaking');
            speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        });

        showNotification('Preparing to read message aloud...', 'info');

        try {
            // Wait longer for cancellation to complete on production
            await new Promise(resolve => setTimeout(resolve, 500));

            // Clean the text - remove HTML tags and fix common issues
            const cleanText = text
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                .replace(/&amp;/g, '&') // Replace HTML entities
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

            if (!cleanText) {
                showNotification('No readable text found', 'warning');
                return;
            }

            // Limit text length more aggressively for production
            const maxLength = 500; // Reduced from 1000
            const textToSpeak = cleanText.length > maxLength ?
                cleanText.substring(0, maxLength) + '...' : cleanText;

            // Wait for voices to be loaded (important for production)
            const voices = await getBestVoice('male');
            if (!voices && window.speechSynthesis.getVoices().length === 0) {
                showNotification('Speech voices not yet loaded. Please try again in a moment.', 'warning');
                return;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);

            // Set basic properties with more conservative settings
            utterance.lang = 'en-US';
            utterance.rate = 0.8; // Slower rate for better compatibility
            utterance.pitch = 1.0;
            utterance.volume = 0.8; // Slightly lower volume

            // Try to get a voice with better error handling
            try {
                const voice = await getBestVoice('male');
                if (voice) {
                    utterance.voice = voice;
                    console.log('Using voice:', voice.name);
                } else {
                    console.log('Using default voice');
                }
            } catch (voiceError) {
                console.warn('Could not set voice:', voiceError);
                // Continue with default voice
            }

            // Track this specific utterance
            let isThisUtteranceActive = true;
            let wasStoppedByUser = false;
            let hasStarted = false;

            // Set up event handlers with better error handling
            utterance.onstart = () => {
                if (isThisUtteranceActive) {
                    hasStarted = true;
                    speakerBtn.classList.add('speaking');
                    speakerBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    showNotification('Reading message aloud', 'info');
                }
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);

                // Only handle if this is still the active utterance
                if (isThisUtteranceActive) {
                    speakerBtn.classList.remove('speaking');
                    speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';

                    // Don't show error for "interrupted" or if speech never started
                    if (event.error === 'interrupted' || !hasStarted) {
                        if (hasStarted) {
                            wasStoppedByUser = true;
                            showNotification('Speech stopped by user', 'info');
                        }
                    } else {
                        // Handle other errors with more specific messages
                        let errorMessage = 'Speech synthesis failed';
                        switch (event.error) {
                            case 'network':
                                errorMessage = 'Network error during speech';
                                break;
                            case 'synthesis-unavailable':
                                errorMessage = 'Speech synthesis unavailable. Try refreshing the page.';
                                break;
                            case 'synthesis-failed':
                                errorMessage = 'Speech synthesis failed. Try a shorter message.';
                                break;
                            case 'audio-busy':
                                errorMessage = 'Audio system is busy. Please try again.';
                                break;
                            case 'audio-hardware':
                                errorMessage = 'Audio hardware error';
                                break;
                            case 'language-unavailable':
                                errorMessage = 'Language not available for speech';
                                break;
                            case 'voice-unavailable':
                                errorMessage = 'Selected voice unavailable';
                                break;
                            case 'text-too-long':
                                errorMessage = 'Text too long for speech synthesis';
                                break;
                            case 'invalid-argument':
                                errorMessage = 'Invalid text for speech synthesis';
                                break;
                            case 'not-allowed':
                                errorMessage = 'Speech synthesis not allowed. Please interact with the page first.';
                                break;
                            default:
                                errorMessage = `Speech error: ${event.error}`;
                        }

                        showNotification(errorMessage, 'error');
                    }
                }
                isThisUtteranceActive = false;
            };

            utterance.onend = () => {
                if (isThisUtteranceActive) {
                    speakerBtn.classList.remove('speaking');
                    speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';

                    // Only show completion message if it wasn't stopped by user and actually started
                    if (!wasStoppedByUser && hasStarted) {
                        showNotification('Finished reading message', 'success');
                    }
                }
                isThisUtteranceActive = false;
            };

            utterance.onpause = () => {
                if (isThisUtteranceActive) {
                    speakerBtn.classList.remove('speaking');
                    speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    showNotification('Speech paused', 'info');
                }
            };

            utterance.onresume = () => {
                if (isThisUtteranceActive) {
                    speakerBtn.classList.add('speaking');
                    speakerBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    showNotification('Speech resumed', 'info');
                }
            };

            // Store reference to this utterance on the button for cancellation
            speakerBtn.currentUtterance = utterance;
            speakerBtn.isUtteranceActive = () => isThisUtteranceActive;

            // Add timeout as fallback
            const timeoutId = setTimeout(() => {
                if (isThisUtteranceActive && !hasStarted) {
                    console.warn('Speech did not start within timeout');
                    window.speechSynthesis.cancel();
                    speakerBtn.classList.remove('speaking');
                    speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    showNotification('Speech synthesis timed out. Please try again.', 'warning');
                    isThisUtteranceActive = false;
                }
            }, 5000); // 5 second timeout

            // Clear timeout when speech starts
            const originalOnStart = utterance.onstart;
            utterance.onstart = () => {
                clearTimeout(timeoutId);
                if (originalOnStart) originalOnStart();
            };

            // Speak the text
            console.log('Starting speech synthesis...');
            window.speechSynthesis.speak(utterance);

            // Additional check for browsers that need a kickstart
            setTimeout(() => {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            }, 100);

        } catch (error) {
            console.error('Text-to-speech error:', error);
            speakerBtn.classList.remove('speaking');
            speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            showNotification('Could not initialize text-to-speech', 'error');
        }
    }

    /**
     * Handle message editing
     * @param {HTMLElement} messageDiv - Message container element
     * @param {string} originalText - Original message content
     */
    function handleMessageEdit(messageDiv, originalText) {
        // Create editable field
        const messageBubble = messageDiv.querySelector('.message-bubble');

        // Store the message index to find it later in chat history
        const messageIndex = Array.from(elements.chatMessages.children).indexOf(messageDiv);
        messageDiv.dataset.messageIndex = messageIndex;

        // Replace with textarea
        messageBubble.innerHTML = `
            <textarea class="edit-message-area">${originalText}</textarea>
            <div class="edit-actions">
                <button class="save-edit">Save</button>
                <button class="cancel-edit">Cancel</button>
            </div>
        `;

        const saveBtn = messageBubble.querySelector('.save-edit');
        const cancelBtn = messageBubble.querySelector('.cancel-edit');
        const textarea = messageBubble.querySelector('.edit-message-area');

        // Focus the textarea
        textarea.focus();

        // Add event listeners for save/cancel
        saveBtn.addEventListener('click', () => saveMessageEdit(messageDiv, messageBubble, originalText));
        cancelBtn.addEventListener('click', () => cancelMessageEdit(messageBubble, originalText));
    }

    /**
     * Save message edit
     * @param {HTMLElement} messageDiv - Message container element
     * @param {HTMLElement} messageBubble - Message bubble element
     * @param {string} originalText - Original message content
     */
    function saveMessageEdit(messageDiv, messageBubble, originalText) {
        const newText = messageBubble.querySelector('.edit-message-area').value;
        const isUserMessage = messageDiv.classList.contains('user');

        // Update the UI
        messageBubble.innerHTML = newText;

        // If it's a user message, update the chatHistory and get new response
        if (isUserMessage) {
            // Find the corresponding message in chatHistory
            const messagePosition = parseInt(messageDiv.dataset.messageIndex);

            // Create a mapping to the actual position in chatHistory
            let userMsgCount = 0;
            let chatHistoryIndex = -1;

            for (let i = 0; i <= messagePosition; i++) {
                if (elements.chatMessages.children[i].classList.contains('user')) {
                    userMsgCount++;
                }
            }

            // Find the corresponding user message in chatHistory
            for (let i = 0; i < chatHistory.length; i++) {
                if (chatHistory[i].role === 'user') {
                    userMsgCount--;
                    if (userMsgCount === 0) {
                        chatHistoryIndex = i;
                        break;
                    }
                }
            }

            if (chatHistoryIndex >= 0) {
                // Update the content in chatHistory
                chatHistory[chatHistoryIndex].content = newText;

                // Remove all messages after this one in UI
                let nextNode = messageDiv.nextSibling;
                while (nextNode) {
                    const currentNode = nextNode;
                    nextNode = nextNode.nextSibling;
                    elements.chatMessages.removeChild(currentNode);
                }

                // Trim chatHistory to remove all messages after this one
                chatHistory = chatHistory.slice(0, chatHistoryIndex + 1);

                // Also update in state.chatHistory
                const convo = state.chatHistory.find(c => c.id === state.activeConversationId);
                if (convo && convo.messages) {
                    // Find the corresponding message in conversation and update it
                    for (let i = 0; i < convo.messages.length; i++) {
                        if (convo.messages[i].role === 'user' &&
                            i === messagePosition) {
                            convo.messages[i].content = newText;

                            // Remove all messages after this one
                            convo.messages = convo.messages.slice(0, i + 1);
                            break;
                        }
                    }

                    // Save updated conversation
                    if (state.settings.saveHistory) {
                        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
                    }
                }

                // Show typing indicator and get new response
                showTypingIndicator();
                fetchBotResponse(newText);
            }
        } else {
            // For assistant messages, just update the UI and state
            showNotification('Message updated', 'success');
        }
    }

    /**
     * Cancel message edit
     * @param {HTMLElement} messageBubble - Message bubble element
     * @param {string} originalText - Original message content
     */
    function cancelMessageEdit(messageBubble, originalText) {
        messageBubble.innerHTML = originalText;
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator() {
        if (document.getElementById('typing-indicator')) return;

        const template = document.getElementById('typing-indicator-template');
        const indicator = document.importNode(template.content, true);
        elements.chatMessages.appendChild(indicator);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        state.isTyping = true;
    }

    /**
     * Hide typing indicator
     */
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        state.isTyping = false;
    }

    // Alias for hideTypingIndicator for backward compatibility
    const removeTypingIndicator = hideTypingIndicator;

    /**
     * Handle sending a message
     */
    function sendMessage() {
        const message = elements.chatInput.value.trim();
        if (!message || state.isTyping) return;

        // Add user message to UI
        addMessageToUI('user', message);

        // Clear input and resize
        elements.chatInput.value = '';
        resizeInput();

        // Store message in conversation
        saveMessageToConversation('user', message);

        // Add to chatHistory for API context
        chatHistory.push({
            role: 'user',
            content: message
        });

        // Show typing indicator
        showTypingIndicator();

        // Get AI response via API
        fetchBotResponse(message);
    }

    /**
     * Save message to current conversation
     * @param {string} role - Role of message sender
     * @param {string} content - Message content
     */
    function saveMessageToConversation(role, content) {
        // Find current conversation in history
        let conversation = state.chatHistory.find(c => c.id === state.activeConversationId);

        // If conversation doesn't exist (should never happen), create it
        if (!conversation) {
            console.warn('Conversation not found, creating new one');
            conversation = {
                id: state.activeConversationId,
                name: state.activeConversationName,
                timestamp: Date.now(),
                messages: []
            };
            state.chatHistory.unshift(conversation);
        }

        // Special handling for first user message
        if (role === 'user' && state.isNewConversation) {
            state.isNewConversation = false;

            // Update active conversation in UI, but don't create a new one
            elements.sectionTitle.textContent = state.activeConversationName;
        }

        // Add message to conversation
        conversation.messages.push({
            role,
            content,
            timestamp: Date.now()
        });

        // Update timestamp
        conversation.timestamp = Date.now();

        // Save to localStorage if enabled
        if (state.settings.saveHistory) {
            localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
            localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, state.activeConversationId);
            updateHistoryUI();
        }
    }

    /**
     * Generate a conversation name from the first user message
     * @param {string} message - First user message
     * @returns {string} Generated conversation name
     */
    function generateConversationName(message) {
        // Simple approach: Take first 4-5 words, up to 30 chars
        const words = message.split(' ');
        let name = words.slice(0, 5).join(' ');

        // Truncate if too long
        if (name.length > 30) {
            name = name.substring(0, 27) + '...';
        }

        return name;
    }

    /**
     * Get a general response for fallback
     * @param {string} userMessage - User message
     * @returns {string} Fallback response
     */
    function getGeneralResponse(userMessage) {
        const responses = [
            "I understand what you're asking about. Let me provide some information on that topic.",
            "That's an interesting question. Here's what I know about it.",
            "I'd be happy to help with that. Here's my response.",
            "Based on my knowledge, I can offer the following insights.",
            "I've analyzed your question and here's what I can tell you."
        ];

        const personalityResponses = {
            'assistant': "As your professional assistant, I can provide a clear and concise answer to your inquiry.",
            'developer': "Looking at this from a technical perspective, let me explain with some code examples.",
            'teacher': "Let me explain this concept in a way that's easy to understand with some helpful examples.",
            'creative': "That sparks some interesting ideas! Here's a creative approach to what you're asking about."
        };

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const personalityIntro = personalityResponses[state.personality.type] || '';

        return `${personalityIntro} ${randomResponse} (This is a fallback response because the API connection wasn't available.)`;
    }

    /**
     * Fetch response from Groq API
     * @param {string} userMessage - User message
     */


    function fetchBotResponse(userMessage) {
        // Ensure chatHistory only contains messages from current conversation
        const currentConvo = state.chatHistory.find(c => c.id === state.activeConversationId);
        if (currentConvo && currentConvo.messages) {
            // Rebuild chatHistory from current conversation to ensure consistency
            chatHistory = currentConvo.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
        }

        const MODEL = state.settings.model || 'llama-3.3-70b-versatile';

        // Prepare system message based on personality with additional formatting instructions
        let systemContent = PERSONALITY_INSTRUCTIONS[state.personality.type] || PERSONALITY_INSTRUCTIONS['assistant'];

        // Add formatting instructions
        systemContent += "\n\n" +
            "Please format your responses using Markdown for better readability:" +
            "\n- Use **bold** and *italic* for emphasis" +
            "\n- Use `code` for inline code and ```language\ncode\n``` for code blocks" +
            "\n- Use proper headings with # and ## for sections" +
            "\n- Use bullet points and numbered lists where appropriate" +
            "\n- Create tables using Markdown table syntax when displaying tabular data" +
            "\n- Use > for blockquotes" +
            "\n- Include language name in code blocks for proper syntax highlighting";

        // Add custom instructions if available
        if (state.personality.customInstructions) {
            systemContent += "\n\n" + state.personality.customInstructions;
        }

        const systemMessage = {
            role: "system",
            content: systemContent
        };

        // Add custom instructions if available
        if (state.personality.customInstructions) {
            systemMessage.content += "\n\n" + state.personality.customInstructions;
        }

        // Prepare messages array
        const messages = [systemMessage, ...chatHistory];

        // Configuration for the request
        const requestData = {
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 800,
            top_p: 1
        };

        console.log('Sending request to /api/chat...');

        // Call your serverless function (NOT Groq directly)
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('API Error Response:', text);
                        throw new Error(`HTTP ${response.status}: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('API response:', data);

                if (data.error) {
                    throw new Error(data.error.message || data.error);
                }

                if (data.choices && data.choices[0] && data.choices[0].message) {
                    // Remove typing indicator
                    removeTypingIndicator();

                    const responseContent = data.choices[0].message.content;

                    // Add response to UI
                    addMessageToUI('assistant', responseContent);

                    // Add to chat history for API context
                    chatHistory.push({
                        role: 'assistant',
                        content: responseContent
                    });

                    // Save to conversation
                    saveMessageToConversation('assistant', responseContent);
                    updateSuggestionChips();

                    // ALWAYS generate an AI name after the first exchange, not just sometimes
                    const currentConvo = state.chatHistory.find(c => c.id === state.activeConversationId);
                    // The condition was the issue - make it ALWAYS generate a name when it's a new conversation
                    if (currentConvo && (currentConvo.messages.length <= 2 || state.isNewConversation === false)) {
                        elements.sectionTitle.textContent = "Generating name...";
                        console.log("Generating AI name for conversation:", state.activeConversationId);
                        generateAIConversationName(userMessage, responseContent);
                    }
                } else {
                    throw new Error('Invalid response format from API');
                }
            })
            .catch(error => {
                console.error('API Error:', error);
                removeTypingIndicator();

                let errorMessage = error.message || 'Unknown error occurred';
                showNotification(`API Error: ${errorMessage}`, 'error');

                // Use fallback response
                const fallbackResponse = getGeneralResponse(userMessage);
                addMessageToUI('assistant', fallbackResponse);

                chatHistory.push({
                    role: 'assistant',
                    content: fallbackResponse
                });

                saveMessageToConversation('assistant', fallbackResponse);
            });
    }

    /**
     * Use AI to generate a better conversation name
     */
    function generateAIConversationName(userMsg, aiReply) {
        // Add a short delay to ensure the API isn't overloaded
        setTimeout(() => {
            // Define these variables - they were missing!
            const timestamp = new Date().toLocaleString();
            const convoId = state.activeConversationId.substring(0, 8);

            // Use existing API call structure
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: state.settings.model,
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful assistant that generates creative, unique conversation titles. Create a specific title that captures the main topic, using between 2-5 words. Be descriptive and varied in your naming approach. Each title should feel distinct even for similar topics."
                        },
                        {
                            role: "user",
                            content: `Based on this conversation started on ${timestamp} (ID: ${convoId}), generate a concise, specific, and UNIQUE title (max 5 words):\nUser: ${userMsg}\nAI: ${aiReply.substring(0, 100)}\n\nImportant: Ensure this title is different from typical titles you might generate for similar conversations.`
                        }
                    ],
                    temperature: 0.9, // Higher temperature for more creativity
                    max_tokens: 20,
                    top_p: 1,
                    frequency_penalty: 0.5 // Add some penalty for repetitive tokens
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        let title = data.choices[0].message.content.trim();
                        // Remove quotes if present
                        title = title.replace(/^["'](.*)["']$/, '$1');

                        // Add small random suffix if the title is very short (< 10 chars)
                        if (title.length < 10) {
                            const randomSuffix = Math.floor(Math.random() * 1000);
                            title = `${title} ${randomSuffix}`;
                        }

                        // Update conversation name
                        state.activeConversationName = title;
                        elements.sectionTitle.textContent = title;

                        // Update in chat history
                        const convo = state.chatHistory.find(c => c.id === state.activeConversationId);
                        if (convo) {
                            convo.name = title;

                            // Save to localStorage if enabled
                            if (state.settings.saveHistory) {
                                localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
                                localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, state.activeConversationId);
                                updateHistoryUI();
                            }
                        }
                    }
                })
                .catch(err => {
                    console.warn('Failed to generate AI title:', err);
                    showNotification('Could not generate custom title', 'warning');
                });
        }, 500); // Short delay before generating name
    }

    /**
     * Process API response and update UI
     * @param {Object} apiData - API response data
     */
    function processApiResponse(apiData) {
        let responseText = apiData.response || '';

        // Remove typing indicator
        removeTypingIndicator();
        state.isTyping = false;

        // Add response to chat history in state for saving
        saveMessageToConversation('assistant', responseText);

        // Add the response to UI
        addMessageToUI('assistant', responseText);
    }

    /**
     * Create new conversation
     */
    function createNewConversation() {
        // Generate new conversation ID
        state.activeConversationId = generateId();

        // Use a timestamp for the initial temporary name
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        state.activeConversationName = `New Chat (${timestamp})`;

        // Update UI
        elements.sectionTitle.textContent = state.activeConversationName;
        elements.chatMessages.innerHTML = '';

        // Reset chat history for API context
        chatHistory = [];

        // Add welcome message
        const welcomeMessage = "Hello! I'm Aziona, your AI assistant. How can I help you today?";
        addMessageToUI('assistant', welcomeMessage);

        // Add welcome message to chatHistory for API context
        chatHistory.push({
            role: 'assistant',
            content: welcomeMessage
        });

        // Create conversation object with welcome message
        const newConversation = {
            id: state.activeConversationId,
            name: state.activeConversationName,
            timestamp: Date.now(),
            messages: [{
                role: 'assistant',
                content: welcomeMessage,
                timestamp: Date.now()
            }]
        };

        // Add to chat history
        state.chatHistory.unshift(newConversation);

        // Flag for first user message handling
        state.isNewConversation = true;

        // Save to localStorage
        if (state.settings.saveHistory) {
            localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
            localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, state.activeConversationId);
            updateHistoryUI();
        }

        updateSuggestionChips(true);
    }

    /**
     * Resize input based on content
     */
    function resizeInput() {
        elements.chatInput.style.height = 'auto';
        elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, error, warning)
     */
    function showNotification(message, type = 'info') {
        if (!message) return;

        // Clear any existing notifications first
        const existingNotifications = elements.notificationContainer.querySelectorAll('.notification');
        existingNotifications.forEach(note => {
            note.classList.remove('show');
            setTimeout(() => note.remove(), 300);
        });

        const notification = document.createElement('div');
        notification.className = 'notification';

        let icon;
        switch (type) {
            case 'success': icon = 'fa-check-circle'; break;
            case 'error': icon = 'fa-exclamation-circle'; break;
            case 'warning': icon = 'fa-exclamation-triangle'; break;
            default: icon = 'fa-info-circle';
        }

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-message">${message}</div>
        `;

        elements.notificationContainer.appendChild(notification);

        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            // Trigger animation in the next frame
            setTimeout(() => notification.classList.add('show'), 10);
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            // Remove from DOM after animation completes
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Custom popup system
     * @param {Object} options - Popup options
     * @returns {Promise} Resolves with user response
     */
    function showPopup(options = {}) {
        return new Promise((resolve) => {
            // Set default options
            const settings = {
                type: 'alert',
                title: 'Notification',
                message: '',
                placeholder: '',
                defaultValue: '',
                confirmText: 'OK',
                cancelText: 'Cancel',
                className: '',
                showClose: true,
                closeOnOverlayClick: false,
                ...options
            };

            // Create popup elements
            const popupOverlay = document.createElement('div');
            popupOverlay.className = 'popup-overlay';

            const popup = document.createElement('div');
            popup.className = `popup ${settings.className} popup-${settings.type}`;

            // Create popup content
            popup.innerHTML = `
                <div class="popup-header">
                    <h4>${settings.title}</h4>
                    ${settings.showClose ? '<button class="popup-close"><i class="fas fa-times"></i></button>' : ''}
                </div>
                <div class="popup-body">
                    ${settings.message ? `<div class="popup-message">${settings.message}</div>` : ''}
                    ${settings.type === 'prompt' ?
                    `<input type="text" class="popup-input" placeholder="${settings.placeholder}" 
                         value="${settings.defaultValue}">` : ''}
                    ${settings.type === 'custom' && settings.customHTML ? settings.customHTML : ''}
                </div>
                <div class="popup-footer">
                    ${settings.type !== 'alert' ?
                    `<button class="secondary-btn popup-cancel">${settings.cancelText}</button>` : ''}
                    <button class="primary-btn popup-confirm">${settings.confirmText}</button>
                </div>
            `;

            // Add to DOM
            document.body.appendChild(popupOverlay);
            document.body.appendChild(popup);

            // Add animation classes
            requestAnimationFrame(() => {
                setTimeout(() => {
                    popupOverlay.classList.add('active');
                    popup.classList.add('active');
                }, 10);
            });

            // Handle close actions
            const closePopup = (value) => {
                popup.classList.remove('active');
                popupOverlay.classList.remove('active');

                setTimeout(() => {
                    document.body.removeChild(popup);
                    document.body.removeChild(popupOverlay);
                    resolve(value);
                }, 300); // Match the CSS transition duration
            };

            // Set up event listeners
            // Close button
            if (settings.showClose) {
                const closeBtn = popup.querySelector('.popup-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => closePopup(null));
                }
            }

            // Confirm button
            const confirmBtn = popup.querySelector('.popup-confirm');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (settings.type === 'prompt') {
                        const input = popup.querySelector('.popup-input');
                        closePopup(input ? input.value : null);
                    } else {
                        closePopup(true);
                    }
                });
            }

            // Cancel button
            const cancelBtn = popup.querySelector('.popup-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => closePopup(false));
            }

            // Allow closing with Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closePopup(null);
                    document.removeEventListener('keydown', handleEscape);
                }
            };

            document.addEventListener('keydown', handleEscape);

            // Handle prompt input enter key
            if (settings.type === 'prompt') {
                const input = popup.querySelector('.popup-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            closePopup(input.value);
                        }
                    });
                }
            }

            // Prevent clicks on overlay from closing (unless configured to do so)
            popupOverlay.addEventListener('click', () => {
                if (settings.closeOnOverlayClick) {
                    closePopup(null);
                }
            });

            // Prevent clicks within popup from bubbling to overlay
            popup.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    /**
     * Save settings to localStorage
     */
    function saveSettings() {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
        showNotification('Settings saved successfully', 'success');
    }

    /**
     * Save personality to localStorage
     */
    function savePersonality() {
        localStorage.setItem(STORAGE_KEYS.PERSONALITY, JSON.stringify(state.personality));
        showNotification('Personality preferences saved', 'success');
    }

    /**
     * Get available speech synthesis voices
     * @returns {Promise<SpeechSynthesisVoice[]>} Available voices
     */
    function getSpeechVoices() {
        return new Promise((resolve) => {
            let voices = window.speechSynthesis.getVoices();

            if (voices.length) {
                resolve(voices);
                return;
            }

            // Chrome loads voices asynchronously
            const voicesChangedHandler = () => {
                voices = window.speechSynthesis.getVoices();
                window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
                resolve(voices);
            };

            window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);

            // Set a timeout just in case
            setTimeout(() => {
                window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
                resolve(window.speechSynthesis.getVoices());
            }, 1000);
        });
    }

    /**
     * Find the best voice based on gender
     * @param {string} gender - Preferred gender ('male' or 'female')
     * @returns {Promise<SpeechSynthesisVoice>} Best matching voice
     */
    async function getBestVoice(gender = null) {
        return new Promise((resolve) => {
            let voices = window.speechSynthesis.getVoices();

            const processVoices = () => {
                console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));

                if (!voices.length) {
                    console.warn('No voices available');
                    resolve(null);
                    return;
                }

                // Try to find voice based on gender
                if (gender) {
                    const femalePatterns = ['female', 'woman', 'girl', 'fiona', 'samantha', 'karen', 'moira', 'tessa', 'zira', 'susan', 'allison'];
                    const malePatterns = ['male', 'man', 'boy', 'guy', 'david', 'mark', 'daniel', 'alex', 'tom', 'fred', 'jorge'];
                    const patterns = gender === 'female' ? femalePatterns : malePatterns;

                    // First try to find English voices with the gender
                    const englishVoiceWithGender = voices.find(voice =>
                        voice.lang.startsWith('en') &&
                        patterns.some(pattern => voice.name.toLowerCase().includes(pattern))
                    );

                    if (englishVoiceWithGender) {
                        console.log(`Selected ${gender} voice: ${englishVoiceWithGender.name}`);
                        resolve(englishVoiceWithGender);
                        return;
                    }

                    // If no English voice with gender, try any voice with the gender
                    const anyVoiceWithGender = voices.find(voice =>
                        patterns.some(pattern => voice.name.toLowerCase().includes(pattern))
                    );

                    if (anyVoiceWithGender) {
                        console.log(`Selected ${gender} voice: ${anyVoiceWithGender.name}`);
                        resolve(anyVoiceWithGender);
                        return;
                    }
                }

                // Default to first English voice or any voice
                const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                console.log('Using default voice:', defaultVoice?.name);
                resolve(defaultVoice);
            };

            if (voices.length) {
                processVoices();
            } else {
                // Wait for voices to load (important for production)
                let attempts = 0;
                const maxAttempts = 10;

                const checkVoices = () => {
                    voices = window.speechSynthesis.getVoices();
                    attempts++;

                    if (voices.length > 0) {
                        processVoices();
                    } else if (attempts < maxAttempts) {
                        setTimeout(checkVoices, 200);
                    } else {
                        console.warn('Voices failed to load after maximum attempts');
                        resolve(null);
                    }
                };

                // Try multiple approaches to load voices
                window.speechSynthesis.addEventListener('voiceschanged', processVoices, { once: true });
                setTimeout(checkVoices, 100);
            }
        });
    }

    /**
     * Search conversation history
     * @param {string} term - Search term
     */
    function searchConversationHistory(term) {
        if (!term) return;

        const searchResults = state.chatHistory.filter(convo => {
            // Search in conversation name
            if (convo.name && convo.name.toLowerCase().includes(term.toLowerCase())) {
                return true;
            }

            // Search in messages
            return convo.messages && convo.messages.some(msg =>
                msg.content.toLowerCase().includes(term.toLowerCase())
            );
        });

        if (!searchResults.length) {
            showNotification('No matching conversations found', 'info');
            return;
        }

        // Show search results in history container
        elements.historyContainer.innerHTML = `
            <div class="search-header">
                Found ${searchResults.length} results for "${term}" 
                <button id="clear-search" class="secondary-btn">Clear</button>
            </div>
        `;

        const fragment = document.createDocumentFragment();

        searchResults.forEach(convo => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.id = convo.id;

            const preview = convo.messages && convo.messages.length > 0
                ? convo.messages[0].content.substring(0, 60) + (convo.messages[0].content.length > 60 ? '...' : '')
                : 'Empty conversation';

            historyItem.innerHTML = `
                <div class="history-header">
                    <div class="history-title">${convo.name || 'Unnamed Conversation'}</div>
                    <div class="history-date">${formatDate(convo.timestamp || Date.now())}</div>
                </div>
                <div class="history-preview">${preview}</div>
            `;

            historyItem.addEventListener('click', () => loadConversation(convo.id));
            fragment.appendChild(historyItem);
        });

        elements.historyContainer.appendChild(fragment);

        // Add event listener to clear search
        document.getElementById('clear-search').addEventListener('click', updateHistoryUI);
    }

    /**
     * Clear all conversation history
     */
    function clearAllHistory() {
        state.chatHistory = [];
        localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);

        // Update UI
        updateHistoryUI();
        showNotification('All conversation history deleted', 'success');

        // Create a new conversation
        createNewConversation();
    }

    /**
     * Delete current conversation
     */
    function deleteCurrentConversation() {
        // Find the index of the current conversation
        const index = state.chatHistory.findIndex(c => c.id === state.activeConversationId);

        if (index !== -1) {
            // Remove the conversation from the array
            state.chatHistory.splice(index, 1);

            // Save updated history
            if (state.settings.saveHistory) {
                localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
            }

            // Update UI
            updateHistoryUI();
            showNotification('Conversation deleted', 'success');

            // Create a new conversation
            createNewConversation();
        }
    }

    /**
 * Update suggestion chips with AI-generated suggestions
 * @param {boolean} isInitial - Whether this is the initial loading
 */
    function updateSuggestionChips(isInitial = false) {
        const suggestionsContainer = document.querySelector('.input-suggestions');

        // Initial/default suggestions
        if (isInitial || !chatHistory.length) {
            const defaultSuggestions = [
                "Explain quantum computing",
                "Summarize this article",
                "Write a poem about nature",
                "Help debug my code"
            ];

            updateSuggestionChipsUI(defaultSuggestions);
            return;
        }

        // Show loading state
        suggestionsContainer.innerHTML = `
        <div class="suggestion-chip loading">Generating suggestions...</div>
    `;

        // Build prompt for generating suggestions
        const recentMessages = chatHistory.slice(-4); // Get last 4 messages
        let context = "";

        recentMessages.forEach(msg => {
            context += `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}\n`;
        });

        const prompt = `Based on this conversation:\n${context}\n\nGenerate 4 short follow-up questions or topics the user might be interested in asking next. Each should be under 40 characters. Return only the questions as a JSON array ["question1", "question2", "question3", "question4"] with no explanation.`;

        // Use the existing API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: state.settings.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that generates follow-up questions."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        })
            .then(response => response.json())
            .then(data => {
                try {
                    let suggestions;

                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        const content = data.choices[0].message.content;

                        // Try to parse JSON from the response
                        try {
                            // Look for array in the response if it's not pure JSON
                            const match = content.match(/\[.*\]/s);
                            if (match) {
                                suggestions = JSON.parse(match[0]);
                            } else {
                                suggestions = JSON.parse(content);
                            }
                        } catch (e) {
                            // If parsing fails, extract lines that look like suggestions
                            suggestions = content
                                .split('\n')
                                .filter(line => line.trim().length > 0 && line.trim().length < 50)
                                .map(line => line.replace(/^[0-9-."]*\s*/, '').replace(/^["'](.*)["']$/, '$1'))
                                .slice(0, 4);
                        }
                    }

                    if (!Array.isArray(suggestions) || suggestions.length === 0) {
                        throw new Error('Failed to parse suggestions');
                    }

                    // Update UI with new suggestions
                    updateSuggestionChipsUI(suggestions);
                } catch (error) {
                    console.error('Error processing suggestions:', error);
                    // Fall back to generic suggestions
                    updateSuggestionChipsUI([
                        "Tell me more about this",
                        "How does this work?",
                        "Can you give examples?",
                        "What are alternatives?"
                    ]);
                }
            })
            .catch(error => {
                console.error('Error getting suggestions:', error);
                // Fall back to generic suggestions
                updateSuggestionChipsUI([
                    "Tell me more about this",
                    "How does this work?",
                    "Can you give examples?",
                    "What are alternatives?"
                ]);
            });
    }

    /**
     * Update the suggestion chips in the UI
     * @param {string[]} suggestions - Array of suggestion texts
     */
    function updateSuggestionChipsUI(suggestions) {
        const suggestionsContainer = document.querySelector('.input-suggestions');
        suggestionsContainer.innerHTML = '';

        suggestions.forEach(text => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = text;

            chip.addEventListener('click', () => {
                elements.chatInput.value = text;
                resizeInput();
                sendMessage();
            });

            suggestionsContainer.appendChild(chip);
        });
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {

        elements.menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');

                // Update active menu item
                elements.menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');

                // Show active tab content
                elements.tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabId}-content`).classList.add('active');

                // DON'T automatically create a new conversation when switching to chat tab
                // Only handle the mobile menu closing
                if (window.innerWidth <= 768) {
                    elements.sidePanel.classList.remove('active');
                }
            });
        });

        document.querySelector('.menu-item[data-tab="conversations"]').addEventListener('click', () => {
            // Just show the conversations tab, don't create a new conversation
            const tabId = 'conversations';
            elements.menuItems.forEach(mi => mi.classList.remove('active'));
            document.querySelector('.menu-item[data-tab="conversations"]').classList.add('active');
            elements.tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-content`).classList.add('active');
        });

        // Add a separate handler for creating new conversations
        document.getElementById('create-new-chat-btn').addEventListener('click', () => {
            createNewConversation();
            showNotification('Started new conversation', 'info');
        });

        // Mobile menu toggle
        elements.menuToggleBtn.addEventListener('click', () => {
            elements.sidePanel.classList.toggle('active');
        });

        // Chat input handling
        elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        elements.chatInput.addEventListener('input', resizeInput);
        elements.sendButton.addEventListener('click', sendMessage);

        // Suggestion chips
        elements.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                elements.chatInput.value = chip.textContent;
                resizeInput();
                sendMessage();
            });
        });

        // Theme toggles
        elements.darkThemeToggle.addEventListener('click', () => {
            document.body.classList.remove('light-theme');
            state.settings.theme = 'dark';
            elements.darkThemeToggle.classList.add('active');
            elements.lightThemeToggle.classList.remove('active');
            saveSettings();
        });

        elements.lightThemeToggle.addEventListener('click', () => {
            document.body.classList.add('light-theme');
            state.settings.theme = 'light';
            elements.lightThemeToggle.classList.add('active');
            elements.darkThemeToggle.classList.remove('active');
            saveSettings();
        });

        // Settings toggles
        elements.historyToggle.addEventListener('click', () => {
            elements.historyToggle.classList.toggle('active');
            state.settings.saveHistory = elements.historyToggle.classList.contains('active');
            saveSettings();
        });

        elements.usageToggle.addEventListener('click', () => {
            elements.usageToggle.classList.toggle('active');
            state.settings.shareData = elements.usageToggle.classList.contains('active');
            saveSettings();
        });

        // Personality card selection
        elements.personalityCards.forEach(card => {
            card.addEventListener('click', () => {
                elements.personalityCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                state.personality.type = card.getAttribute('data-personality');
            });
        });

        // Save personality button
        elements.savePersonalityBtn.addEventListener('click', () => {
            state.personality.customInstructions = elements.customInstructions.value;
            savePersonality();
        });

        // Rename modal functionality
        elements.renameBtn.addEventListener('click', () => {
            elements.modalOverlay.style.display = 'block';
            elements.renameModal.style.display = 'block';
            elements.renameInput.value = state.activeConversationName;
            setTimeout(() => elements.renameModal.classList.add('active'), 10);
        });

        // Modal close events
        [elements.renameModalClose, elements.renameCancel, elements.modalOverlay].forEach(el => {
            el.addEventListener('click', () => {
                elements.renameModal.classList.remove('active');
                setTimeout(() => {
                    elements.renameModal.style.display = 'none';
                    elements.modalOverlay.style.display = 'none';
                }, 300);
            });
        });

        // Prevent clicks inside rename modal from closing it
        elements.renameModal.addEventListener('click', e => e.stopPropagation());

        // Rename save button
        elements.renameSave.addEventListener('click', () => {
            const newName = elements.renameInput.value.trim() || 'Unnamed Conversation';
            state.activeConversationName = newName;
            elements.sectionTitle.textContent = newName;

            // Update in chat history
            const convo = state.chatHistory.find(c => c.id === state.activeConversationId);
            if (convo) {
                convo.name = newName;

                // Save to localStorage if enabled
                if (state.settings.saveHistory) {
                    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
                    updateHistoryUI();
                }
            }

            // Close modal
            elements.renameModal.classList.remove('active');
            setTimeout(() => {
                elements.renameModal.style.display = 'none';
                elements.modalOverlay.style.display = 'none';
            }, 300);

            showNotification('Conversation renamed', 'success');
        });

        // Options modal
        elements.optionsBtn.addEventListener('click', () => {
            elements.modalOverlay.style.display = 'block';
            elements.optionsModal.style.display = 'block';
            setTimeout(() => elements.optionsModal.classList.add('active'), 10);
        });

        // Options modal close
        [elements.optionsModalClose, elements.modalOverlay].forEach(el => {
            el.addEventListener('click', () => {
                elements.optionsModal.classList.remove('active');
                setTimeout(() => {
                    elements.optionsModal.style.display = 'none';
                    elements.modalOverlay.style.display = 'none';
                }, 300);
            });
        });

        // Prevent clicks inside options modal from closing it
        elements.optionsModal.addEventListener('click', e => e.stopPropagation());

        // Export button
        elements.exportBtn.addEventListener('click', () => {
            const convo = state.chatHistory.find(c => c.id === state.activeConversationId);
            if (!convo?.messages?.length) {
                showNotification('No messages to export', 'warning');
                return;
            }

            let exportText = `# ${convo.name || 'Conversation'}\n\n`;
            convo.messages.forEach(msg => {
                exportText += `## ${msg.role === 'user' ? 'You' : 'Aziona AI'}\n${msg.content}\n\n`;
            });

            // Create and download the file
            const blob = new Blob([exportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${convo.name || 'conversation'}-export.md`;
            a.click();
            URL.revokeObjectURL(url);

            showNotification('Conversation exported as Markdown', 'success');
        });

        // Attach file button (simulated functionality)
        elements.attachFileBtn.addEventListener('click', () => {
            showNotification('File attachment coming soon', 'info');
        });

        // Voice input button
        elements.voiceInputBtn.addEventListener('click', () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                showNotification('Speech recognition not supported in your browser', 'error');
                return;
            }

            const recognition = new SpeechRecognition();

            if (elements.voiceInputBtn.classList.contains('active')) {
                // Stop listening
                recognition.stop();
                elements.voiceInputBtn.classList.remove('active');
                showNotification('Voice input stopped', 'info');
            } else {
                // Start listening
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    elements.voiceInputBtn.classList.add('active');
                    showNotification('Listening...', 'info');
                };

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    elements.chatInput.value = transcript;
                    resizeInput();
                    showNotification('Voice input received', 'success');
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    elements.voiceInputBtn.classList.remove('active');
                    showNotification(`Error: ${event.error}`, 'error');
                };

                recognition.onend = () => {
                    elements.voiceInputBtn.classList.remove('active');
                };

                recognition.start();
            }
        });

        // Library search
        elements.searchHistoryBtn.addEventListener('click', async () => {
            const searchTerm = await showPopup({
                type: 'prompt',
                title: 'Search History',
                message: 'Enter a search term to find in your conversation history:',
                placeholder: 'Type search term...',
                confirmText: 'Search'
            });

            if (searchTerm?.trim()) {
                searchConversationHistory(searchTerm.trim());
            }
        });

        // Clear history
        elements.clearHistoryBtn.addEventListener('click', async () => {
            const confirmed = await showPopup({
                type: 'confirm',
                title: 'Delete All History',
                message: 'Are you sure you want to delete all conversation history? This cannot be undone.',
                confirmText: 'Delete All',
                className: 'danger-popup'
            });

            if (confirmed) {
                clearAllHistory();
            }
        });

        // Delete conversation
        elements.deleteConversationBtn.addEventListener('click', async () => {
            // Close options modal first
            elements.optionsModal.classList.remove('active');
            setTimeout(() => {
                elements.optionsModal.style.display = 'none';
                elements.modalOverlay.style.display = 'none';
            }, 300);

            // Ask for confirmation
            const confirmed = await showPopup({
                type: 'confirm',
                title: 'Delete Conversation',
                message: 'Are you sure you want to delete this conversation? This cannot be undone.',
                confirmText: 'Delete',
                className: 'danger-popup'
            });

            if (confirmed) {
                deleteCurrentConversation();
            }
        });

        // Reset settings
        elements.resetSettingsBtn.addEventListener('click', async () => {
            const confirmed = await showPopup({
                type: 'confirm',
                title: 'Reset Settings',
                message: 'Are you sure you want to reset all settings to defaults?',
                confirmText: 'Reset',
                cancelText: 'Cancel'
            });

            if (confirmed) {
                // Reset state settings to defaults
                Object.assign(state.settings, {
                    theme: 'dark',
                    saveHistory: true,
                    shareData: false,
                    language: 'en-US',
                    voiceOutput: 'none'
                });

                // Update UI to reflect reset settings
                elements.historyToggle.classList.add('active');
                elements.usageToggle.classList.remove('active');
                document.body.classList.remove('light-theme');
                elements.darkThemeToggle.classList.add('active');
                elements.lightThemeToggle.classList.remove('active');

                // Save reset settings
                saveSettings();
                showNotification('Settings reset to defaults', 'success');
            }
        });

        // Mobile options for rename and export
        document.getElementById('rename-option').addEventListener('click', () => {
            // First close the options modal
            elements.optionsModal.classList.remove('active');
            setTimeout(() => {
                elements.optionsModal.style.display = 'none';
                elements.modalOverlay.style.display = 'none';
            }, 300);

            // Then open the rename modal (reuse existing functionality)
            setTimeout(() => {
                elements.modalOverlay.style.display = 'block';
                elements.renameModal.style.display = 'block';
                elements.renameInput.value = state.activeConversationName;
                setTimeout(() => elements.renameModal.classList.add('active'), 10);
            }, 350);
        });

        document.getElementById('export-option').addEventListener('click', () => {
            // Close the options modal first
            elements.optionsModal.classList.remove('active');
            setTimeout(() => {
                elements.optionsModal.style.display = 'none';
                elements.modalOverlay.style.display = 'none';
            }, 300);

            // Then trigger the export functionality (reuse existing functionality)
            setTimeout(() => {
                // This calls the same function as the regular export button
                const exportEvent = new Event('click');
                elements.exportBtn.dispatchEvent(exportEvent);
            }, 350);
        });

        setupYouTubeEventListeners();

        mobileActionPopup.init();

    }

    // YouTube Integration Functions
    const youtubeFeatures = {

        /**
     * Create embedded video player
     * @param {string} videoId - YouTube video ID
     * @param {Object} options - Player options
     * @returns {string} HTML for embedded player
     */
        createVideoPlayer(videoId, options = {}) {
            const defaultOptions = {
                width: '100%',
                height: '315',
                autoplay: false,
                mute: false,
                controls: true,
                modestbranding: true,
                rel: false,
                showinfo: false
            };

            const playerOptions = { ...defaultOptions, ...options };

            // Build YouTube embed URL with parameters
            let embedUrl = `https://www.youtube.com/embed/${videoId}?`;

const params = new URLSearchParams({
        autoplay: playerOptions.autoplay ? 1 : 0,
        mute: playerOptions.mute ? 1 : 0,
        controls: playerOptions.controls ? 1 : 0,
        modestbranding: playerOptions.modestbranding ? 1 : 0,
        rel: playerOptions.rel ? 1 : 0,
        showinfo: playerOptions.showinfo ? 1 : 0,
        origin: window.location.origin
    });

    embedUrl += params.toString();

    // Adjust height for mobile
    const isMobile = window.innerWidth <= 768;
    const height = isMobile ? '250' : playerOptions.height;
    const width = isMobile ? '100%' : playerOptions.width;

    return `
        <div class="youtube-player-container" style="position: relative; width: ${width}; margin: 1rem 0;">
            <iframe 
                src="${embedUrl}"
                width="${width}" 
                height="${height}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen
                style="border-radius: 8px; max-width: 100%;"
                loading="lazy">
            </iframe>
            <div class="player-controls" style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="youtube-action-btn" onclick="openYouTubeVideo('${videoId}')" title="Open in YouTube">
                    <i class="fab fa-youtube"></i> Watch on YouTube
                </button>
                <button class="youtube-action-btn" onclick="copyYouTubeUrl('${videoId}')" title="Copy URL">
                    <i class="fas fa-link"></i> Copy Link
                </button>
            </div>
        </div>
    `;
},

        /**
         * Create a playlist player for multiple videos
         * @param {Array} videos - Array of video objects
         * @returns {string} HTML for playlist player
         */
        createPlaylistPlayer(videos) {
            if (!videos || videos.length === 0) return '';

            const firstVideo = videos[0];
            const videoId = firstVideo.id.videoId || firstVideo.id;

            let playlistHtml = `
            <div class="youtube-playlist-container">
                <div class="current-player">
                    ${this.createVideoPlayer(videoId, { height: '400' })}
                </div>
                <div class="playlist-sidebar">
                    <h4>Playlist (${videos.length} videos)</h4>
                    <div class="playlist-items">
        `;

            videos.forEach((video, index) => {
                const id = video.id.videoId || video.id;
                const title = video.snippet.title;
                const thumbnail = video.snippet.thumbnails.default.url;
                const duration = video.contentDetails?.duration || 'N/A';

                playlistHtml += `
                <div class="playlist-item ${index === 0 ? 'active' : ''}" 
                     data-video-id="${id}" 
                     onclick="youtubeFeatures.switchVideo('${id}', this)">
                    <img src="${thumbnail}" alt="${title}" class="playlist-thumbnail">
                    <div class="playlist-info">
                        <div class="playlist-title">${title.substring(0, 60)}${title.length > 60 ? '...' : ''}</div>
                        <div class="playlist-duration">${this.formatDuration(duration)}</div>
                    </div>
                </div>
            `;
            });

            playlistHtml += `
                    </div>
                </div>
            </div>
        `;

            return playlistHtml;
        },

        /**
         * Switch video in playlist player
         * @param {string} videoId - New video ID to play
         * @param {HTMLElement} clickedItem - Clicked playlist item
         */
        switchVideo(videoId, clickedItem) {
            // Update active playlist item
            document.querySelectorAll('.playlist-item').forEach(item => {
                item.classList.remove('active');
            });
            clickedItem.classList.add('active');

            // Update the iframe source
            const iframe = document.querySelector('.current-player iframe');
            if (iframe) {
                const newSrc = iframe.src.replace(/embed\/[^?]+/, `embed/${videoId}`);
                iframe.src = newSrc;
            }

            // Scroll the clicked item into view
            clickedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        },

        /**
         * Open video in YouTube
         * @param {string} videoId - YouTube video ID
         */
        openInYouTube(videoId) {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            window.open(url, '_blank');
        },

        /**
         * Share video
         * @param {string} videoId - YouTube video ID
         */
        async shareVideo(videoId) {
            const url = `https://www.youtube.com/watch?v=${videoId}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'YouTube Video',
                        url: url
                    });
                    showNotification('Video shared successfully', 'success');
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        this.copyVideoUrl(videoId);
                    }
                }
            } else {
                this.copyVideoUrl(videoId);
            }
        },

        /**
         * Copy video URL to clipboard
         * @param {string} videoId - YouTube video ID
         */
        async copyVideoUrl(videoId) {
            const url = `https://www.youtube.com/watch?v=${videoId}`;

            try {
                await navigator.clipboard.writeText(url);
                showNotification('Video URL copied to clipboard', 'success');
            } catch (error) {
                console.error('Failed to copy URL:', error);
                showNotification('Failed to copy URL', 'error');
            }
        },

        /**
         * Enhanced format video results with player option
         */
        formatVideoResultsWithPlayer(videos, includePlayer = false) {
            if (!videos.length) return 'No videos found.';

    const isMobile = window.innerWidth <= 768;
    let result = '';

    if (includePlayer && videos.length > 0) {
        // Add embedded player for first video
        const firstVideo = videos[0];
        const videoId = firstVideo.id.videoId;
        
        result += `## 🎥 Now Playing\n\n`;
        result += `### ${firstVideo.snippet.title}\n`;
        result += `**Channel:** ${firstVideo.snippet.channelTitle}\n\n`;
        
        // Add the video player placeholder
        result += `[PLAYER:${videoId}]\n\n`;
    }

    result += `## 📝 Search Results (${videos.length} videos)\n\n`;

    videos.forEach((video, index) => {
        const title = video.snippet.title;
        const channel = video.snippet.channelTitle;
        const description = video.snippet.description.substring(0, isMobile ? 80 : 100) + '...';
        const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
        const videoId = video.id.videoId;

        result += `${index + 1}. **${title}**\n`;
        result += `**Channel:** ${channel}\n`;
        result += `**Description:** ${description}\n`;
        result += `**URL:** [Watch on YouTube](${videoUrl})\n`;
        
        // Add play button for each video
        result += `[PLAY_BUTTON:${videoId}]\n\n`;
    });

    return result;
},

        /**
         * Search YouTube videos
         */
        async searchVideos(query, maxResults = 5) {
            try {
                const response = await fetch('/api/youtube', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'search',
                        query: query,
                        maxResults: maxResults
                    })
                });

                const data = await response.json();
                return data.items || [];
            } catch (error) {
                console.error('YouTube search error:', error);
                return [];
            }
        },

        /**
         * Get video details
         */
        async getVideoDetails(videoId) {
            try {
                const response = await fetch('/api/youtube', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'videoDetails',
                        videoId: videoId
                    })
                });

                const data = await response.json();
                return data.items ? data.items[0] : null;
            } catch (error) {
                console.error('YouTube video details error:', error);
                return null;
            }
        },

        /**
         * Extract video ID from YouTube URL
         */
        extractVideoId(url) {
            const patterns = [
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
                /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }
            return null;
        },

        /**
         * Format video results for display
         */
        formatVideoResults(videos) {
            if (!videos.length) return 'No videos found.';

            const isMobile = window.innerWidth <= 768;
            let result = '## 🎥 YouTube Search Results\n\n';

            videos.forEach((video, index) => {
                const title = video.snippet.title;
                const channel = video.snippet.channelTitle;
                const description = video.snippet.description.substring(0, isMobile ? 80 : 100) + '...';
                const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
                const thumbnail = video.snippet.thumbnails.medium.url;

                result += `### ${index + 1}. [${title}](${videoUrl})\n`;
                result += `**Channel:** ${channel}\n`;
                result += `**Description:** ${description}\n`;

                // Only show thumbnails on larger screens to save mobile data
                if (!isMobile) {
                    result += `![Thumbnail](${thumbnail})\n`;
                }
                result += '\n';
            });

            return result;
        },

        /**
         * Format video details for analysis with mobile optimization
         */
        formatVideoDetails(video) {
            if (!video) return 'Video details not available.';

            const snippet = video.snippet;
            const statistics = video.statistics;
            const contentDetails = video.contentDetails;
            const isMobile = window.innerWidth <= 768;

            let result = `## 📊 Video Analysis\n\n`;
            result += `**Title:** ${snippet.title}\n`;
            result += `**Channel:** ${snippet.channelTitle}\n`;
            result += `**Published:** ${new Date(snippet.publishedAt).toLocaleDateString()}\n`;
            result += `**Duration:** ${this.formatDuration(contentDetails.duration)}\n`;
            result += `**Views:** ${parseInt(statistics.viewCount).toLocaleString()}\n`;
            result += `**Likes:** ${parseInt(statistics.likeCount || 0).toLocaleString()}\n`;
            result += `**Comments:** ${parseInt(statistics.commentCount || 0).toLocaleString()}\n\n`;

            // Truncate description for mobile
            const descriptionLength = isMobile ? 300 : 500;
            result += `**Description:**\n${snippet.description.substring(0, descriptionLength)}${snippet.description.length > descriptionLength ? '...' : ''}\n\n`;

            // Show fewer tags on mobile
            if (snippet.tags) {
                const tagsToShow = isMobile ? snippet.tags.slice(0, 5) : snippet.tags;
                result += `**Tags:** ${tagsToShow.join(', ')}${snippet.tags.length > tagsToShow.length ? '...' : ''}\n`;
            } else {
                result += `**Tags:** No tags\n`;
            }

            return result;
        },

        /**
         * Format ISO 8601 duration to readable format
         */
        formatDuration(duration) {
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
            const hours = (match[1] || '').replace('H', '');
            const minutes = (match[2] || '').replace('M', '');
            const seconds = (match[3] || '').replace('S', '');

            return [hours, minutes, seconds].filter(Boolean).join(':');
        }
    };

    // Enhanced message processing for YouTube content
    function enhancedFetchBotResponse(userMessage) {
        // Check if user wants to search YouTube
        const youtubeSearchPattern = /(?:search|find|look for|show me).+(?:youtube|videos?|on youtube)/i;
        const youtubeUrlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/;

        if (youtubeSearchPattern.test(userMessage)) {
            handleYouTubeSearch(userMessage);
            return;
        }

        if (youtubeUrlPattern.test(userMessage)) {
            handleYouTubeAnalysis(userMessage);
            return;
        }

        // Fall back to regular AI response
        fetchBotResponse(userMessage);
    }

    /**
     * Handle YouTube search requests
     */
    async function handleYouTubeSearch(userMessage) {
        showTypingIndicator();

        try {
            if (window.innerWidth <= 768) {
                showNotification('Searching YouTube...', 'info');
            }

            // Extract search query
            const searchQuery = userMessage.replace(/(?:search|find|look for|show me)/i, '').replace(/(?:youtube|videos?|on youtube)/i, '').trim();

            // Search YouTube with mobile-appropriate result count
            const maxResults = window.innerWidth <= 768 ? 3 : 5;
            const videos = await youtubeFeatures.searchVideos(searchQuery, maxResults);

            if (videos.length === 0) {
                removeTypingIndicator();
                const noResultsMessage = `I couldn't find any YouTube videos for "${searchQuery}". Try a different search term.`;
                addMessageToUI('assistant', noResultsMessage);
                saveMessageToConversation('assistant', noResultsMessage);
                return;
            }

            // Check if user wants to play videos or just search
            const shouldIncludePlayer = userMessage.toLowerCase().includes('play') ||
                userMessage.toLowerCase().includes('watch') ||
                userMessage.toLowerCase().includes('show');

            // Format results with optional player
            const formattedResults = youtubeFeatures.formatVideoResultsWithPlayer(videos, shouldIncludePlayer);

            // Get AI analysis of the search results
            const analysisPrompt = `Based on these YouTube search results for "${searchQuery}", provide a helpful summary and recommendations:\n\n${formattedResults}`;

            const response = await getAIResponse(analysisPrompt);

            removeTypingIndicator();

            const fullResponse = `${formattedResults}\n\n---\n\n${response}`;

            // Add message with special processing for video players
            addMessageToUIWithPlayers('assistant', fullResponse, videos);
            saveMessageToConversation('assistant', fullResponse);

            if (window.innerWidth <= 768) {
                showNotification('YouTube search completed!', 'success');
            }

        } catch (error) {
            console.error('YouTube search error:', error);
            removeTypingIndicator();
            const errorMessage = 'Sorry, I encountered an error while searching YouTube. Please try again.';
            addMessageToUI('assistant', errorMessage);
            saveMessageToConversation('assistant', errorMessage);

            if (window.innerWidth <= 768) {
                showNotification('YouTube search failed', 'error');
            }
        }
    }

    // Add these new functions

    /**
     * Add message to UI with video players
     * @param {string} role - Role of message sender
     * @param {string} content - Message content
     * @param {string} videoId - Single video ID for player
     */
    function addMessageToUIWithPlayer(role, content, videoId) {
        // Process the content to replace player placeholders
        const processedContent = content.replace(/\[PLAYER:([^\]]+)\]/g, (match, id) => {
            return `<div class="youtube-player-embed">${youtubeFeatures.createVideoPlayer(id)}</div>`;
        });

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        // Set up marked.js options
        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function (code, lang) {
                return code;
            },
            langPrefix: 'language-',
            pedantic: false,
            gfm: true,
            breaks: true,
            sanitize: false,
            smartypants: true,
            xhtml: false
        });

        let finalContent;
        if (role === 'assistant') {
            // Process markdown and then add video players
            finalContent = marked.parse(processedContent);
        } else {
            finalContent = processedContent.replace(/\n/g, '<br>');
        }

        messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-bubble ${role === 'assistant' ? 'markdown-content' : ''}">
                ${finalContent}
            </div>
            <div class="message-time">${getCurrentTime()}</div>
            <div class="message-actions">
                ${role === 'assistant' ? `
                    <button class="message-action-btn" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="message-action-btn" title="Read aloud">
                        <i class="fas fa-volume-up"></i>
                    </button>
                ` : `
                    <button class="message-action-btn" title="Edit">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                `}
            </div>
        </div>
    `;

        // Add mobile responsive handling
        if (window.innerWidth <= 768) {
            messageDiv.style.maxWidth = '95%';

            const iframes = messageDiv.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                iframe.style.width = '100%';
                iframe.style.height = '250px';
            });
        }

        // Add event listeners for message actions
        setupMessageActions(messageDiv, content, role);

        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    /**
     * Add message to UI with multiple video players
     * @param {string} role - Role of message sender
     * @param {string} content - Message content
     * @param {Array} videos - Array of video objects
     */
    function addMessageToUIWithPlayers(role, content, videos) {
        // Process content to replace player and button placeholders
        let processedContent = content.replace(/\[PLAYER:([^\]]+)\]/g, (match, id) => {
            return `<div class="youtube-player-embed" data-video-id="${id}"></div>`;
        });

        // Replace play buttons with proper HTML
        processedContent = processedContent.replace(/\[PLAY_BUTTON:([^\]]+)\]/g, (match, id) => {
            const video = videos.find(v => v.id.videoId === id);
            const title = video ? video.snippet.title : 'Unknown Video';

            return `<div class="youtube-play-button-container" data-video-id="${id}">
            <button class="youtube-play-btn" onclick="playYouTubeVideo('${id}', this)">
                <i class="fas fa-play"></i> Play Video
            </button>
            <button class="youtube-action-btn secondary" onclick="openYouTubeVideo('${id}')">
                <i class="fab fa-youtube"></i> YouTube
            </button>
        </div>`;
        });

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function (code, lang) {
                return code;
            },
            langPrefix: 'language-',
            pedantic: false,
            gfm: true,
            breaks: true,
            sanitize: false, // Important: don't sanitize so HTML can render
            smartypants: true,
            xhtml: false
        });

        let finalContent;
        if (role === 'assistant') {
            finalContent = marked.parse(processedContent);
        } else {
            finalContent = processedContent.replace(/\n/g, '<br>');
        }

        messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-bubble ${role === 'assistant' ? 'markdown-content' : ''}">
                ${finalContent}
            </div>
            <div class="message-time">${getCurrentTime()}</div>
            <div class="message-actions">
                ${role === 'assistant' ? `
                    <button class="message-action-btn" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="message-action-btn" title="Read aloud">
                        <i class="fas fa-volume-up"></i>
                    </button>
                ` : `
                    <button class="message-action-btn" title="Edit">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                `}
            </div>
        </div>
    `;

        // Add mobile responsive handling
        if (window.innerWidth <= 768) {
            messageDiv.style.maxWidth = '95%';

            const iframes = messageDiv.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                iframe.style.width = '100%';
                iframe.style.height = '250px';
            });
        }

        // After adding to DOM, process the video players
        elements.chatMessages.appendChild(messageDiv);

        // Process any embedded players
        const playerEmbeds = messageDiv.querySelectorAll('.youtube-player-embed');
        playerEmbeds.forEach(embed => {
            const videoId = embed.dataset.videoId;
            embed.innerHTML = youtubeFeatures.createVideoPlayer(videoId);
        });

        setupMessageActions(messageDiv, content, role);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    }

    // Add these global functions that can be called from onclick attributes

    /**
     * Play YouTube video inline
     */
    window.playYouTubeVideo = function (videoId, buttonElement) {
        const container = buttonElement.closest('.youtube-play-button-container');
        if (container) {
            // Replace the button container with the video player
            container.innerHTML = youtubeFeatures.createVideoPlayer(videoId, { autoplay: true });

            // Scroll the video into view
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    /**
     * Open video in YouTube
     */
    window.openYouTubeVideo = function (videoId) {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(url, '_blank');
    };

    /**
     * Copy video URL to clipboard
     */
    window.copyYouTubeUrl = function (videoId) {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Video URL copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to copy URL', 'error');
        });
    };


    // Add this function to youtubeFeatures object
    youtubeFeatures.playVideoInline = function (videoId, buttonElement) {
        const container = buttonElement.closest('.youtube-play-button-container');
        if (container) {
            // Replace the button container with the video player
            container.innerHTML = this.createVideoPlayer(videoId, { autoplay: true });

            // Scroll the video into view
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    /**
     * Handle YouTube video analysis with player
     */
    async function handleYouTubeAnalysis(userMessage) {
        showTypingIndicator();

        try {
            if (window.innerWidth <= 768) {
                showNotification('Analyzing YouTube video...', 'info');
            }

            const videoId = youtubeFeatures.extractVideoId(userMessage);

            if (!videoId) {
                removeTypingIndicator();
                const errorMessage = 'I couldn\'t extract the video ID from that YouTube URL. Please make sure it\'s a valid YouTube link.';
                addMessageToUI('assistant', errorMessage);
                saveMessageToConversation('assistant', errorMessage);
                return;
            }

            const videoDetails = await youtubeFeatures.getVideoDetails(videoId);

            if (!videoDetails) {
                removeTypingIndicator();
                const errorMessage = 'I couldn\'t retrieve details for that YouTube video. It might be private or unavailable.';
                addMessageToUI('assistant', errorMessage);
                saveMessageToConversation('assistant', errorMessage);
                return;
            }

            // Create player for the analyzed video
            const videoPlayer = youtubeFeatures.createVideoPlayer(videoId, {
                height: window.innerWidth <= 768 ? '250' : '400'
            });

            const formattedDetails = youtubeFeatures.formatVideoDetails(videoDetails);
            const analysisPrompt = `Analyze this YouTube video and provide insights, key takeaways, and recommendations:\n\n${formattedDetails}`;
            const aiAnalysis = await getAIResponse(analysisPrompt);

            removeTypingIndicator();

            const fullResponse = `## 🎥 Video Player\n\n[PLAYER:${videoId}]\n\n${formattedDetails}\n\n---\n\n## 🤖 AI Analysis\n\n${aiAnalysis}`;

            // Add message with video player
            addMessageToUIWithPlayer('assistant', fullResponse, videoId);
            saveMessageToConversation('assistant', fullResponse);

            if (window.innerWidth <= 768) {
                showNotification('Video analysis completed!', 'success');
            }

        } catch (error) {
            console.error('YouTube analysis error:', error);
            removeTypingIndicator();
            const errorMessage = 'Sorry, I encountered an error while analyzing that YouTube video. Please try again.';
            addMessageToUI('assistant', errorMessage);
            saveMessageToConversation('assistant', errorMessage);

            if (window.innerWidth <= 768) {
                showNotification('Video analysis failed', 'error');
            }
        }
    }

    /**
     * Get AI response for YouTube content
     */
    async function getAIResponse(prompt) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: state.settings.model,
                    messages: [
                        {
                            role: "system",
                            content: "You are Aziona, an AI assistant that helps analyze and discuss YouTube content. Provide insightful, helpful analysis and recommendations."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI response error:', error);
            return 'I apologize, but I couldn\'t generate an analysis at this time.';
        }
    }

    // Update the existing sendMessage function to use enhanced processing
    function sendMessage() {
        const message = elements.chatInput.value.trim();
        if (!message || state.isTyping) return;

        // Add user message to UI
        addMessageToUI('user', message);
        elements.chatInput.value = '';
        resizeInput();

        // Store message in conversation
        saveMessageToConversation('user', message);
        chatHistory.push({ role: 'user', content: message });

        // Use enhanced processing that includes YouTube features
        enhancedFetchBotResponse(message);
    }

    // Add event listeners for YouTube buttons
    function setupYouTubeEventListeners() {
        // Desktop YouTube search button
        const desktopSearchBtn = document.getElementById('youtube-search');
        if (desktopSearchBtn) {
            desktopSearchBtn.addEventListener('click', async () => {
                const query = await showPopup({
                    type: 'prompt',
                    title: 'Search YouTube',
                    message: 'Enter your search query:',
                    placeholder: window.innerWidth <= 768 ? 'e.g., "AI tutorials"' : 'e.g., "machine learning tutorials"',
                    confirmText: 'Search'
                });

                if (query?.trim()) {
                    elements.chatInput.value = `Search YouTube for ${query.trim()}`;
                    sendMessage();
                }
            });
        }

        // Desktop YouTube analyze button
        const desktopAnalyzeBtn = document.getElementById('youtube-analyze');
        if (desktopAnalyzeBtn) {
            desktopAnalyzeBtn.addEventListener('click', async () => {
                const url = await showPopup({
                    type: 'prompt',
                    title: 'Analyze YouTube Video',
                    message: 'Enter the YouTube video URL:',
                    placeholder: window.innerWidth <= 768 ? 'YouTube URL...' : 'https://www.youtube.com/watch?v=...',
                    confirmText: 'Analyze'
                });

                if (url?.trim()) {
                    elements.chatInput.value = url.trim();
                    sendMessage();
                }
            });
        }

        // Add touch event handling for mobile buttons
        if ('ontouchstart' in window) {
            const mobileButtons = [
                'mobile-youtube-search',
                'mobile-youtube-analyze',
                'mobile-voice-input',
                'mobile-attach-file'
            ];

            mobileButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('touchstart', function (e) {
                        this.style.transform = 'translateY(0)';
                        this.style.background = 'var(--bg-hover)';
                    });

                    btn.addEventListener('touchend', function (e) {
                        this.style.transform = 'translateY(-2px)';
                        this.style.background = '';
                    });
                }
            });
        }
    }

    const desktopVoiceBtn = document.getElementById('voice-input');
    if (desktopVoiceBtn) {
        desktopVoiceBtn.addEventListener('click', () => {
            // Your existing voice input logic here
            mobileActionPopup.handleVoiceInput();
        });
    }
    // Mobile Action Popup Functions
    const mobileActionPopup = {
        popup: null,
        overlay: null,
        content: null,
        isOpen: false,

        init() {
            this.popup = document.getElementById('mobile-action-popup');
            this.overlay = document.getElementById('mobile-action-overlay');
            this.content = document.querySelector('.mobile-action-content');

            // Setup event listeners
            this.setupEventListeners();
        },

        setupEventListeners() {
            // More button click
            document.getElementById('mobile-more-btn').addEventListener('click', () => {
                this.open();
            });

            // Close button
            document.getElementById('mobile-action-close').addEventListener('click', () => {
                this.close();
            });

            // Overlay click
            this.overlay.addEventListener('click', () => {
                this.close();
            });

            // Prevent content clicks from closing popup
            this.content.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Mobile action buttons
            document.getElementById('mobile-attach-file').addEventListener('click', () => {
                this.close();
                // Trigger the same functionality as desktop attach button
                showNotification('File attachment coming soon', 'info');
            });

            document.getElementById('mobile-voice-input').addEventListener('click', () => {
                this.close();
                // Trigger voice input functionality
                this.handleVoiceInput();
            });

            document.getElementById('mobile-youtube-search').addEventListener('click', () => {
                this.close();
                // Trigger YouTube search
                this.handleYouTubeSearch();
            });

            document.getElementById('mobile-youtube-analyze').addEventListener('click', () => {
                this.close();
                // Trigger YouTube analysis
                this.handleYouTubeAnalyze();
            });

            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },

        open() {
            this.popup.classList.add('active');
            document.body.classList.add('mobile-popup-open');
            this.isOpen = true;

            // Focus management
            this.content.focus();
        },

        close() {
            this.popup.classList.remove('active');
            document.body.classList.remove('mobile-popup-open');
            this.isOpen = false;

            // Return focus to more button
            document.getElementById('mobile-more-btn').focus();
        },

        async handleVoiceInput() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                showNotification('Speech recognition not supported in your browser', 'error');
                return;
            }

            const recognition = new SpeechRecognition();
            const voiceBtn = document.getElementById('mobile-voice-input');

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                voiceBtn.classList.add('active');
                showNotification('Listening...', 'info');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                elements.chatInput.value = transcript;
                resizeInput();
                showNotification('Voice input received', 'success');
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                voiceBtn.classList.remove('active');
                showNotification(`Error: ${event.error}`, 'error');
            };

            recognition.onend = () => {
                voiceBtn.classList.remove('active');
            };

            recognition.start();
        },

        // Update your mobile action popup handlers

        async handleYouTubeSearch() {
            try {
                const query = await showPopup({
                    type: 'prompt',
                    title: 'Search YouTube',
                    message: 'Enter your search query:',
                    placeholder: 'e.g., "play AI tutorials"',
                    confirmText: 'Search'
                });

                if (query && typeof query === 'string' && query.trim()) {
                    // Add "play" keyword to enable video player
                    const searchText = query.toLowerCase().includes('play') ?
                        query.trim() : `play ${query.trim()}`;
                    elements.chatInput.value = `Search YouTube for ${searchText}`;
                    sendMessage();
                } else if (query === null || query === undefined) {
                    console.log('User cancelled YouTube search');
                } else {
                    showNotification('Please enter a valid search query', 'warning');
                }
            } catch (error) {
                console.error('Error in YouTube search handler:', error);
                showNotification('Error opening search dialog', 'error');
            }
        },

        async handleYouTubeAnalyze() {
            try {
                const url = await showPopup({
                    type: 'prompt',
                    title: 'Analyze YouTube Video',
                    message: 'Enter the YouTube video URL:',
                    placeholder: 'YouTube URL...',
                    confirmText: 'Analyze'
                });

                // Check if URL is valid and not null/undefined
                if (url && typeof url === 'string' && url.trim()) {
                    elements.chatInput.value = url.trim();
                    sendMessage();
                } else if (url === null || url === undefined) {
                    // User cancelled the dialog
                    console.log('User cancelled YouTube analysis');
                } else {
                    showNotification('Please enter a valid YouTube URL', 'warning');
                }
            } catch (error) {
                console.error('Error in YouTube analysis handler:', error);
                showNotification('Error opening analysis dialog', 'error');
            }
        }
    };

    // Initialize the application
    init();
});