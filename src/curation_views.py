from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.view import view_config
from pyramid.session import check_csrf_token
from sqlalchemy.exc import IntegrityError
from oauth2client import client, crypt
import logging
import os
import traceback
import transaction
import json

from .helpers import allowed_file, extract_id_request, secure_save_file, curator_or_none, authenticate, extract_references, extract_keywords, get_or_create_filepath, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file, FILE_EXTENSIONS, get_locus_by_id, get_go_by_id, refresh_homepage_cache
from .curation_helpers import process_pmid_list, get_pusher_client
from .loading.promote_reference_triage import add_paper
from .models import DBSession, Dbentity, Referencedbentity, Straindbentity, Literatureannotation, Referencetriage, Referencedeleted, Locusdbentity, CurationReference, Locussummary, validate_tags
from .tsv_parser import parse_tsv_annotations

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)
log = logging.getLogger()

@view_config(route_name='get_locus_curate', request_method='GET', renderer='json')
@authenticate
def get_locus_curate(request):
    id = extract_id_request(request, 'locus', param_name="sgdid")
    locus = get_locus_by_id(id)
    return locus.get_summary_dict()

@view_config(route_name='locus_curate_update', request_method='PUT', renderer='json')
@authenticate
def locus_curate_update(request):
    try:
        id = extract_id_request(request, 'locus', param_name="sgdid")
        locus = get_locus_by_id(id)
        new_phenotype_summary = request.params.get('phenotype_summary')
        new_phenotype_pmids = process_pmid_list(request.params.get('phenotype_summary_pmids'))
        new_regulation_summary = request.params.get('regulation_summary')
        new_regulation_pmids = process_pmid_list(request.params.get('regulation_summary_pmids'))
        if len(new_phenotype_summary):
            locus.update_summary('Phenotype', request.session['username'], new_phenotype_summary, new_phenotype_pmids)
        locus = get_locus_by_id(id)
        if len(new_regulation_summary):
            locus.update_summary('Regulation', request.session['username'], new_regulation_summary, new_regulation_pmids)
        locus = get_locus_by_id(id)
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return locus.get_summary_dict()
    except ValueError as e:
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')

@view_config(route_name='reference_triage_id_delete', renderer='json', request_method='DELETE')
@authenticate
def reference_triage_id_delete(request):
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        try:
            reference_deleted = Referencedeleted(pmid=triage.pmid, sgdid=None, reason_deleted='This paper was deleted because the content is not relevant to S. cerevisiae.', created_by=request.session['username'])
            DBSession.add(reference_deleted)
            DBSession.delete(triage)        
            transaction.commit()
            pusher = get_pusher_client()
            pusher.trigger('sgd', 'triageUpdate', {})
            return HTTPOk()
        except:
            traceback.print_exc()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify that PMID is valid and not already present in SGD.'}))
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_id', renderer='json', request_method='GET')
@authenticate
def reference_triage_id(request):
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        return triage.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_id_update', renderer='json', request_method='PUT')
@authenticate
def reference_triage_id_update(request):
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        try:
            triage.update_from_json(request.json)
            transaction.commit()
        except:
            traceback.print_exc()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify if pmid is valid and not already present.'}))
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        return HTTPOk()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_promote', renderer='json', request_method='PUT')
@authenticate
def reference_triage_promote(request):
    tags = request.json['data']['tags']
    username = request.session['username']
    # validate tags before doing anything else
    try:
        validate_tags(tags)
    except Exception, e:
        return HTTPBadRequest(body=json.dumps({'error': str(e) }))

    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        # tags = []
        # for tag in request.json['data']['tags']:
        #     if tag.get('genes'):
        #         genes = tag.get('genes').split(',')
        #         for g in genes:
        #             uppername = g.upper().strip()
        #             locus = DBSession.query(Locusdbentity).filter(or_(Locusdbentity.display_name==uppername, Locusdbentity.format_name==uppername)).one_or_none()
        #             if locus is None:
        #                 return HTTPBadRequest(body=json.dumps({'error': 'Invalid gene name ' + g}))
        #             tags.append((tag['name'], tag['comment'], locus.dbentity_id))
        #     else:
        #         tags.append((tag['name'], tag['comment'], None))

        try:
            new_reference = add_paper(triage.pmid, request.json['data']['assignee'])
            DBSession.delete(triage)
            transaction.commit()
        except IntegrityError as e:
            traceback.print_exc()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': str(e) }))
        except:
            traceback.print_exc()
            return HTTPBadRequest(body=json.dumps({'error': 'Error importing PMID into the database. Verify that PMID is valid and not already present in SGD.'}))
        
        # # HANDLE TAGS
        # # track which loci have primary annotations for this reference to only have one primary per reference
        # primary_obj = {}
        # for i in xrange(len(tags)):
        #     tag_slug = tags[i][0]
        #     comment = tags[i][1]
        #     locus_dbentity_id = tags[i][2]
        #     curation_ref = CurationReference.factory(reference_id, tag_slug, comment, locus_dbentity_id, request.json['data']['assignee'])
        #     if curation_ref:
        #         DBSession.add(curation_ref)
        #     lit_annotation = Literatureannotation.factory(reference_id, tag_slug, locus_dbentity_id, request.json['data']['assignee'])
        #     if lit_annotation:
        #         # prevent multiple primary lit tags
        #         if lit_annotation.topic == 'Primary Literature':
        #             if locus_dbentity_id in primary_obj.keys():
        #                 continue
        #             else:
        #                 primary_obj[locus_dbentity_id] = True
        #         DBSession.add(lit_annotation)

        # try:
        #     DBSession.flush()
        #     transaction.commit()
        # except:
        #     traceback.print_exc()
        #     DBSession.rollback()
        new_reference.update_tags(tags, username)
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return True
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage', renderer='json', request_method='GET')
@authenticate
def reference_triage(request):
    triages = DBSession.query(Referencetriage).order_by(Referencetriage.date_created.asc()).all()
    return {'entries': [t.to_dict() for t in triages]}

