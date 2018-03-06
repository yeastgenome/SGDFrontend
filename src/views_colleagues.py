from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response
from pyramid.view import view_config

from .models import DBSession, Colleague, Colleaguetriage
from .models_helpers import ModelsHelper

import transaction

import logging
import json
log = logging.getLogger(__name__)
models_helper = ModelsHelper()

# @view_config(route_name='colleague_create', renderer='json', request_method='POST')
# def colleague_triage_new_colleague(request):
#     colleague_data = {}
#     for p in request.params:
#         colleague_data[p] = request.params[p]
#     ct = Colleaguetriage(triage_type='New', json=json.dumps(colleague_data), colleague_id=None, created_by="OTTO")
#     DBSession.add(ct)
#     transaction.commit()
#     return {'sucess': True}

# @view_config(route_name='colleague_update', renderer='json', request_method='PUT')
# def colleague_triage_update_colleague(request):
#     format_name = request.matchdict['format_name']
#     if format_name is None:
#         return HTTPBadRequest(body=json.dumps({'error': 'No format name provided'}))
#     colleague = DBSession.query(Colleague).filter(Colleague.format_name == format_name).one_or_none()
#     if colleague:
#         colleague_data = {}
#         for p in request.params:
#             colleague_data[p] = request.params[p]
#         ct = Colleaguetriage(triage_type='Update', colleague_data=json.dumps(colleague_data), colleague_id=int(colleague.colleague_id), created_by="OTTO")
#         DBSession.add(ct)
#         transaction.commit()
#     else:
#         return HTTPNotFound(body=json.dumps({'error': 'Colleague not found'}))
#     return {'sucess': True}

# @view_config(route_name='colleague_triage_accept', renderer='json', request_method='POST')
# def colleague_triage_accept(request):
#     triage_id = request.matchdict['id']
#     if triage_id is None:
#         return HTTPBadRequest(body=json.dumps({'error': 'No triage id provided'}))

#     triage = DBSession.query(Colleaguetriage).filter(Colleaguetriage.curation_id == triage_id).one_or_none()

#     if triage:
#         triage.apply_to_colleague()
# #        triage.delete()
# #        transaction.commit()
#     else:
#         return HTTPNotFound(body=json.dumps({'error': 'Colleague triage not found'}))

#     return {'success': True}

# @view_config(route_name='colleague_triage_update', renderer='json', request_method='PUT')
# def colleague_triage_update(request):
#     triage_id = request.matchdict['id']
#     if triage_id is None:
#         return HTTPBadRequest(body=json.dumps({'error': 'No triage id provided'}))

#     triage = DBSession.query(Colleaguetriage).filter(Colleaguetriage.curation_id == id).one_or_none()

#     if triage:
#         colleague_data = {}
#         for p in request.params:
#             colleague_data[p] = request.params[p]

#         triage.colleague_data = json.dumps(colleague_data)
#         DBSession.add(triage)
#         transaction.commit()
#     else:
#         return HTTPNotFound(body=json.dumps({'error': 'Colleague triage not found'}))

#     return {'success': True}

# @view_config(route_name='colleague_triage_delete', renderer='json', request_method='DELETE')
# def colleague_triage_delete(request):
#     triage_id = request.matchdict['id']
#     if triage_id is None:
#         return HTTPBadRequest(body=json.dumps({'error': 'No triage id provided'}))

#     triage = DBSession.query(Colleaguetriage).filter(Colleaguetriage.curation_id == id).one_or_none()

#     if triage:
#         triage.delete()
#         transaction.commit()
#     else:
#         return HTTPNotFound(body=json.dumps({'error': 'Colleague triage not found'}))

@view_config(route_name='colleague_get', renderer='json', request_method='GET')
def colleague_by_format_name(request):
    format_name = request.matchdict['format_name']
    colleague = DBSession.query(Colleague).filter(Colleague.format_name == format_name).one_or_none()
    if colleague is not None:
        associated_data = models_helper.get_colleague_associated_data()
        result = colleague.to_dict()
        return result
    else:
        return HTTPNotFound(body=json.dumps({'error': 'Colleague not found'}))
