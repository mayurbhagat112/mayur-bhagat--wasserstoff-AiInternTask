from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "")
    
    # TODO: Implement actual chat logic with backend
    # This is a mock response for demonstration
    response = {
        "response": "This is a sample response with a citation [DOC001 – p.4¶2].",
        "citations": [
            {
                "docId": "DOC001",
                "page": 4,
                "paragraph": 2
            }
        ],
        "themes": [
            {
                "title": "Sample Theme",
                "description": "This is a sample theme extracted from the documents."
            }
        ],
        "documentResults": [
            {
                "docId": "DOC001",
                "snippet": "This is a sample snippet from the document.",
                "page": 4,
                "paragraph": 2
            }
        ]
    }
    
    return jsonify(response)

@app.route("/api/documents", methods=["GET"])
def get_documents():
    # TODO: Implement actual document fetching logic
    # This is a mock response for demonstration
    documents = [
        {
            "id": "DOC001",
            "title": "Sample Document 1",
            "date": "2024-03-20",
            "type": "PDF"
        },
        {
            "id": "DOC002",
            "title": "Sample Document 2",
            "date": "2024-03-21",
            "type": "PDF"
        }
    ]
    
    return jsonify(documents)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
