const { ipcRenderer } = require('electron')

// renderer
window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    ipcRenderer.send('show-context-menu')
})

ipcRenderer.on('context-menu-command', (e, command) => {
    // ...
})

//// CHATTY CHAT CHAT STUFF!!!!
function appendMessage(sender, message, isMarkdown) {
    const chatContainer = document.getElementById('bot-message')
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message')
    // Optionally set z-index here if necessary
    messageDiv.style.position = 'relative';

    if (sender === 'User') {
        const userContentContainer = document.createElement('div')
        userContentContainer.classList.add('user-content-container')
        const userIcon = document.createElement('div')
        userIcon.classList.add('user-icon')
        userIcon.style.marginTop = '10px'

        const userBubble = document.createElement('div')
        userBubble.classList.add('user-bubble')
        userBubble.innerHTML = `<strong>${message}</strong>`

        userContentContainer.appendChild(userIcon)
        userContentContainer.appendChild(userBubble)
        messageDiv.appendChild(userContentContainer)
    } else if (sender === 'Bot') {
        const botIcon = document.createElement('div')
        botIcon.classList.add('bot-icon')
        botIcon.style.marginTop = '10px'

        const botContentContainer = document.createElement('div')
        botContentContainer.classList.add('bot-content-container')
        botContentContainer.appendChild(botIcon)

        const botBubble = document.createElement('div')
        botBubble.classList.add('bot-bubble')
        if (isMarkdown) {
            botBubble.innerHTML = marked(message)
        } else {
            botBubble.innerText = message
        }

        const ttsButton = document.createElement('button')
        ttsButton.classList.add('tts-button')
        ttsButton.style.position = 'relative';
        ttsButton.style.zIndex = '1000'; // Set sufficiently high within context

        const speakerIcon = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
        );
        speakerIcon.setAttribute('class', 'tts-icon');
        speakerIcon.setAttribute('viewBox', '0 0 24 24');
        speakerIcon.style.width = '16px';
        speakerIcon.style.height = '16px';
        speakerIcon.style.stroke = 'currentColor';
        speakerIcon.style.strokeWidth = '1.5';
        speakerIcon.style.strokeLinecap = 'round';
        speakerIcon.style.strokeLinejoin = 'round';
        speakerIcon.style.marginLeft = '-18px';  
        speakerIcon.style.marginTop = '-10px';    // Moves the icon 3 pixels up
        speakerIcon.innerHTML = `<path d="M19 6C20.5 7.5 21 10 21 12C21 14 20.5 16.5 19 18M16 8.99998C16.5 9.49998 17 10.5 17 12C17 13.5 16.5 14.5 16 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z" fill="none" stroke="#424242" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`;

        ttsButton.appendChild(speakerIcon);

        function showSpinner() {
            // Change to spinner
            speakerIcon.innerHTML = `<svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>`;
            speakerIcon.style.width = '16px'; // Adjust size for spinner if needed
            speakerIcon.style.height = '16px';
        };
            // Call the sendMessage function with a callback to reset the icon
        function showErrorIcon() {
                // Reset back to speaker icon
                speakerIcon.innerHTML = `<path d="M19 6C20.5 7.5 21 10 21 12C21 14 20.5 16.5 19 18M16 8.99998C16.5 9.49998 17 10.5 17 12C17 13.5 16.5 14.5 16 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z" fill="none" stroke="#424242" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`;
                speakerIcon.style.width = '16px'; // Reset size for speaker icon
                speakerIcon.style.height = '16px';
        };
        
        ttsButton.onclick = () => {
            // Change to spinner or other "processing" indicator
            showSpinner();
        
            // Start the TTS request
            sendMessageToMainForTTS(message, resetSpeakerIcon, handleTtsError);
        };
        
        function resetSpeakerIcon() {
            // Reset the speaker icon
            speakerIcon.innerHTML = `<path ...></path>`;
            // Additional UI reset logic if necessary
        }
        
        function handleTtsError(error) {
            // Update the UI to reflect the error state
            console.error('Error during TTS:', error);
            showErrorIcon();  // Function to change the icon or display an error message
        }

        botContentContainer.appendChild(botBubble);
        botContentContainer.appendChild(ttsButton);
        messageDiv.appendChild(botContentContainer);
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}



