from flask import Flask
from flask.helpers import send_from_directory
from flask_cors import CORS, cross_origin
from multiprocessing import reduction
from flask import Flask, send_from_directory, url_for, json
from flask_cors import CORS #comment this on deployment
from flask_restful import reqparse
import pandas as pd
import io
from sklearn.manifold import TSNE
import umap
from ast import literal_eval
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.svm import SVC
import numpy as np
import heapq

import openai

app = Flask(__name__, static_folder='my-app/build', static_url_path='')
CORS(app)

@app.route('/api', methods=['GET'])
@cross_origin()
def index():
    return {
        "tutorial": "Flask React Heroku"
    }

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run()