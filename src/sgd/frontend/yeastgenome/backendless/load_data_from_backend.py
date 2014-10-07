__author__ = 'kpaskov'
from config import to_load, backend_url
import os
import requests
import json

if __name__ == "__main__":

    #Delete files in data
    # http://stackoverflow.com/questions/185936/delete-folder-contents-in-python
    folder = 'data'
    for the_file in os.listdir(folder):
        file_path = os.path.join(folder, the_file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception, e:
            print e

    #Load new files into data
    for url in to_load:
        rel_path = url.replace('/', '.') + '.json'
        rel_path = rel_path[1:]
        f = open( 'data/' + rel_path, 'w')
        print url
        json.dump(requests.get(backend_url + url).json(), f)
        f.close()
