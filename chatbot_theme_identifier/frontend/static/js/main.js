document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const documentItems = document.querySelector('.document-items');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const uploadProgressModal = new bootstrap.Modal(document.getElementById('uploadProgressModal'));
    const progressBar = document.querySelector('.progress-bar');
    const uploadStatus = document.getElementById('uploadStatus');
    const toggleUploadBtn = document.getElementById('toggleUpload');
    const closeUploadBtn = document.getElementById('closeUpload');
    const uploadOptions = document.getElementById('uploadOptions');
    const uploadOptionButtons = document.querySelectorAll('.upload-option');

    // Handle document upload section toggle
    toggleUploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle the upload options menu
        const isVisible = uploadOptions.style.display === 'block';
        uploadOptions.style.display = isVisible ? 'none' : 'block';
        toggleUploadBtn.classList.toggle('active');
        
        // Hide the drop zone if it's visible
        if (isVisible) {
            dropZone.style.display = 'none';
        }
    });

    // Handle upload option clicks
    uploadOptionButtons.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const type = option.getAttribute('data-type');
            uploadOptions.style.display = 'none';
            toggleUploadBtn.classList.remove('active');
            
            // Show the upload panel
            dropZone.style.display = 'block';
            
            // Update file input accept attribute based on type
            switch(type) {
                case 'document':
                    fileInput.accept = '.doc,.docx';
                    break;
                case 'pdf':
                    fileInput.accept = '.pdf';
                    break;
                case 'text':
                    fileInput.accept = '.txt';
                    break;
                default:
                    fileInput.accept = '.pdf,.doc,.docx,.txt';
            }
        });
    });

    closeUploadBtn.addEventListener('click', () => {
        dropZone.style.display = 'none';
    });

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!uploadOptions.contains(e.target) && !toggleUploadBtn.contains(e.target)) {
            uploadOptions.style.display = 'none';
            toggleUploadBtn.classList.remove('active');
        }
        if (!dropZone.contains(e.target) && !toggleUploadBtn.contains(e.target)) {
            dropZone.style.display = 'none';
        }
    });

    // Handle file drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file input change
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Handle file upload
    function handleFiles(files) {
        const formData = new FormData();
        let validFiles = 0;

        Array.from(files).forEach(file => {
            if (isValidFileType(file)) {
                formData.append('files[]', file);
                validFiles++;
            }
        });

        if (validFiles > 0) {
            uploadFiles(formData);
        } else {
            showError('Please upload only PDF, DOC, DOCX, or TXT files.');
        }
    }

    function isValidFileType(file) {
        const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
        return validTypes.some(type => file.name.toLowerCase().endsWith(type));
    }

    async function uploadFiles(formData) {
        uploadProgressModal.show();
        progressBar.style.width = '0%';
        uploadStatus.textContent = 'Preparing upload...';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progressBar.style.width = percentCompleted + '%';
                    uploadStatus.textContent = `Uploading... ${percentCompleted}%`;
                }
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            updateDocumentList(data.documents);
            uploadStatus.textContent = 'Upload complete!';
            setTimeout(() => {
                uploadProgressModal.hide();
            }, 1000);
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = 'Upload failed. Please try again.';
            setTimeout(() => {
                uploadProgressModal.hide();
            }, 2000);
        }
    }

    function updateDocumentList(documents) {
        if (documents.length === 0) {
            documentItems.innerHTML = `
                <div class="empty-state text-center py-4">
                    <i class="fas fa-file-alt text-muted mb-3" style="font-size: 2rem;"></i>
                    <p class="text-muted">No documents uploaded yet</p>
                </div>
            `;
            return;
        }

        documentItems.innerHTML = documents.map(doc => `
            <div class="document-item" data-id="${doc.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${doc.title}</h5>
                        <small class="text-muted">${doc.type} • ${doc.date}</small>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="" id="doc-${doc.id}">
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Handle tab switching with smooth transitions
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active states with animation
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.transition = 'all 0.3s ease';
            });
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.transition = 'all 0.3s ease';
            });
            
            button.classList.add('active');
            const activePane = document.getElementById(tabId);
            activePane.classList.add('active');
            
            // Smooth scroll to top of content
            activePane.scrollTop = 0;
        });
    });

    // Handle chat form submission with loading state
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        
        if (message) {
            // Disable input and show loading state
            userInput.disabled = true;
            const submitButton = chatForm.querySelector('button');
            const originalButtonContent = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // Add user message to chat
            addMessage(message, 'user');
            userInput.value = '';

            try {
                // Send message to backend
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                
                // Add bot response to chat with typing animation
                await typeMessage(data.response, 'bot', data.citations);
                
                // Update results panel with smooth transitions
                updateResults(data);
            } catch (error) {
                console.error('Error:', error);
                addMessage('Sorry, there was an error processing your request. Please try again.', 'bot');
            } finally {
                // Re-enable input and restore button
                userInput.disabled = false;
                submitButton.innerHTML = originalButtonContent;
                userInput.focus();
            }
        }
    });

    // Function to add messages to chat with animation
    function addMessage(text, sender, citations = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        // Process text with citations
        let processedText = text;
        if (citations && citations.length > 0) {
            citations.forEach(citation => {
                const citationText = `[${citation.docId} – p.${citation.page}¶${citation.paragraph}]`;
                processedText = processedText.replace(
                    citationText,
                    `<span class="citation" data-citation='${JSON.stringify(citation)}'>${citationText}</span>`
                );
            });
        }
        
        messageDiv.innerHTML = processedText;
        chatMessages.appendChild(messageDiv);
        
        // Animate message appearance
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
        
        // Scroll to bottom smoothly
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Function to simulate typing animation
    async function typeMessage(text, sender, citations = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.style.opacity = '0';
        chatMessages.appendChild(messageDiv);

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });

        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove typing indicator
        typingIndicator.remove();

        // Process text with citations
        let processedText = text;
        if (citations && citations.length > 0) {
            citations.forEach(citation => {
                const citationText = `[${citation.docId} – p.${citation.page}¶${citation.paragraph}]`;
                processedText = processedText.replace(
                    citationText,
                    `<span class="citation" data-citation='${JSON.stringify(citation)}'>${citationText}</span>`
                );
            });
        }

        // Type out the message
        messageDiv.innerHTML = '';
        messageDiv.style.opacity = '1';
        
        const words = processedText.split(' ');
        for (let i = 0; i < words.length; i++) {
            messageDiv.innerHTML += words[i] + ' ';
            await new Promise(resolve => setTimeout(resolve, 50));
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    // Function to update results panel with animations
    function updateResults(data) {
        // Update themes tab
        const themesPane = document.getElementById('themes');
        if (data.themes) {
            themesPane.innerHTML = data.themes.map(theme => `
                <div class="theme-item" style="opacity: 0; transform: translateY(20px);">
                    <h4>${theme.title}</h4>
                    <p>${theme.description}</p>
                </div>
            `).join('');

            // Animate theme items
            const themeItems = themesPane.querySelectorAll('.theme-item');
            themeItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }

        // Update documents tab
        const documentsPane = document.getElementById('documents');
        if (data.documentResults) {
            documentsPane.innerHTML = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Document ID</th>
                                <th>Snippet</th>
                                <th>Citation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.documentResults.map(result => `
                                <tr style="opacity: 0; transform: translateY(20px);">
                                    <td>${result.docId}</td>
                                    <td>${result.snippet}</td>
                                    <td>[${result.docId} – p.${result.page}¶${result.paragraph}]</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Animate table rows
            const tableRows = documentsPane.querySelectorAll('tbody tr');
            tableRows.forEach((row, index) => {
                setTimeout(() => {
                    row.style.transition = 'all 0.3s ease';
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }
    }

    // Handle citation clicks with smooth transitions
    chatMessages.addEventListener('click', (e) => {
        if (e.target.classList.contains('citation')) {
            const citation = JSON.parse(e.target.getAttribute('data-citation'));
            
            // Switch to documents tab
            document.querySelector('[data-tab="documents"]').click();
            
            // Highlight the relevant document
            const documentItem = document.querySelector(`.document-item[data-id="${citation.docId}"]`);
            if (documentItem) {
                documentItem.style.transition = 'all 0.3s ease';
                documentItem.style.backgroundColor = 'rgba(16, 163, 127, 0.1)';
                documentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Remove highlight after delay
                setTimeout(() => {
                    documentItem.style.backgroundColor = '';
                }, 2000);
            }
        }
    });

    // Enhanced document search functionality
    const documentSearch = document.querySelector('.document-filters input');
    let searchTimeout;
    
    documentSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.toLowerCase();
        
        searchTimeout = setTimeout(() => {
            const items = document.querySelectorAll('.document-item');
            let hasResults = false;
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isVisible = text.includes(searchTerm);
                item.style.display = isVisible ? 'block' : 'none';
                if (isVisible) hasResults = true;
            });
            
            // Show no results message if needed
            let noResultsMsg = document.querySelector('.no-results-message');
            if (!hasResults && !noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'alert alert-info no-results-message';
                noResultsMsg.innerHTML = '<i class="fas fa-info-circle me-2"></i>No documents found matching your search.';
                documentItems.appendChild(noResultsMsg);
            } else if (hasResults && noResultsMsg) {
                noResultsMsg.remove();
            }
        }, 300);
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus chat input with Ctrl + /
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            userInput.focus();
        }
        
        // Submit chat with Enter (if not pressing Shift)
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement === userInput) {
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('.document-list').insertBefore(errorDiv, document.querySelector('.document-filters'));
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}); 