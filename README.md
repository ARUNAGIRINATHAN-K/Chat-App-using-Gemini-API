# Gemini Chatbot


A simple web-based chat application powered by the Google Gemini API, built using HTML, CSS, and JavaScript. This app allows users to send messages and receive responses from the Gemini 1.5 Flash model, featuring a clean, responsive UI.

## Features

- Real-time chat interface with user and bot message display
- Responsive design for desktop and mobile devices
- Auto-scrolling chat container
- Basic error handling for API requests
- Minimalist styling with Poppins font and gradient accents

## Folder Structure
```
gemini-chatbot/
├── index.html       
├── style.css        
├── script.js        
```

## Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge)
- A Google Gemini API key from Google AI Studio


## Add Your API Key:

Open script.js and replace YOUR_GEMINI_API_KEY with your actual Gemini API key from Google AI Studio.
Warning: Storing the API key client-side is insecure for production. For deployment, use a server-side solution to handle API requests.


## Run the App:

Open index.html in a web browser to start the chat app.
Alternatively, use a local development server (e.g., live-server or Python's http.server):python -m http.server 8000

Then navigate to http://localhost:8000 in your browser.

## Usage

Type a message in the input field at the bottom of the page.
Press the "Send" button or hit Enter to send the message.
The Gemini API will respond, and the conversation will appear in the chat container.
Messages are styled differently for user (blue) and bot (gray) for clarity.

The Gemini API has usage limits; check Google AI Studio documentation for details.
For production, secure the API key using a backend server (e.g., Node.js, Firebase) to prevent exposure.
The app is a prototype and can be enhanced with features like chat history persistence, theme toggling, or multimodal input support (e.g., images).

## Potential Enhancements

Add dark/light theme toggle with local storage
Persist chat history using local storage or a database
Support file uploads for Gemini's multimodal capabilities
Add a typing indicator or copy-to-clipboard feature for messages

## Dependencies

Google Fonts (Poppins) (loaded via CDN)
Google Gemini API (accessed via HTTP requests)

License
This project is licensed under the MIT License. See the LICENSE file for details.
Acknowledgments

Built with the Google Gemini API
Inspired by web development tutorials like CodingNepal
