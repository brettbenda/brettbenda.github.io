import json
import csv
import os

filenames = os.listdir("./Photography")

filejson = {}
filejson.update({"images":filenames})

with open('pic.json', 'w') as json_file:
  json.dump(filejson, json_file)