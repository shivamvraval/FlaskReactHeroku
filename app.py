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



app = Flask(__name__, static_url_path='', static_folder='my-app/build')
CORS(app)

# Serve home route
@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


@app.route('/api', methods=['GET'])
@cross_origin()
def index():
    return {
        "tutorial": "Flask React Heroku"
    }

# Performs selected dimensionality reduction method (reductionMethod) on uploaded data (data), considering selected parameters (perplexity, selectedCol)
@app.route("/upload-data", methods=["POST"])
def data():
    parser = reqparse.RequestParser()
    parser.add_argument('data', type=str)
    parser.add_argument('reductionMethod', type=str)
    parser.add_argument('perplexity', type=int)
    parser.add_argument('selectedCol', type=str)

    args = parser.parse_args()

    data = args['data']
    reductionMethod = args['reductionMethod']
    selectedCol = args['selectedCol']

    #df has text as metadata and other features
    df = pd.read_csv(io.StringIO(data),sep=",", header=0)

    # extracting column with color information from df
    if selectedCol != "none":
        colorByCol = df.loc[:,selectedCol]
        df = df.drop(selectedCol, axis=1)

    # Check reduction method
    if reductionMethod == "TSNE":
        perplexity = args['perplexity']
        #This performs dimensionality reduction, for now fixed perplexity but could be changed later
        X_embedded = TSNE(n_components=2, perplexity=perplexity, verbose=True).fit_transform(df.drop(columns = ['text']).values)
    else:
         X_embedded = umap.UMAP(n_components=2).fit_transform(df.drop(columns = 'text').values)

    #Converting the x,y,labels,color into dataframe again
    df_dr = pd.DataFrame(X_embedded,columns=['x', 'y'])
    df_dr['label'] = df['text']
    if selectedCol != "none":
        df_dr['color'] = colorByCol

    return df_dr.to_json(orient="split")

# Returns most 30 most positively and negatively associated words with being in a selected area using a linear classifier
# Input schema: 
#   [
#       [label, categorization] # 1 if in selected area, 0 if not
#   ]
@app.route("/categorize-data", methods=["POST"])
def categorize():

    parser = reqparse.RequestParser()
    parser.add_argument('data', type=str)
    parser.add_argument('selectedLabels', type=str)
    args = parser.parse_args()
    categorizedPoints = args['data']
    selected_labels = args['selectedLabels']

    #print(selected_labels)
    '''gpt_prompt = selected_labels[2:3800]
    response = openai.Completion.create(
    engine="text-davinci-002",
    prompt=gpt_prompt,
    temperature=0.5,
    max_tokens=256,
    top_p=1.0,
    frequency_penalty=0.0,
    presence_penalty=0.0
    )


    print(response['choices'][0]['text'])'''

    df = pd.DataFrame(literal_eval(categorizedPoints), columns = ['0','1'])

    #Make a list of all possible words in the text, currently capped at 100,000
    vectorizer = CountVectorizer(max_features=100000,token_pattern=r"(?u)\b\w\w+\b|!|\?|\"|\'")
    BOW = vectorizer.fit_transform(df['0'])

    #Fit a linear Classifier
    x_train,x_test,y_train,y_test = train_test_split(BOW,np.asarray(df['1']))
    model = SVC(kernel='linear')
    model.fit(x_train,y_train)
    coeffs = model.coef_.toarray()

    #Find ids for pos and negative coeffs
    id_pos = coeffs[0]>0
    id_neg = coeffs[0]<0

    #We're just taking 30 largest values
    n_pos = heapq.nlargest(30, range(len(coeffs[0][id_pos])), coeffs[0][id_pos].take)
    n_neg = heapq.nsmallest(30, range(len(coeffs[0][id_neg])), coeffs[0][id_neg].take)


    pos_tokens = vectorizer.get_feature_names_out()[id_pos][n_pos]
    pos_token_coeffs = coeffs[0][id_pos][n_pos]


    neg_tokens = vectorizer.get_feature_names_out()[id_neg][n_neg]
    neg_token_coeffs = coeffs[0][id_neg][n_neg]

    df_coefs = pd.DataFrame(list(zip(pos_tokens,pos_token_coeffs,neg_tokens,neg_token_coeffs)),
                            columns = ['pos_tokens', 'pos_coefs','neg_tokens','neg_coefs'])


    print(df_coefs)

    return df_coefs.to_json(orient="split"), "Hey"#response['choices'][0]['text']



# Populate center panel with default projection
@app.route("/get-default-data", methods=["GET"])
def defaultData():
    data = json.load(open("./datasets/hp_embedding.json"))
    return data




# Run app in debug mode
if __name__ == "__main__":
    app.run()