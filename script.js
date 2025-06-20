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
        'assistant': "You are Wahab , a professional AI assistant. Provide clear and concise answers to inquiries.",
        'developer': "You are Wahab , a technical AI assistant focused on code and development. Provide explanations with code examples when appropriate.",
        'teacher': "You are Wahab , an educational AI assistant. Explain concepts thoroughly with examples and analogies that are easy to understand.",
        'creative': "You are Wahab , a creative AI partner. Provide imaginative and inspiring responses to help with creative projects."
    };

    // Chat history for API context (separate from state.chatHistory for API usage)
    let chatHistory = [];

    /**
     * Initialization
     */
    function init() {
        loadSavedState();
        initializeTheme();
        initParticles();
        // Check if an active conversation was loaded from localStorage
        const activeConvId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
        const hasActiveConversation = state.chatHistory.some(c => c.id === activeConvId);

        // Only create a new conversation if we don't have an active one
        if (!hasActiveConversation) {
            createNewConversation();
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
    // Find current conversation in history or create a new one
    let conversation = state.chatHistory.find(c => c.id === state.activeConversationId);

    // If this is user's first message in a new conversation, generate a name
    if (role === 'user' && state.isNewConversation) {
        state.isNewConversation = false;
        
        // Generate name from first user message
        state.activeConversationName = generateConversationName(content);
        elements.sectionTitle.textContent = state.activeConversationName;
        
        // Create the conversation object now (wasn't saved previously)
        conversation = {
            id: state.activeConversationId,
            name: state.activeConversationName,
            timestamp: Date.now(),
            messages: []
        };
        
        // Add the welcome message that was displayed but not saved
        if (chatHistory.length > 0 && chatHistory[0].role === 'assistant') {
            conversation.messages.push({
                role: 'assistant',
                content: chatHistory[0].content,
                timestamp: Date.now() - 1000 // Slightly earlier timestamp
            });
        }
        
        state.chatHistory.unshift(conversation);
    }

    if (!conversation) {
        conversation = {
            id: state.activeConversationId,
            name: state.activeConversationName,
            timestamp: Date.now(),
            messages: []
        };
        state.chatHistory.unshift(conversation);
    }

    // Add message to conversation
    conversation.messages.push({
        role,
        content,
        timestamp: Date.now()
    });

    // Rest of the function remains the same...
    // (Check message limits, update timestamp, save to localStorage)
    
    // Check if we've exceeded the message limit
    if (conversation.messages.length > state.settings.messageLimit) {
        // Remove oldest messages from UI
        const messagesToRemove = conversation.messages.length - state.settings.messageLimit;

        // Remove oldest messages from DOM
        for (let i = 0; i < messagesToRemove; i++) {
            if (elements.chatMessages.firstChild) {
                elements.chatMessages.removeChild(elements.chatMessages.firstChild);
            }
        }

        // Remove oldest messages from conversation array
        conversation.messages = conversation.messages.slice(messagesToRemove);

        // Also update chatHistory for API context to keep in sync
        chatHistory = chatHistory.slice(messagesToRemove);

        // Show notification
        showNotification('Older messages have been removed to improve performance', 'info');
    }

    // Update timestamp
    conversation.timestamp = Date.now();

    // Save to localStorage if enabled
    if (state.settings.saveHistory) {
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.chatHistory));
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

const currentConvo = state.chatHistory.find(c => c.id === state.activeConversationId);
if (currentConvo && currentConvo.messages.length <= 2) {
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
    // Use existing API call structure
    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: state.settings.model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that generates short, descriptive titles."
                },
                {
                    role: "user",
                    content: `Based on this conversation, generate a concise title (max 5 words):\nUser: ${userMsg}\nAI: ${aiReply.substring(0, 100)}`
                }
            ],
            temperature: 0.7,
            max_tokens: 20
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            let title = data.choices[0].message.content.trim();
            // Remove quotes if present
            title = title.replace(/^["'](.*)["']$/, '$1');
            
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
                    updateHistoryUI();
                }
            }
        }
    })
    .catch(err => {
        console.warn('Failed to generate AI title:', err);
        // The default title from the first message will remain
    });
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
    state.activeConversationName = 'New Conversation';

    // Update UI
    elements.sectionTitle.textContent = state.activeConversationName;
    elements.chatMessages.innerHTML = '';

    // Reset chat history for API context
    chatHistory = [];

    // Add welcome message
    const welcomeMessage = "Hello! I'm Wahab , your AI assistant. How can I help you today?";
    addMessageToUI('assistant', welcomeMessage);

    // Add to API context history but DON'T save to localStorage yet
    chatHistory.push({
        role: 'assistant',
        content: welcomeMessage
    });
    
    // Set flag to indicate this is a new conversation without user messages
    state.isNewConversation = true;
    
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
                exportText += `## ${msg.role === 'user' ? 'You' : 'Wahab AI'}\n${msg.content}\n\n`;
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

    }

    // Initialize the application
    init();
});