function sendMessageToMainForTTS(message, onComplete, onError) {
    console.log('TTS Requested for:', message);

    // Check if the message contains "Result:" and extract the relevant part
    const resultKeyword = "Result:";
    let ttsMessage = message;
    if (message.includes(resultKeyword)) {
        const startIndex = message.indexOf(resultKeyword) + resultKeyword.length;
        ttsMessage = message.substring(startIndex).trim();
    }

    // Send the processed message to the TTS engine
    ipcRenderer.send('request-tts', ttsMessage);

    // Handle successful completion of the TTS process
    ipcRenderer.once('tts-done', () => {
        console.log('TTS completed successfully.');
        onComplete();  // Reset the icon or perform other UI updates
    });

    // Handle errors from the TTS process
    ipcRenderer.once('tts-error', (event, error) => {
        console.error('TTS encountered an error:', error);
        onError(error);  // Perform error handling UI updates
    });
}


function showTypingIndicator() {
    const chatContainer = document.getElementById('chat-container')

    // Display "Bot is typing..."
    setTimeout(() => {
        hideTypingIndicator() // Remove any existing typing indicator

        const typingIndicatorDiv = document.createElement('div')
        typingIndicatorDiv.className = 'typing-indicator'

        // Create three spans for each dot in the ellipsis
        typingIndicatorDiv.innerHTML =
            '<em> Dot is typing <span>.</span><span>.</span><span>.</span> </em>'

        // Append the typing indicator at the end of the chat container
        chatContainer.appendChild(typingIndicatorDiv)

        // Scroll to the bottom after adding the typing indicator
        chatContainer.scrollTop = chatContainer.scrollHeight
    }, 0) // Adjust the delay time as needed
}

function hideTypingIndicator() {
    const chatContainer = document.getElementById('chat-container')
    const typingIndicator = chatContainer.querySelector('.typing-indicator')

    if (typingIndicator) {
        chatContainer.removeChild(typingIndicator)
    }

    chatContainer.scrollTop = chatContainer.scrollHeight
}

const { marked } = require('marked')

ipcRenderer.on('python-reply', (event, reply) => {
    const chatContainer = document.getElementById('chat-container')

    try {
        const resultObject = JSON.parse(reply)
        const resultChunks = resultObject.result

        hideTypingIndicator() // Remove typing indicator

        // Join the chunks back together
        const resultMessageMarkdown = resultChunks.join('')

        // Append the joined Markdown content to bot-content-container
        appendMessage('Bot', resultMessageMarkdown.trim(), true)

        chatContainer.scrollTop = chatContainer.scrollHeight
    } catch (error) {
        console.error('Error parsing JSON:', error)
    }
})

function sendMessage(buttonClicked) {
    const userInput = document.getElementById('user-input').value

    if (userInput.trim() !== '') {
        appendMessage('User', userInput)

        // Show typing indicator before sending the message to Python script
        showTypingIndicator()

        // Sending an object with userInput and buttonClicked properties
        ipcRenderer.send('run-python-script', { userInput, buttonClicked })

        document.getElementById('user-input').value = '' // Clear input after sending
    }
}

// ENTER == SEND

var input = document.getElementById('user-input')
input.addEventListener('keyup', function (event) {
    if (event.keyCode === 13) {
        event.preventDefault()
        document.getElementById('send-button').click()
    }
})

//WHISPER


// SIDEBAR AND FILE TREE!!!!

const { dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const $ = require('jquery') // Make sure to import jQuery
const defaultDirectory = './src/mystuff'

const $fileTree = $('#fileTree')
const $loadingSpinner = $('#loadingSpinner')

$(document).ready(() => {
    // Define a path for the file where you will store the last opened directory
    const { ipcRenderer } = require('electron')
    const userDataPath = ipcRenderer.sendSync('get-user-data-path') // You'll need to implement this in your main process
    const lastOpenedDirPath = path.join(userDataPath, 'lastOpenedDir.txt')
    const $fileTree = $('#fileTree')

    function truncateText(textContainer, maxWidth) {
        const text = textContainer.text()
        const originalText = textContainer.data('original-text')

        if (!originalText) {
            textContainer.data('original-text', text)
        }

        const isTruncated = textContainer[0].scrollWidth > maxWidth

        if (isTruncated) {
            const truncatedText = originalText.slice(0, -1)
            textContainer.text(truncatedText)
        } else {
            textContainer.text(originalText)
        }

        return isTruncated
    }

    function populateTree(rootPath, parentElement) {
        fs.promises
            .readdir(rootPath)
            .then((files) => {
                const ul = $('<ul>').css('list-style-type', 'none')

                files.forEach((file) => {
                    // Skip .DS_Store files
                    if (file === '.DS_Store') {
                        return
                    }
                    const fullPath = path.join(rootPath, file)
                    const li = $('<li>')
                        .addClass('folder flex flex-col mb-2')
                        .css({
                            'list-style-type': 'none',
                            'padding-left': '20px',
                        })
                    const shit = $('<div>').addClass(
                        'folder flex flex-row items-center'
                    ) // Changed from div to li
                    const icon = $('<div>') // Container for the icon
                    const arrow = $('<div>') // Container for the arrow
                    const textContainer = $('<div>').addClass(
                        'text-container mx-1 text-gray-500 file-name'
                    ) // Container for text

                    // Append li to shit
                    li.append(shit)
                    // Append items to li
                    shit.append(arrow, icon, textContainer)
                    // Append li to ul
                    ul.append(li)

                    fs.promises
                        .stat(fullPath)
                        .then((stats) => {
                            if (stats.isDirectory()) {
                                li.addClass(
                                    'folder rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition align-center'
                                )
                                // SVG for arrow icon
                                arrow
                                    .html(
                                        `<svg class="w-3 h-3 text-black dark:text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 13 5.7-5.326a.909.909 0 0 0 0-1.348L1 1"/>
                                    </svg>`
                                    )
                                    .addClass(
                                        'inline-block transition mr-1 rotate-0'
                                    ) // Added rotate-0 class
                                    .click(() => {
                                        if (!subUl.children().length) {
                                            populateTree(fullPath, subUl)
                                        }
                                        subUl.slideToggle()

                                        // Toggle the rotate class
                                        arrow.toggleClass('rotate-90')
                                    })

                                // Create a nested ul for subdirectories
                                const subUl = $('<ul>')
                                    .css({
                                        'list-style-type': 'none',
                                        'padding-left': '20px',
                                    })
                                    .hide()
                                li.append(subUl) // Append nested ul to li

                                // Text
                                // Text for folders
                                textContainer.text(file)
                                const isTruncated = truncateText(
                                    textContainer,
                                    textContainer.width()
                                )
                                if (isTruncated) {
                                    textContainer.attr('title', file)
                                } else {
                                    textContainer.removeAttr('title')
                                }
                            } else if (stats.isFile()) {
                                li.addClass(
                                    'file flex flex-row hover:bg-gray-200 dark:hover:bg-slate-700 transition '
                                )

                                // SVG for document icon
                                icon.html(
                                    `<svg class="w-3 h-3 text-gray-800 dark:text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 20">
                                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M6 1v4a1 1 0 0 1-1 1H1m14-4v16a.97.97 0 0 1-.933 1H1.933A.97.97 0 0 1 1 18V5.828a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 1 5.828 1h8.239A.97.97 0 0 1 15 2Z"/>
                                  </svg>`
                                ).addClass('icon  inline-block ml-1')

                                // Text for files
                                // Text for folders
                                textContainer.text(file)
                                const isTruncated = truncateText(
                                    textContainer,
                                    textContainer.width()
                                )
                                if (isTruncated) {
                                    textContainer.attr('title', file)
                                } else {
                                    textContainer.removeAttr('title')
                                }
                            }
                        })
                        .catch((err) => {
                            console.error(err)
                        })
                })

                parentElement.append(ul)
            })
            .catch((err) => {
                console.error(err)
            })
    }

    async function executePythonScript(directory) {
        $loadingSpinner.show()

        try {
            // Invoke IPC event to execute the Python script
            const result = await ipcRenderer.invoke(
                'execute-python-script',
                directory
            )

            // Process the result if needed

            // Update the file tree
            $fileTree.empty()
            await populateTree(directory, $fileTree)
        } catch (err) {
            console.error(err)
        } finally {
            $loadingSpinner.hide()
            //RESETTING SCRIPT
            const selectedScript = scriptToggle.checked
                ? 'bigdot.py'
                : 'docdot.py'
            ipcRenderer.send('switch-script', selectedScript)
            ipcRenderer.send('switch-script', selectedScript)
        }
    }

    try {
        // Check if the lastOpenedDir.txt file exists
        if (fs.existsSync(lastOpenedDirPath)) {
            const lastOpenedDir = fs.readFileSync(lastOpenedDirPath, 'utf8')

            // If the directory exists, display its file tree
            if (fs.existsSync(lastOpenedDir)) {
                $fileTree.empty()
                populateTree(lastOpenedDir, $fileTree)
            }
        }
    } catch (err) {
        console.error('Error loading the last opened directory:', err)
    }

    function selectDirectory() {
        ipcRenderer
            .invoke('open-dialog')
            .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                    const selectedDirectory = result.filePaths[0]

                    document.getElementById('fileTree').innerHTML = ''
                    // Show the loading animation after the directory has been selected

                    document.getElementById('loadingAnimation').style.display =
                        'block'

                    // Now call the function to process the directory
                    executePythonScript(selectedDirectory)
                        .then(() => {
                            // Hide the loading animation after the folder is loaded and displayed
                            document.getElementById(
                                'loadingAnimation'
                            ).style.display = 'none'
                        })
                        .catch((err) => {
                            // Hide the loading animation also in case of error
                            document.getElementById(
                                'loadingAnimation'
                            ).style.display = 'none'
                            console.error(err)
                        })
                }
            })
            .catch((err) => {
                console.error(err)
            })
    }

    $('#selectDirectoryButton').click(selectDirectory)
})