@view_config(route_name='refresh_homepage_cache', request_method='POST', renderer='json')
@authenticate
def refresh_homepage_cache(request):
    refresh_homepage_cache()
    return True

@view_config(route_name='sign_in', request_method='POST', renderer='json')
def sign_in(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))

    if request.json_body['google_token'] is None:
        return HTTPForbidden(body=json.dumps({'error': 'Expected authentication token not found'}))
    
    try:
        idinfo = client.verify_id_token(request.json_body['google_token'], os.environ['GOOGLE_CLIENT_ID'])

        if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return HTTPForbidden(body=json.dumps({'error': 'Authentication token has an invalid ISS'}))
        
        if idinfo.get('email') is None:
            return HTTPForbidden(body=json.dumps({'error': 'Authentication token has no email'}))

        log.info('User ' + idinfo['email'] + ' trying to authenticate from ' + (request.remote_addr or '(no remote address)'))

        curator = curator_or_none(idinfo['email'])

        if curator is None:
            return HTTPForbidden(body=json.dumps({'error': 'User ' + idinfo['email'] + ' is not authorized on SGD'}))
        
        session = request.session

        if 'email' not in session:
            session['email'] = curator.email

        if 'username' not in session:
            session['username'] = curator.username

        log.info('User ' + idinfo['email'] + ' was successfuly authenticated.')

        return {'username': curator.username}
    except crypt.AppIdentityError:
        return HTTPForbidden(body=json.dumps({'error': 'Authentication token is invalid'}))

@view_config(route_name='sign_out', request_method='DELETE')
def sign_out(request):
    request.session.invalidate()
    return HTTPOk()


@view_config(route_name='reference_triage_tags', renderer='json', request_method='GET')
@authenticate
def reference_triage_tags(request):
    sgdid = request.matchdict['id'].upper()
    dbentity_id = DBSession.query(Dbentity.dbentity_id).filter_by(sgdid=sgdid).one_or_none()
    if dbentity_id is None:
        return HTTPNotFound()
    obj = []
    tags = DBSession.query(CurationReference).filter_by(reference_id=dbentity_id[0]).all()
    for tag in tags:
        obj.append(tag.to_dict())
    return obj

