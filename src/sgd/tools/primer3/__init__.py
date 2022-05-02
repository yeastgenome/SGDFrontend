import json
from pyramid.response import Response
# from src.sgd.frontend import config
from urllib.request import Request, urlopen
from urllib.error import URLError
from urllib.parse import urlencode
import requests
import os

url = os.environ['BACKEND_URL'] + '/primer3'

def do_primer3(request):
    
    params = request.json_body

    # params = {'gene_name': 'ACT1', 'sequence': None, 'input_start': 500, 'input_end': 900, 'maximum_product_size': None, 'end_point': 'NO', 'minimum_length': 18, 'optimum_primer_length': 20, 'maximum_length': 23, 'minimum_tm': 57, 'optimum_tm': 59, 'maximum_tm': 62, 'minimum_gc': 30, 'optimum_gc': 50, 'maximum_gc': 70, 'max_self_complementarity': 8, 'max_three_prime_self_complementarity': 3, 'max_pair_complementarity': 8, 'max_three_prime_pair_complementarity': 3}
    
    paramData = urlencode(params)

    # paramData = 'gene_name=ACT1&sequence=None&input_start=500&input_end=900&maximum_product_size=None&end_point=NO&minimum_length=18&optimum_primer_length=20&maximum_length=23&minimum_tm=57&optimum_tm=59&maximum_tm=62&minimum_gc=30&optimum_gc=50&maximum_gc=70&max_self_complementarity=8&max_three_prime_self_complementarity=3&max_pair_complementarity=8&max_three_prime_pair_complementarity=3'
    
    res = requests.get(url, params=paramData)
    data =  json.loads(res.text)
    
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')

    