// GALLERY VIEW!!!!
ipcRenderer.on('update-background', (event, imagePath) => {
    // Update the background of the chat-container div with the selected image
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
        chatContainer.style.backgroundImage = `url('file://${imagePath}')`
    }
})

// BIG DOT TOGGLE!!!!!

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded')

    const scriptToggle = document.getElementById('scriptToggle')

    if (scriptToggle) {
        console.log('scriptToggle found:', scriptToggle)

        scriptToggle.addEventListener('change', function () {
            console.log('Script toggle changed')

            const selectedScript = scriptToggle.checked
                ? 'bigdot.py'
                : 'docdot.py'
            console.log('Selected script:', selectedScript)

            ipcRenderer.send('switch-script', selectedScript)
        })
    } else {
        console.error('Element with ID "scriptToggle" not found.')
    }

    console.log('Renderer Process Loaded')
    ipcRenderer.send('start-download', 'Initiate Download')

    ipcRenderer.on('download-progress', (event, progress) => {
        console.log('Download Progress:', progress)
    })

    ipcRenderer.on('download-complete', () => {
        console.log('Download Complete')
    })

    ipcRenderer.on('download-error', (error) => {
        console.error('Download Error:', error)
    })
})

document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('dropdown')
    const optionsMenu = document.getElementById('options-menu')

    if (
        !dropdown.contains(event.target) &&
        !optionsMenu.contains(event.target)
    ) {
        // Click is outside of the dropdown and the options menu button
        dropdown.classList.add('hidden')
    }
})

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown')
    dropdown.classList.toggle('hidden')
}

function selectOption(option) {
    document.getElementById('selected-option').textContent = option
    const selectedScript = option === 'Doc Dot' ? 'docdot.py' : 'bigdot.py'
    ipcRenderer.send('switch-script', selectedScript)
    document.getElementById('dropdown').classList.add('hidden')
}

// Add event listener to the button
document.getElementById('toggleDarkMode').addEventListener('click', () => {
    // Send message to main process to toggle dark mode
    ipcRenderer.send('toggle-dark-mode')
})

// Listen for message from main process indicating the new dark mode state
ipcRenderer.on('dark-mode-toggled', (event, isEnabled) => {
    // Apply or remove 'dark' class based on the new state
    document.documentElement.classList.toggle('dark', isEnabled)
})