@view_config(route_name='get_recent_annotations', request_method='GET', renderer='json')
@authenticate
def get_recent_annotations(request):
    limit = 25
    annotations = []
    recent_summaries = DBSession.query(Locussummary).order_by(Locussummary.date_created.desc()).limit(limit).all()
    recent_literature = DBSession.query(Referencedbentity).order_by(Referencedbentity.dbentity_id.desc()).limit(limit * 2).all()
    for d in recent_literature:
        annotations.append(d.annotations_summary_to_dict())
    for d in recent_summaries:
        annotations.append(d.to_dict())
    annotations = sorted(annotations, key=lambda r: r['date_created'], reverse=True)
    return annotations

@view_config(route_name='upload_spreadsheet', request_method='POST', renderer='json')
@authenticate
def upload_spreadsheet(request):
    try:
        tsv_file = request.POST['file'].file
        filename = request.POST['file'].filename
        template_type = request.POST['template']
        annotations = parse_tsv_annotations(DBSession, tsv_file, filename, template_type, request.session['username'])
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return {'annotations': annotations}
    except ValueError as e:
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')
    except AttributeError:
        traceback.print_exc()
        return HTTPBadRequest(body=json.dumps({ 'error': 'Please attach a valid TSV file.' }), content_type='text/json')
    except:
        traceback.print_exc()
        return HTTPBadRequest(body=json.dumps({ 'error': 'Unable to process file upload. Please try again.' }), content_type='text/json')

# @view_config(route_name='upload', request_method='POST', renderer='json')
# @authenticate
# def upload_file(request):
#     keys = ['file', 'old_filepath', 'new_filepath', 'previous_file_name', 'display_name', 'status', 'topic_id', 'format_id', 'extension', 'file_date', 'readme_name', 'pmids', 'keyword_ids']
#     optional_keys = ['is_public', 'for_spell', 'for_browser']
    
#     for k in keys:
#         if request.POST.get(k) is None:
#             return HTTPBadRequest(body=json.dumps({'error': 'Field \'' + k + '\' is missing'}))

#     file = request.POST['file'].file
#     filename = request.POST['file'].filename

#     if not file:
#         log.info('No file was sent.')
#         return HTTPBadRequest(body=json.dumps({'error': 'No file was sent.'}))

#     if not allowed_file(filename):
#         log.info('Upload error: File ' + request.POST.get('display_name') + ' has an invalid extension.')
#         return HTTPBadRequest(body=json.dumps({'error': 'File extension is invalid'}))
    
#     try:
#         references = extract_references(request)
#         keywords = extract_keywords(request)
#         topic = extract_topic(request)
#         format = extract_format(request)
#         filepath = get_or_create_filepath(request)
#     except HTTPBadRequest as bad_request:
#         return HTTPBadRequest(body=json.dumps({'error': str(bad_request.detail)}))

#     if file_already_uploaded(request):
#         return HTTPBadRequest(body=json.dumps({'error': 'Upload error: File ' + request.POST.get('display_name') + ' already exists.'}))

#     fdb = Filedbentity(
#         # Filedbentity params
#         md5sum=None,
#         previous_file_name=request.POST.get('previous_file_name'),
#         topic_id=topic.edam_id,
#         format_id=format.edam_id,
#         file_date=datetime.datetime.strptime(request.POST.get('file_date'), '%Y-%m-%d %H:%M:%S'),
#         is_public=request.POST.get('is_public', 0),
#         is_in_spell=request.POST.get('for_spell', 0),
#         is_in_browser=request.POST.get('for_browser', 0),
#         filepath_id=filepath.filepath_id,
#         file_extension=request.POST.get('extension'),        

#         # DBentity params
#         format_name=request.POST.get('display_name'),
#         display_name=request.POST.get('display_name'),
#         s3_url=None,
#         source_id=339,
#         dbentity_status=request.POST.get('status')
#     )

#     DBSession.add(fdb)
#     DBSession.flush()
#     DBSession.refresh(fdb)

#     link_references_to_file(references, fdb.dbentity_id)
#     link_keywords_to_file(keywords, fdb.dbentity_id)
    
#     # fdb object gets expired after transaction commit
#     fdb_sgdid = fdb.sgdid
#     fdb_file_extension = fdb.file_extension
    
#     transaction.commit() # this commit must be synchronous because the upload_to_s3 task expects the row in the DB
#     log.info('File ' + request.POST.get('display_name') + ' was successfully uploaded.')
#     return Response({'success': True})
