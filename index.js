const translateBtn = document.getElementById('translate-btn');
const textInput = document.getElementById('text-input');
const controlsGroup = document.querySelector('.controls-group');
const mainCard = document.querySelector('.main-card');
import OpenAI from "openai";

// Assuming the API key is stored in an environment variable
// In a real app, you should proxy this request through a backend to hide the key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const handleTranslation = async () => {
    const text = textInput.value;
    const selectedLangRadio = document.querySelector('input[name="language"]:checked');

    if (!text) {
        alert('Please enter some text to translate.');
        return;
    }

    if (!selectedLangRadio) {
        alert('Please select a language.');
        return;
    }

    const targetLangCode = selectedLangRadio.value;
    let targetLangName = '';

    switch (targetLangCode) {
        case 'fr': targetLangName = 'French'; break;
        case 'es': targetLangName = 'Spanish'; break;
        case 'ja': targetLangName = 'Japanese'; break;
        default: targetLangName = 'English';
    }

    // Show loading state
    const originalBtnText = translateBtn.innerText;
    translateBtn.innerText = 'Translating...';
    translateBtn.disabled = true;
    const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
    })
    try {
        const response = await client.responses.create({
            model: "gpt-5-mini", // Updated model as per new docs
            instructions: "You are a helpful translator. Translate the user's text accurately.",
            input: `Translate the following text to ${targetLangName}: ${text}`,
            // reasoning: { effort: "low" }, // Optional, based on docs
        });
        const data = response.output_text;
        console.log(data);
        // Accessing the text content directly from the output message
        const translatedText = data;

        renderTranslation(translatedText, targetLangCode);

    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
        translateBtn.innerText = originalBtnText;
    } finally {
        translateBtn.disabled = false;
    }
};

translateBtn.onclick = handleTranslation;

function renderTranslation(translatedText, targetLangCode) {
    // Create the new output container styled like input-group
    const outputContainer = document.createElement('div');
    outputContainer.className = 'input-group'; // Reusing input-group styles

    // Create label
    const label = document.createElement('label');
    label.className = 'section-label';
    label.innerText = 'Your translation 👇';

    // Create textarea for output (readonly)
    const outputArea = document.createElement('textarea');
    outputArea.readOnly = true;
    outputArea.value = translatedText;

    // Append elements
    outputContainer.appendChild(label);
    outputContainer.appendChild(outputArea);

    // Replace the controls group with the new output container
    // We keep the translate button at the bottom of the main card, 
    // so we only replace the middle section (controls-group)
    if (controlsGroup && controlsGroup.parentNode) {
        controlsGroup.parentNode.replaceChild(outputContainer, controlsGroup);

        // Hide the translate button after successful translation as per the "result view" implication
        // or keep it to allow "Start Over"? 
        // The prompt says "replace the select language section", but doesn't explicitly say remove the button.
        // However, usually in these flows, you'd want a "Start Over" button.
        // For now, let's change the button to "Start Over" to allow resetting.

        translateBtn.innerText = 'Chat in this language'
        translateBtn.onclick = () => startChatMode(translatedText, targetLangCode)
    }
}

let chatMessages = [];
let currentChatLang = 'en'; // Default

