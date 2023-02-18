from flask.helpers import send_from_directory
#from multiprocessing import reduction
from flask import Flask, url_for, json
from flask_cors import CORS,cross_origin #comment this on deployment
'''import pandas as pd
import io
from sklearn.manifold import TSNE
import umap
from ast import literal_eval
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.svm import SVC
import numpy as np
import heapq

import openai'''

app = Flask(__name__, static_folder='my-app/build', static_url_path='')
CORS(app)

@app.route('/api', methods=['GET'])
@cross_origin()
def index():
    return {
        "tutorial": "Flask React Heroku blah"
    }

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run()




    