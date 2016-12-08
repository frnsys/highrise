import json
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/save', methods=['POST'])
def save():
    data = request.get_json()
    with open('data.json', 'w') as f:
        json.dump(data, f)
    return jsonify(success=True)


@app.route('/load', methods=['GET'])
def load():
    with open('data.json', 'w') as f:
        data = json.load(f)
    return jsonify(data=data)


if __name__ == '__main__':
    app.run(debug=True, port=8888)