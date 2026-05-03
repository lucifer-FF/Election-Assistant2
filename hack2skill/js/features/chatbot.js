const state = {
    history: [],
    isSending: false,
    requestCounter: 0,
    activeRequestId: null,
    lastHandledSignature: '',
    inputHandlerAttached: false
};

const CHAT_HISTORY_LIMIT = 12;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;

export function setupChatbot() {
    window.sendChatbotMessage = sendChatbotMessage;

    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput && !state.inputHandlerAttached) {
        chatbotInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendChatbotMessage();
            }
        });
        state.inputHandlerAttached = true;
    }
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbot-input');
    const messagesDiv = document.getElementById('chatbot-messages');
    const sendButton = document.querySelector('#chatbot-modal .btn.btn-primary');
    if (!input || !messagesDiv) return;

    const message = input.value.trim();
    if (!message || state.isSending) return;

    state.requestCounter += 1;
    const requestId = `req_${state.requestCounter}_${Date.now()}`;
    state.activeRequestId = requestId;
    state.isSending = true;

    input.value = '';
    setSendingState(true, sendButton, input);
    appendUserMessage(messagesDiv, message);

    const typingIndicator = appendTypingIndicator(messagesDiv, requestId);
    const traceId = `chat_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

    try {
        const payload = {
            message,
            history: state.history.slice(-CHAT_HISTORY_LIMIT)
        };

        const responseData = await requestWithRetry(payload, traceId);
        if (state.activeRequestId !== requestId) return;

        const botRaw = (responseData?.reply || responseData?.fallback || '').trim();
        const verificationMeta = formatVerificationMeta(responseData?.verification);
        const replyText = botRaw || fallbackResponse(message);
        const signature = `${message}::${replyText}`;
        if (state.lastHandledSignature === signature) {
            console.warn('[Chatbot] Duplicate response prevented', { traceId, signature });
            return;
        }
        state.lastHandledSignature = signature;

        typingIndicator.remove();
        await appendAnimatedBotMessage(messagesDiv, `${replyText}${verificationMeta}`);

        state.history.push({ role: 'user', text: message });
        state.history.push({ role: 'assistant', text: replyText });
        state.history = state.history.slice(-CHAT_HISTORY_LIMIT * 2);
    } catch (error) {
        console.error('[Chatbot] Request failed', { traceId, error: error?.message || error });
        typingIndicator.remove();
        appendBotMessage(messagesDiv, fallbackResponse(message), true);
    } finally {
        if (state.activeRequestId === requestId) {
            state.activeRequestId = null;
            state.isSending = false;
            setSendingState(false, sendButton, input);
        }
    }
}

function getApiUrl() {
    if (window.APP_CONFIG?.apiUrl) {
        return `${window.APP_CONFIG.apiUrl.replace(/\/$/, '')}/chatbot/message`;
    }

    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:3000/api/chatbot/message`;
}

async function requestWithRetry(payload, traceId) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(getApiUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-Id': traceId
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await safeParseJson(response);

            if (!response.ok) {
                const message = data?.error || data?.message || `HTTP ${response.status}`;
                const error = new Error(message);
                error.status = response.status;
                error.responsePayload = data;
                throw error;
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;
            const status = error?.status;
            const shouldRetry = error?.name === 'AbortError' || !status || status >= 500 || status === 429;

            console.error('[Chatbot] API attempt failed', {
                traceId,
                attempt: attempt + 1,
                status,
                error: error?.message || error
            });

            if (!shouldRetry || attempt >= MAX_RETRIES) break;
            await wait((attempt + 1) * 300);
        }
    }

    throw lastError || new Error('Unknown chatbot error');
}

function appendUserMessage(container, message) {
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `<p>${escapeHtml(message)}</p>`;
    container.appendChild(userMsg);
    scrollToBottom(container, true);
}

function appendTypingIndicator(container, requestId) {
    const indicator = document.createElement('div');
    indicator.className = 'bot-message typing-indicator';
    indicator.dataset.requestId = requestId;
    indicator.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(indicator);
    scrollToBottom(container, true);
    return indicator;
}

function appendBotMessage(container, text, isError = false) {
    const botMsg = document.createElement('div');
    botMsg.className = `bot-message${isError ? ' bot-error' : ''}`;
    botMsg.innerHTML = renderMarkdown(text);
    container.appendChild(botMsg);
    scrollToBottom(container, true);
    return botMsg;
}

async function appendAnimatedBotMessage(container, text) {
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message typing-reveal';
    const content = document.createElement('p');
    botMsg.appendChild(content);
    container.appendChild(botMsg);

    const revealed = [];
    const source = String(text);
    const step = source.length > 500 ? 6 : 2;
    for (let i = 0; i < source.length; i += step) {
        revealed.push(source.slice(i, i + step));
        content.textContent = revealed.join('');
        scrollToBottom(container, false);
        await wait(14);
    }

    botMsg.classList.remove('typing-reveal');
    botMsg.innerHTML = renderMarkdown(text);
    scrollToBottom(container, true);
}

function renderMarkdown(text) {
    const escaped = escapeHtml(String(text || ''));
    const withLinks = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    const withInlineCode = withLinks.replace(/`([^`]+)`/g, '<code>$1</code>');
    const withBold = withInlineCode.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const withItalic = withBold.replace(/\*(.*?)\*/g, '<em>$1</em>');

    const lines = withItalic.split('\n');
    const html = [];
    let inList = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                html.push('<ul>');
                inList = true;
            }
            html.push(`<li>${trimmed.slice(2)}</li>`);
        } else {
            if (inList) {
                html.push('</ul>');
                inList = false;
            }
            if (trimmed.length > 0) {
                html.push(`<p>${trimmed}</p>`);
            }
        }
    }
    if (inList) html.push('</ul>');
    return html.join('') || '<p>...</p>';
}

async function safeParseJson(response) {
    try {
        return await response.json();
    } catch (error) {
        console.error('[Chatbot] Failed to parse JSON response', {
            status: response.status,
            error: error?.message
        });
        return {};
    }
}

function scrollToBottom(container, force = false) {
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (force || distanceFromBottom < 120) {
        container.scrollTop = container.scrollHeight;
    }
}

function setSendingState(isSending, sendButton, input) {
    if (sendButton) {
        sendButton.disabled = isSending;
        sendButton.textContent = isSending ? 'Sending...' : 'Send';
    }
    if (input) {
        input.disabled = isSending;
        if (!isSending) input.focus();
    }
}

function fallbackResponse(userMessage) {
    return `Data could not be verified for this query.

Please refine your question with constituency/state details or try again later.

Official references:
- [Election Commission of India](https://eci.gov.in/)
- [NVSP](https://voters.eci.gov.in/)
- [Electoral Search](https://electoralsearch.eci.gov.in/)`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatVerificationMeta(verification) {
    if (!verification) return '';
    const status = verification.status === 'verified' ? 'Verified' : 'Unverified';
    const time = verification.lastUpdated ? new Date(verification.lastUpdated).toLocaleString() : 'N/A';
    const sources = Array.isArray(verification.sources) ? verification.sources.filter((s) => s?.url).slice(0, 3) : [];
    const sourceLines = sources.map((s) => `- [${s.name || 'Source'}](${s.url})`).join('\n');
    return `\n\n---\n${status} data\nLast updated: ${time}${sourceLines ? `\n${sourceLines}` : ''}`;
}