// JavaScript code
document.getElementById('toggleDarkMode').addEventListener('click', () => {
    const iconMoon = document.getElementById('iconMoon')
    const iconSun = document.getElementById('iconSun')
    const isDarkMode = document.documentElement.classList.toggle('dark')

    // Toggle between moon and sun icons
    iconMoon.classList.toggle('hidden', isDarkMode)
    iconSun.classList.toggle('hidden', !isDarkMode)
})

let progressMessageExists = false // This will track if the progress message is already displayed

function appendMessageAuto(sender, message, isMarkdown) {
    const chatContainer = document.getElementById('bot-message') // Ensure this is the correct container

    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message')

    if (sender === 'User') {
        const userContentContainer = document.createElement('div')
        userContentContainer.classList.add('user-content-container')

        const userIcon = document.createElement('div')
        userIcon.classList.add('user-icon')
        userIcon.style.marginTop = '10px'

        const userBubble = document.createElement('div')
        userBubble.classList.add('user-bubble')
        userBubble.innerHTML = `<strong>${message}</strong>`

        userContentContainer.appendChild(userIcon)
        userContentContainer.appendChild(userBubble)
        messageDiv.appendChild(userContentContainer)
    } else if (sender === 'Bot') {
        const botIcon = document.createElement('div')
        botIcon.classList.add('bot-icon')
        botIcon.style.marginTop = '10px'

        const botContentContainer = document.createElement('div')
        botContentContainer.classList.add('bot-content-container')
        botContentContainer.appendChild(botIcon)

        const botBubble = document.createElement('div')
        botBubble.classList.add('bot-bubble')

        if (isMarkdown) {
            botBubble.innerHTML = marked(message)
        } else {
            // Directly set innerHTML for HTML content
            botBubble.innerHTML = message
        }

        botContentContainer.appendChild(botBubble)
        messageDiv.appendChild(botContentContainer)
    }

    chatContainer.appendChild(messageDiv)
    chatContainer.scrollTop = chatContainer.scrollHeight
}

function showDownloadProgress(progress) {
    const chatContainer = document.getElementById('chat-container')
    let progressMessage = chatContainer.querySelector('.download-progress')

    if (!progressMessage) {
        let progressHTML = `
        <div class="intro-message">
            <h1>Hello!</h1>
            <p>Welcome to Dot. Before you can get started, the Mistral 7B Large Language Model must be installed. This process should only take a few minutes, depending on your connection speed. Please wait while the necessary files are downloaded and set up for your use.</p>
        </div>
    
        <div class="download-progress">
            <div>Downloading LLM...</div>
            <div class="progress-bar">
                <span class="progress-bar-text">0%</span>
            </div>
        </div>
        `
        appendMessageAuto('Bot', progressHTML, false)
    }

    const progressBar = document.querySelector('.progress-bar')
    const progressBarText = document.querySelector('.progress-bar-text')
    if (progressBar && progressBarText) {
        progressBar.style.width = `${progress}%`
        progressBarText.innerText = `${progress}%` // Update text to reflect current progress

        // Check if the progress is 100% and update the text accordingly
        if (progress >= 100) {
            progressBarText.innerText = 'Complete!'
            progressBar.style.backgroundColor = '#4CAF50' // Optional: change color to indicate completion
        }
    }
}

function removeDownloadProgress() {
    const chatContainer = document.getElementById('chat-container')
    const progressMessage = chatContainer.querySelector('.download-progress')

    if (progressMessage) {
        // Optionally fade out or just leave the message as-is
        // const messageDiv = progressMessage.closest('.message');
        // chatContainer.removeChild(messageDiv);
        // Or you can leave it to display the complete status
    }
    chatContainer.scrollTop = chatContainer.scrollHeight
}

ipcRenderer.on('download-progress', (event, progress) => {
    console.log('Download Progress:', progress)
    showDownloadProgress(progress)
})

ipcRenderer.on('download-complete', () => {
    console.log('Download Complete') // Check if this log appears in the console
    removeDownloadProgress()
    appendMessage('Bot', 'Download completed successfully.', false)
})

ipcRenderer.on('download-error', (event, error) => {
    console.log('Download Error:', error)
    removeDownloadProgress()
    appendMessage('Bot', `Download failed: ${error}`, false)
})
