const translateBtn = document.getElementById('translate-btn');
const textInput = document.getElementById('text-input');
const controlsGroup = document.querySelector('.controls-group');
const mainCard = document.querySelector('.main-card');
import OpenAI from "openai";

// Assuming the API key is stored in an environment variable
// In a real app, you should proxy this request through a backend to hide the key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

translateBtn.addEventListener('click', async () => {
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
        const translatedText = data

        renderTranslation(translatedText);

    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        translateBtn.innerText = originalBtnText;
        translateBtn.disabled = false;
    }
});

function renderTranslation(translatedText) {
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

        translateBtn.innerText = 'Chat in this language';
        translateBtn.onclick = () => window.location.reload(); // Simple reset for now
    }
}