function startChatMode(initialMessage, initialLangCode) {
    currentChatLang = initialLangCode;

    // Initialize chat history with the translation context
    // We treat the initial translation as the AI's first message or context
    chatMessages = [
        {
            role: "assistant",
            content: initialMessage
        }
    ];

    // Clear the main card content
    mainCard.innerHTML = '';

    // Create Chat Interface
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';

    // 0. Instruction Header
    const instructionHeader = document.createElement('div');
    instructionHeader.className = 'chat-header';
    instructionHeader.innerText = "Select the language you want me to translate into, type your text and hit send!";
    chatContainer.appendChild(instructionHeader);

    // 1. Chat History
    const chatHistory = document.createElement('div');
    chatHistory.className = 'chat-history';

    // Render initial message
    // Fix: Ensure initialMessage is valid. If it's an object (from previous bug), extract text.
    let initialText = initialMessage;
    if (typeof initialMessage === 'object') {
        initialText = initialMessage.text || "Hello"; // Fallback
    }

    // The design shows the user's original text first, then the translation.
    // But our startChatMode only gets the translation.
    // Ideally, we should pass both. For now, let's just show the translation as the AI's start.
    // Wait, the design shows "How are you?" (User) then "Comment allez-vous?" (AI).
    // So we should probably show the original text as a user message too if possible.
    // For now, let's just render the AI response (translation) as the first bubble.

    const initialBubble = createMessageBubble(initialText, 'ai');
    chatHistory.appendChild(initialBubble);

    // 2. Input Area
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chat-input-container';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'chat-input-wrapper';

    const chatInput = document.createElement('textarea');
    chatInput.className = 'chat-input';
    chatInput.placeholder = 'Type a message...';

    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.innerHTML = `
        <img src="assets/send-icon.png" alt="Send" style="width: 20px; height: 20px;">
    `;
    // Note: User didn't provide send-icon.png, but the design has a specific green arrow.
    // I'll stick to the SVG for now but style it green.
    sendBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#32CD32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `;

    inputWrapper.appendChild(chatInput);
    inputWrapper.appendChild(sendBtn);

    // 3. Language Flags (for switching language)
    const flagsContainer = document.createElement('div');
    flagsContainer.className = 'chat-flags';

    const languages = [
        { code: 'fr', img: 'assets/fr-flag.png', name: 'French' },
        { code: 'es', img: 'assets/sp-flag.png', name: 'Spanish' },
        { code: 'ja', img: 'assets/jpn-flag.png', name: 'Japanese' }
    ];

    languages.forEach(lang => {
        const flagDiv = document.createElement('div');
        flagDiv.className = `chat-flag-option ${lang.code === currentChatLang ? 'active' : ''}`;
        flagDiv.onclick = () => {
            currentChatLang = lang.code;
            document.querySelectorAll('.chat-flag-option').forEach(el => el.classList.remove('active'));
            flagDiv.classList.add('active');
        };

        const img = document.createElement('img');
        img.src = lang.img;
        img.alt = lang.name;
        img.className = 'chat-flag-img';

        flagDiv.appendChild(img);
        flagsContainer.appendChild(flagDiv);
    });

    inputContainer.appendChild(inputWrapper);
    inputContainer.appendChild(flagsContainer);

    chatContainer.appendChild(chatHistory);
    chatContainer.appendChild(inputContainer);

    mainCard.appendChild(chatContainer);

    // Event Listeners for Chat
    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add User Message
        chatMessages.push({ role: "user", content: text });
        chatHistory.appendChild(createMessageBubble(text, 'user'));
        chatInput.value = '';
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Call API
        try {
            // Get language name
            const langName = languages.find(l => l.code === currentChatLang)?.name || 'English';

            const client = new OpenAI({
                apiKey: OPENAI_API_KEY,
                dangerouslyAllowBrowser: true,
            });

            const response = await client.responses.create({
                model: "gpt-5-mini",
                reasoning: { effort: "low" },
                input: [
                    {
                        role: "developer",
                        content: `You are a helpful assistant. Reply in ${langName}.`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
            });

            console.log(response.output_text);
            const reply = response.output_text;

            // Add AI Message
            chatMessages.push({ role: "assistant", content: reply });
            chatHistory.appendChild(createMessageBubble(reply, 'ai'));
            chatHistory.scrollTop = chatHistory.scrollHeight;

        } catch (error) {
            console.error(error);
            alert('Failed to send message');
        }
    };

    sendBtn.onclick = sendMessage;
    chatInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
}

function createMessageBubble(text, type) {
    const bubble = document.createElement('div');
    bubble.className = `message ${type}`;
    bubble.innerText = text;
    return bubble;
}
