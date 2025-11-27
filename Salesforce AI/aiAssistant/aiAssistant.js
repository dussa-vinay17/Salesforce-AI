import { LightningElement, track } from 'lwc';
import getAIResponse from '@salesforce/apex/OpenAIService.getAIResponse';

import getPipelineSummary from '@salesforce/apex/OpportunityAnalytics.getPipelineSummary';
import getStageWiseSummary from '@salesforce/apex/OpportunityAnalytics.getStageWiseSummary';
import getOwnerSummary from '@salesforce/apex/OpportunityAnalytics.getOwnerSummary';
import getClosedWonAmount from '@salesforce/apex/OpportunityAnalytics.getClosedWonAmount';
import getOpenPipeline from '@salesforce/apex/OpportunityAnalytics.getOpenPipeline';

export default class AiAssistant extends LightningElement {

    @track userInput = '';
    recognition;
    isRecording = false;

    connectedCallback() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SR) {
            this.recognition = new SR();
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (e) => {
                this.userInput = e.results[0][0].transcript;

                const inputBox = this.template.querySelector('lightning-textarea');
                if (inputBox) inputBox.value = this.userInput;

                this.sendMessage();
            };
        }
    }

    handleInput(event) {
        this.userInput = event.target.value;
    }

    startVoiceInput() {
        if (!this.recognition) {
            alert("Browser doesn't support speech recognition.");
            return;
        }
        this.recognition.start();
    }

    sendMessage() {
        if (!this.userInput) return;

        const msgArea = this.template.querySelector('[data-msg-area]');

        // User message
        msgArea.innerHTML += `
            <div class="msg user-msg">${this.escapeHtml(this.userInput)}</div>
        `;

        const question = this.userInput;
        this.userInput = '';
        const inputBox = this.template.querySelector('lightning-textarea');
        if (inputBox) inputBox.value = '';

        // Typing animation
        msgArea.innerHTML += `
            <div class="msg ai-msg typing" id="typingDots">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        `;

        this.scrollToBottom(msgArea);

        // 🔥 REAL CALL TO CHATGPT
        getAIResponse({ userQuery: question })
            .then(response => {

                const dots = this.template.querySelector('#typingDots');
                if (dots) dots.remove();

                msgArea.innerHTML += `
                    <div class="msg ai-msg">${this.escapeHtml(response)}</div>
                `;

                this.scrollToBottom(msgArea);
            })
            .catch(error => {
                console.error(error);
            });
    }

    escapeHtml(t) {
        return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }

    scrollToBottom(area) {
        setTimeout(() => {
            area.scrollTop = area.scrollHeight;
        }, 50);
    }

    // Salesforce Quick Commands
    askPipeline() { getPipelineSummary().then(res => this.displayAI(res)); }
    askStage() { getStageWiseSummary().then(res => this.displayAI(res)); }
    askOwner() { getOwnerSummary().then(res => this.displayAI(res)); }
    askClosedWon() { getClosedWonAmount().then(res => this.displayAI(res)); }
    askOpenPipeline() { getOpenPipeline().then(res => this.displayAI(res)); }

    displayAI(msg) {
        const msgArea = this.template.querySelector('[data-msg-area]');
        msgArea.innerHTML += `<div class="msg ai-msg">${this.escapeHtml(msg)}</div>`;
        this.scrollToBottom(msgArea);
    }
}
