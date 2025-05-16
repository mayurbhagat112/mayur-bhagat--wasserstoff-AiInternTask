// Tab switching logic
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');

        // Remove active class from all buttons and hide all tab contents
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

        // Activate clicked tab and show corresponding content
        button.classList.add('active');
        document.getElementById(tab).style.display = 'block';
    });
});

// Store chat history
const chatHistory = [];

// Function to render chat messages
function renderChat() {
    const chatHistoryDiv = document.getElementById('chat-history');
    chatHistoryDiv.innerHTML = '';
    chatHistory.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', msg.sender);
        // Replace citations in message text with clickable spans
        let msgHtml = msg.text.replace(/\[([^\]]+)\]/g, (match, citation) => {
            return `<span class="citation" title="Click to view document">${match}</span>`;
        });
        msgDiv.innerHTML = msgHtml;
        chatHistoryDiv.appendChild(msgDiv);
    });
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// Handle document upload
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    if (fileInput.files.length === 0) {
        alert("Please select a file to upload.");
        return;
    }
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8000/api/upload", {
        method: 'POST',
        body: formData
    });
    if (response.ok) {
        alert("Document uploaded and indexed.");
        // Enable the question form
        document.getElementById('question-input').disabled = false;
        document.getElementById('query-btn').disabled = false;

        // Add document to document list with checkbox (simulate metadata)
        const docList = document.getElementById('document-list');
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.classList.add('doc-checkbox');
        // For demo, use file name as doc ID and title
        const label = document.createElement('label');
        label.textContent = `${file.name} (Uploaded)`;
        li.appendChild(checkbox);
        li.appendChild(label);
        docList.appendChild(li);
    } else {
        const errorData = await response.json();
        alert("Upload failed: " + (errorData.detail || errorData.error));
    }
});

// Handle question query
document.getElementById('query-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = document.getElementById('question-input').value;
    if (!question) {
        alert("Please enter a question.");
        return;
    }

    // Add user message to chat history and render
    chatHistory.push({ sender: 'user', text: question });
    renderChat();

    const response = await fetch("http://localhost:8000/api/query", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ question: question })
    });
    if (response.ok) {
        const data = await response.json();

        // Add bot answer to chat history with citations
        chatHistory.push({ sender: 'bot', text: data.answer });
        renderChat();

        // Populate per-document answers table
        const tbody = document.querySelector('#answers-table tbody');
        tbody.innerHTML = '';
        data.sources.forEach(src => {
            const tr = document.createElement('tr');
            const docTd = document.createElement('td');
            docTd.textContent = src.doc;
            const snippetTd = document.createElement('td');
            snippetTd.textContent = src.sentence;
            const citationTd = document.createElement('td');
            citationTd.textContent = src.citation || src.doc;
            tr.appendChild(docTd);
            tr.appendChild(snippetTd);
            tr.appendChild(citationTd);
            tbody.appendChild(tr);
        });

        // Display synthesized response themes (assuming data.themes array)
        const synthDiv = document.getElementById('synthesized-response');
        if (data.themes && data.themes.length > 0) {
            synthDiv.innerHTML = '<ul>' + data.themes.map(theme => `<li>${theme}</li>`).join('') + '</ul>';
        } else {
            synthDiv.textContent = data.answer;
        }

        // Switch to Results tab to show answers
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
        document.querySelector('.tab-button[data-tab="results"]').classList.add('active');
        document.getElementById('results').style.display = 'block';

    } else {
        const errorData = await response.json();
        alert("Query failed: " + (errorData.detail || errorData.error));
    }
});
