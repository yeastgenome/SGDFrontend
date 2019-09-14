import pandas as pd
from oauth2client import client, crypt
from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound, HTTPFound
from pyramid.view import view_config
from pyramid.session import check_csrf_token
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.exc import IntegrityError, DataError, InternalError
from sqlalchemy.orm import scoped_session, sessionmaker, joinedload
from validate_email import validate_email
from random import randint
from Bio import Entrez, Medline
import collections
import datetime
import logging
import os
import traceback
import transaction
import json
import re
from bs4 import BeautifulSoup
import pandas as pd
import cgi
import string

from .helpers import allowed_file, extract_id_request, secure_save_file,\
    curator_or_none, extract_references, extract_keywords,\
    get_or_create_filepath, extract_topic, extract_format,\
    file_already_uploaded, link_references_to_file, link_keywords_to_file,\
    FILE_EXTENSIONS, get_locus_by_id, get_go_by_id, set_string_format,\
    send_newsletter_email, get_file_delimiter, unicode_to_string,\
    file_curate_update_readme, upload_new_file, get_file_curate_dropdown_data,\
    get_file_details
from .curation_helpers import ban_from_cache, process_pmid_list,\
    get_curator_session, get_pusher_client, validate_orcid, get_list_of_ptms
from .loading.promote_reference_triage import add_paper
from .models import DBSession, Dbentity, Dbuser, CuratorActivity, Colleague,\
     Colleaguetriage, LocusnoteReference, Referencedbentity, Reservedname,\
     ReservednameTriage, Straindbentity, Literatureannotation,\
     Referencetriage, Referencedeleted, Locusdbentity,\
     CurationReference, Locussummary, validate_tags,\
     convert_space_separated_pmids_to_list, Psimod,\
     Posttranslationannotation, Regulationannotation
from .tsv_parser import parse_tsv_annotations
from .models_helpers import ModelsHelper

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)
log = logging.getLogger()
models_helper = ModelsHelper()

SGD_SOURCE_ID = 834


def authenticate(view_callable):
    def inner(context, request):
        if 'email' not in request.session or 'username' not in request.session:
            return HTTPForbidden()
        else:
            return view_callable(request)
    return inner


@view_config(route_name='account', request_method='GET', renderer='json')
@authenticate
def account(request):
    return {'username': request.session['username'], 'csrfToken': request.session.get_csrf_token()}



@view_config(route_name='get_locus_curate', request_method='GET', renderer='json')
def get_locus_curate(request):
    id = extract_id_request(request, 'locus', param_name="sgdid")
    locus = get_locus_by_id(id)
    return locus.to_curate_dict()


@view_config(route_name='locus_curate_summaries', request_method='PUT', renderer='json')
@authenticate
def locus_curate_summaries(request):
    try:
        id = extract_id_request(request, 'locus', param_name='sgdid')
        locus = get_locus_by_id(id)
        new_phenotype_summary = request.params.get('phenotype_summary')
        new_regulation_summary = request.params.get('regulation_summary')
        new_regulation_pmids = process_pmid_list(request.params.get('regulation_summary_pmids'))
        locus.update_summary('Phenotype', request.session['username'], new_phenotype_summary)
        locus = get_locus_by_id(id)
        locus.update_summary('Regulation', request.session['username'], new_regulation_summary, new_regulation_pmids)
        locus = get_locus_by_id(id)
        locus.ban_from_cache()
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return locus.get_summary_dict()
    except ValueError as e:
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')


@view_config(route_name='locus_curate_basic', request_method='PUT', renderer='json')
@authenticate
def locus_curate_basic(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    try:
        id = extract_id_request(request, 'locus', param_name='sgdid')
        locus = get_locus_by_id(id)
        params = request.json_body
        username = request.session['username']
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return locus.update_basic(params, username)
    except Exception as e:
        traceback.print_exc()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

@view_config(route_name='get_new_reference_info', renderer='json', request_method='POST')
@authenticate
def get_new_reference_info(request):
    MAX_PUBS_ADDED = 10
    try:
        params = request.json_body
        if not params:
            raise ValueError('Please enter at least 1 PMID.')
        pmids = params['pmids']
        int_pmids = convert_space_separated_pmids_to_list(pmids)
        if len(int_pmids) > MAX_PUBS_ADDED:
            raise ValueError('Only ' + str(MAX_PUBS_ADDED) + ' may be added at once.')
        # avoid repeat PMIDs
        repeat_pmids = [x for x, count in list(collections.Counter(int_pmids).items()) if count > 1]
        if len(repeat_pmids):
            str_pmids = [str(x) for x in repeat_pmids]
            str_pmids = ', '.join(str_pmids)
            msg = 'A PMID was repeated: ' + str_pmids
            raise ValueError(msg)
        confirmation_list = []
        for x in int_pmids:
            is_in_db = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == x).one_or_none()
            if is_in_db:
                raise ValueError('At least 1 PMID is already in the database: ' + str(x))
            record = Medline.read(Entrez.efetch(db='pubmed', id=str(x), rettype='medline'))
            warning = Referencedbentity.get_deletion_warnings(x)
            journal_title = record.get('JT', '')
            if len(journal_title) <= 1:
                raise ValueError('Cannot import PMID ' + str(x) + ' because journal title is blank.')
            confirmation_item = {
                'name': record.get('TI') + ' PMID: ' + str(x),
                'pmid': x,
                'warning': warning
            }            
            confirmation_list.append(confirmation_item)
        return {
            'references': confirmation_list
        }
    except Exception as e:
        traceback.print_exc()
        log.error(e)
        DBSession.rollback()
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

@view_config(route_name='new_reference', renderer='json', request_method='POST')
@authenticate
def new_reference(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    try:
        params = request.json_body
        username = request.session['username']
        references = params['references']
        for x in references:
            pmid = x['pmid']
            Referencedbentity.clear_from_triage_and_deleted(pmid, username)
            new_ref = add_paper(
                pmid, username, method_obtained="Curator PubMed reference")
        transaction.commit()
        # sync to curator activity
        for x in references:
            pmid = x['pmid']
            ref = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == pmid).one_or_none()
            ref.sync_to_curate_activity(username)
    except Exception as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

@view_config(route_name='reference_triage_id_delete', renderer='json', request_method='DELETE')
@authenticate
def reference_triage_id_delete(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    curator_session = None
    if triage:
        try:
            curator_session = get_curator_session(request.session['username'])
            triage = curator_session.query(Referencetriage).filter_by(curation_id=id).one_or_none()
            # only add referencedeleted if reference not in referencedbentity (allow curators to delete a reference that was added to DB but failed to removed from referencetriage)
            existing_ref = curator_session.query(Referencedbentity).filter_by(pmid=triage.pmid).one_or_none()
            existing_ref_deleted = curator_session.query(Referencedeleted).filter_by(pmid=triage.pmid).one_or_none()
            if not (existing_ref or existing_ref_deleted):
                reference_deleted = Referencedeleted(pmid=triage.pmid, sgdid=None, reason_deleted='This paper was discarded during literature triage.', created_by=request.session['username'])
                curator_session.add(reference_deleted)
            else:
                log.warning(str(triage.pmid) + ' was removed from referencetriage but no Referencedeleted was added.')
            curator_session.delete(triage)        
            transaction.commit()
            pusher = get_pusher_client()
            pusher.trigger('sgd', 'triageUpdate', {})
            return HTTPOk()
        except Exception as e:
            transaction.abort()
            if curator_session:
                curator_session.rollback()
            log.error(e)
            return HTTPBadRequest(body=json.dumps({'error': str(e) }))
        finally:
            if curator_session:
                curator_session.close()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_id', renderer='json', request_method='GET')
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
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        try:
            triage.update_from_json(request.json)
            transaction.commit()
        except:
            traceback.print_exc()
            transaction.abort()
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
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    tags = request.json['tags']
    username = request.session['username']
    # validate tags before doing anything else
    try:
        validate_tags(tags)
    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e) }))
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    new_reference_id = None
    existing_ref = DBSession.query(Referencedbentity).filter_by(pmid=triage.pmid).one_or_none()
    if existing_ref:
        return HTTPBadRequest(body=json.dumps({'error': 'The reference already exists in the database. You may need to discard from triage after verifying.' }))
    if triage:
        # promote
        try:
            new_reference = add_paper(triage.pmid, request.json['data']['assignee'])
            new_reference_id = new_reference.dbentity_id
            curator_session = get_curator_session(request.session['username'])
            triage = curator_session.query(Referencetriage).filter_by(curation_id=id).one_or_none()
            curator_session.delete(triage)
            transaction.commit()
        except Exception as e:
            traceback.print_exc()
            log.error(e)
            transaction.abort()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': str(e) }))
        # update tags
        try:
            curator_session = get_curator_session(request.session['username'])
            new_reference = curator_session.query(Referencedbentity).filter_by(dbentity_id=new_reference_id).one_or_none()
            new_reference.update_tags(tags, username)
        except IntegrityError as e:
            log.error(e)
            curator_session.rollback()
        finally:
            curator_session.close()
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return new_reference.annotations_summary_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_index', renderer='json', request_method='GET')
def reference_triage_index(request):
    total = DBSession.query(Referencetriage).count()
    triages = DBSession.query(Referencetriage).order_by(Referencetriage.date_created.asc()).limit(150).all()
    return { 'entries': [t.to_dict() for t in triages], 'total': total }

@view_config(route_name='refresh_homepage_cache', request_method='POST', renderer='json')
@authenticate
def refresh_homepage_cache(request):
    ban_from_cache(['/'], True)
    return True

@view_config(route_name='db_sign_in', request_method='POST', renderer='json')
def db_sign_in(request):
    Temp_session = None
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    try:
        params = request.json_body
        username = params.get('username').lower()
        password = params.get('password')
        # create custom DB URI, replacing with username and password
        default_db_uri = os.environ['NEX2_URI']
        user_str = username + ':' + password + '@'
        user_db_uri = 'postgresql://' + user_str + default_db_uri.split('@')[1]
        temp_engine = create_engine(user_db_uri)
        session_factory = sessionmaker(bind=temp_engine)
        Temp_session = scoped_session(session_factory)
        user = Temp_session.query(Dbuser).filter_by(username=username.upper()).one_or_none()
        if user is None:
            raise ValueError('Invalid login')
        curator = curator_or_none(user.email)
        if curator is None:
            return HTTPForbidden(body=json.dumps({'error': 'User is not authorized on SGD'}))
        session = request.session
        session['email'] = curator.email
        session['username'] = curator.username
        log.info('User ' + curator.email + ' was successfuly authenticated.')
        return {
            'username': session['username'],
            'csrfToken': request.session.get_csrf_token()
        }
    except:
        traceback.print_exc()
        return HTTPForbidden(body=json.dumps({'error': 'Incorrect login details.'}))
    finally:
        if Temp_session:
            Temp_session.close()

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

@view_config(route_name='sign_out', request_method='GET')
def sign_out(request):
    request.session.invalidate()
    return HTTPOk()

@view_config(route_name='reference_tags', renderer='json', request_method='GET')
# @authenticate
def reference_tags(request):
    id = extract_id_request(request, 'reference', 'id', True)
    if id:
        reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
    else:
        reference = DBSession.query(Referencedbentity).filter_by(sgdid=request.matchdict['id']).one_or_none()
    return reference.get_tags()

@view_config(route_name='update_reference_tags', renderer='json', request_method='PUT')
@authenticate
def update_reference_tags(request):
    curator_session = None
    try:
        id = extract_id_request(request, 'reference', 'id', True)
        tags = request.json['tags']
        username = request.session['username']
        curator_session = get_curator_session(username)
        if id:
            reference = curator_session.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
        else:
            reference = curator_session.query(Referencedbentity).filter_by(sgdid=request.matchdict['id']).one_or_none()
        reference.update_tags(tags, username)
        reference.ban_from_cache()
        processed_tags = reference.get_tags()
        curator_session.remove()
        return processed_tags
    except Exception as e:
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')

@view_config(route_name='get_recent_annotations', request_method='GET', renderer='json')
def get_recent_annotations(request):
    annotations = []
    is_everyone = request.params.get('everyone', False)
    username = request.session['username']
    start_date = datetime.datetime.today() - datetime.timedelta(days=30)
    end_date = datetime.datetime.today()
    if is_everyone:
        recent_activity = DBSession.query(CuratorActivity).filter(CuratorActivity.date_created >= start_date).order_by(CuratorActivity.date_created.desc()).all()
    else:
        recent_activity = DBSession.query(CuratorActivity).filter(and_(CuratorActivity.date_created >= start_date, CuratorActivity.created_by == username)).order_by(CuratorActivity.date_created.desc()).all() 
    for d in recent_activity:
        annotations.append(d.to_dict())
    annotations = sorted(annotations, key=lambda r: r['time_created'], reverse=True)
    return annotations

@view_config(route_name='upload_spreadsheet', request_method='POST', renderer='json')
@authenticate
def upload_spreadsheet(request):
    try:
        file_upload = request.POST['file'].file
        filename = request.POST['file'].filename
        template_type = request.POST['template']
        username = request.session['username']
        file_ext = os.path.splitext(filename)[1].replace('.','').strip()
        delimiter = '\t'
        if file_ext in ('csv', 'tsv', 'txt',):
            delimiter = get_file_delimiter(file_upload)
        annotations = parse_tsv_annotations(DBSession, file_upload, filename, template_type, username, delimiter)
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return {'annotations': annotations}
    except ValueError as e:
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')
    except AttributeError:
        traceback.print_exc()
        return HTTPBadRequest(body=json.dumps({ 'error': 'Please attach a valid TSV file.' }), content_type='text/json')
    except IntegrityError as IE:
        traceback.print_exc()
        if 'already exists' in IE.message:
            return HTTPBadRequest(body=json.dumps({'error': 'Unable to process file upload. Record already exists.'}), content_type='text/json')
        else:
            return HTTPBadRequest(body=json.dumps({'error': 'Unable to process file upload. Database error occured while updating your entry.'}), content_type='text/json')
    except:
        traceback.print_exc()
        return HTTPBadRequest(body=json.dumps({ 'error': 'Unable to process file upload. Please try again.' }), content_type='text/json')

# not authenticated to allow the public submission
@view_config(route_name='new_gene_name_reservation', renderer='json', request_method='POST')
def new_gene_name_reservation(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    data = request.json_body
    required_fields = ['colleague_id', 'year', 'status']
    # validate fields outside of reservation
    for x in required_fields:
        if not data[x]:
            field_name = x.replace('_', ' ')
            field_name = field_name.replace('new', 'proposed')
            msg = field_name + ' is a required field.'
            return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
        if x == 'year':
            try:
                iy = int(data[x])
                if iy < 1950 or iy > 2050:
                    raise ValueError('Not a valid year')
            except ValueError as e:
                msg = 'Please enter a valid year.'
                return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    # make sure author names have only letters
    if 'authors' in list(data.keys()):
        authors = data['authors']
        for a in authors:
            if a['first_name'] and a['last_name']:
                first_name = a['first_name']
                last_name = a['last_name']
                if not (first_name.isalpha() and last_name.isalpha()):
                    return HTTPBadRequest(body=json.dumps({ 'message': 'Author names must contain only letters.' }), content_type='text/json')
    res_required_fields = ['new_gene_name']
    # validate reservations themselves
    for res in data['reservations']:
        for x in res_required_fields:
            if not res[x]:
                field_name = x.replace('_', ' ')
                field_name = field_name.replace('new', 'proposed')
                msg = field_name + ' is a required field.'
                return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
        proposed_name = res['new_gene_name'].strip().upper()
        is_already_res = DBSession.query(Reservedname).filter(Reservedname.display_name == proposed_name).one_or_none()
        if is_already_res:
            msg = 'The proposed name ' + proposed_name + ' is already reserved. Please contact sgd-helpdesk@lists.stanford.edu for more information.'
            return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
        is_already_gene = DBSession.query(Locusdbentity).filter(Locusdbentity.gene_name == proposed_name).one_or_none()
        if is_already_gene:
            msg = 'The proposed name ' + proposed_name + ' is a standard gene name. Please contact sgd-helpdesk@lists.stanford.edu for more information.'
            return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
        # make sure is proper format
        if not Locusdbentity.is_valid_gene_name(proposed_name):
            msg = 'Proposed gene name does not meet standards for gene names. Must be 3 letters followed by a number.'
            return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
        # validate ORF as valid systematic name
        if res['systematic_name']:
            proposed_systematic_name = res['systematic_name'].strip()
            systematic_locus = DBSession.query(Locusdbentity).filter(Locusdbentity.systematic_name == proposed_systematic_name).one_or_none()
            if not systematic_locus:
                msg = proposed_systematic_name + ' is not a recognized locus systematic name.'
                return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
            # see if there is already a res for that locus, or if already named
            is_systematic_res = DBSession.query(Reservedname).filter(Reservedname.locus_id == systematic_locus.dbentity_id).one_or_none()
            if is_systematic_res:
                msg = proposed_systematic_name + ' has already been reserved. Please contact sgd-helpdesk@lists.stanford.edu for more information.'
                return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
            is_already_named = DBSession.query(Locusdbentity.gene_name).filter(Locusdbentity.dbentity_id == systematic_locus.dbentity_id).scalar()
            if is_already_named:
                msg = proposed_systematic_name + ' has already been named. Please contact sgd-helpdesk@lists.stanford.edu for more information.'
                return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
            existing_name = systematic_locus.gene_name
            if existing_name:
                msg = proposed_systematic_name + ' already has a standard name: ' + existing_name + '. Please contact sgd-helpdesk@lists.stanford.edu for more information.'
                return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    # input is valid, add entry or entries to reservednametriage
    try:
        colleague_id = data['colleague_id']
        for res in data['reservations']:
            proposed_gene_name = res['new_gene_name'].upper()
            res_data = data
            res_data.pop('reservations', None)
            res_data.update(res)
            res_json = json.dumps(res_data)
            new_res = ReservednameTriage(
                proposed_gene_name=proposed_gene_name,
                colleague_id=colleague_id,
                json=res_json
            )
            DBSession.add(new_res)
        transaction.commit()
        return True
    except Exception as e:
        traceback.print_exc()
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

# not authenticated to allow the public submission
@view_config(route_name='colleague_update', renderer='json', request_method='PUT')
def colleague_update(request):
    curator_session = None
    if 'username' in request.session:
        curator_session = get_curator_session(request.session['username'])
    else:
        curator_session = DBSession

    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    req_id = request.matchdict['id'].upper()
    data = request.json_body
    required_fields = ['first_name', 'last_name', 'email', 'orcid']
    for x in required_fields:
        if not data[x]:
            msg = x + ' is a required field.'
            return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    if req_id == 'NULL':
        return HTTPBadRequest(body=json.dumps({ 'message': 'Please select your name from colleague list or create a new entry.' }), content_type='text/json')
    is_email_valid = validate_email(data['email'], verify=False)
    if not is_email_valid:
        msg = data['email'] + ' is not a valid email.'
        return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    is_orcid_valid = validate_orcid(data['orcid'])
    if not is_orcid_valid:
        msg = data['orcid'] + ' is not a valid orcid.'
        return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    colleague = curator_session.query(Colleague).filter(
        Colleague.colleague_id == req_id).one_or_none()
    if not colleague:
        return HTTPNotFound()
    # add colleague triage entry
    try:
        is_changed = False
        old_dict = colleague.to_simple_dict()
        for x in list(old_dict.keys()):
            if data.get(x) is not None:
                if old_dict[x] != data[x]:
                    is_changed = True
        if is_changed:
            existing_triage = curator_session.query(Colleaguetriage).filter(
                Colleaguetriage.colleague_id == req_id).one_or_none()
            if existing_triage:
                existing_triage.json = json.dumps(data)
            else:
                new_c_triage = Colleaguetriage(
                    colleague_id = req_id,
                    json=json.dumps(data),
                    triage_type='Update',
                )
                curator_session.add(new_c_triage)
                colleague.is_in_triage = True
            transaction.commit()
            return { 'colleague_id': req_id }
        else:
            return { 'colleague_id': req_id }
    except Exception as e:
        traceback.print_exc()
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')
'''
# not authenticated to allow the public submission
@view_config(route_name='new_colleague', renderer='json', request_method='POST')
def new_colleague(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    params = request.json_body
    required_fields = ['first_name', 'last_name', 'email', 'orcid']
    for x in required_fields:
        if not params[x]:
            msg = x + ' is a required field.'
            return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    is_email_valid = validate_email(params['email'], verify=False)
    if not is_email_valid:
        msg = params['email'] + ' is not a valid email.'
        return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    is_orcid_valid = validate_orcid(params['orcid'])
    if not is_orcid_valid:
        msg = params['orcid'] + ' is not a valid orcid.'
        return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    colleague_orcid_exists = DBSession.query(Colleague).filter(Colleague.orcid == params.get('orcid')).one_or_none()
    if colleague_orcid_exists:
        msg = 'You entered an ORCID which is already being used by an SGD colleague. Try to find your entry or contact sgd-helpdesk@lists.stanford.edu if you think this is a mistake.'
        return HTTPBadRequest(body=json.dumps({ 'message': msg }), content_type='text/json')
    try:
        full_name = params['first_name'] + ' ' + params['last_name']
        format_name = params['first_name'] + '_' + params['last_name'] + str(randint(1,100))# add a random number to be sure it's unique
        created_by = get_username_from_db_uri()
        new_colleague = Colleague(
            format_name = format_name,
            display_name = full_name,
            obj_url = '/colleague/' + format_name,
            source_id = 759,# direct submission
            orcid = params['orcid'],
            first_name = params['first_name'],
            last_name = params['last_name'],
            email = params['email'],
            is_contact = False,
            is_beta_tester = False,
            display_email = False,
            is_in_triage = True,
            is_pi = False,
            created_by = created_by
        )
        DBSession.add(new_colleague)
        DBSession.flush()
        new_colleague_id = new_colleague.colleague_id
        new_colleague = DBSession.query(Colleague).filter(Colleague.format_name == format_name).one_or_none()
        new_c_triage = Colleaguetriage(
            colleague_id = new_colleague_id,
            json=json.dumps(params),
            triage_type='New',
        )
        DBSession.add(new_c_triage)
        transaction.commit()
        return { 'colleague_id': new_colleague_id }
    except Exception as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')
'''


@view_config(route_name='reserved_name_index', renderer='json')
@authenticate
def reserved_name_index(request):
    res_triages = DBSession.query(ReservednameTriage).all()
    res_triages = [x.to_dict() for x in res_triages]
    reses = DBSession.query(Reservedname).all()
    reses = [x.to_curate_dict() for x in reses]
    reses = res_triages + reses
    return reses

@view_config(route_name='reserved_name_curate_show', renderer='json')
@authenticate
def reserved_name_curate_show(request):
    req_id = request.matchdict['id'].upper()
    # may be either Reservedname or reservedname triage entry
    res = DBSession.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()

    res_dict = None
    if res:
        res_dict = res.to_curate_dict()
    else:
        res = DBSession.query(ReservednameTriage).filter(ReservednameTriage.curation_id == req_id).one_or_none()
        res_dict = res.to_dict()

    if res_dict:
        return res_dict
    else:
        return HTTPNotFound()

@view_config(route_name='reserved_name_update', renderer='json', request_method='PUT')
@authenticate
def reserved_name_update(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    req_id = request.matchdict['id'].upper()
    params = request.json_body
    username = request.session['username']
    res = DBSession.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()
    if not res:
        res = DBSession.query(ReservednameTriage).filter(ReservednameTriage.curation_id == req_id).one_or_none()
    if not res:
        return HTTPNotFound()

    try:
        return res.update(params, username)
    except Exception as e:
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

@view_config(route_name='reserved_name_standardize', renderer='json', request_method='POST')
@authenticate
def reserved_name_standardize(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    try:
        req_id = request.matchdict['id'].upper()
        username = request.session['username']
        params = request.json_body
        if not params['gene_name_pmid']:
            raise ValueError('Please provide a PMID to associate with the gene name.')
        # associate gene name PMID
        gene_name_pmid = int(params['gene_name_pmid'])
        gene_name_ref = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == gene_name_pmid).one_or_none()
        if not gene_name_ref:
            raise ValueError(str(gene_name_pmid) + ' is not in the database. Please add to the database and try again.')
        has_name_desc = params['name_description_pmid']
        if has_name_desc:
            name_desc_pmid = int(params['name_description_pmid'])
            name_desc_ref = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == name_desc_pmid).one_or_none()
            if not name_desc_ref:
                raise ValueError(str(name_desc_pmid) + ' is not in the database. Please add to the database and try again.')
        res = DBSession.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()
        if not res.locus_id:
            raise ValueError('Reserved name must be associated with an ORF before being standardized.')
        res.associate_published_reference(gene_name_ref.dbentity_id, username, 'gene_name')
        # maybe associate name desc
        if has_name_desc:
            res = DBSession.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()
            name_desc_ref = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == name_desc_pmid).one_or_none()
            res.associate_published_reference(name_desc_ref.dbentity_id, username, 'name_description')
        res = DBSession.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()
        res.standardize(request.session['username'])
        return True
    except Exception as e:
        transaction.abort()
        traceback.print_exc()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')


@view_config(route_name='reserved_name_delete', renderer='json', request_method='DELETE')
@authenticate
def reserved_name_delete(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    curator_session = None
    personal_com_id = None
    try:
        username = request.session['username']
        curator_session = get_curator_session(username)
        req_id = request.matchdict['id'].upper()
        res = curator_session.query(ReservednameTriage).filter(ReservednameTriage.curation_id == req_id).one_or_none()
        if not res:
            res = curator_session.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()
            personal_com_id = res.reference_id
        if not res:
            return HTTPNotFound()
        curator_session.delete(res)
        transaction.commit()
        # maybe delete personal communication
        if personal_com_id:
            ref_count = curator_session.query(Reservedname).filter(and_(Reservedname.reference_id == personal_com_id, Reservedname.reservedname_id != req_id)).count()
            ref_note_count = curator_session.query(LocusnoteReference).filter(LocusnoteReference.reference_id == personal_com_id).count()
            personal_communication_ref = curator_session.query(Referencedbentity).filter(Referencedbentity.dbentity_id == personal_com_id).one_or_none()
            if ref_count == 0 and ref_note_count == 0 and personal_communication_ref.publication_status != 'Published':
                personal_communication_ref.delete_with_children(username)           
        return True
    except Exception as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')
    finally:
        if curator_session:
            curator_session.remove()

@view_config(route_name='reserved_name_promote', renderer='json', request_method='PUT')
@authenticate
def reserved_name_promote(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    req_id = request.matchdict['id'].upper()
    res = DBSession.query(ReservednameTriage).filter(ReservednameTriage.curation_id == req_id).one_or_none()
    try:
        return res.promote(request.session['username'])
    except Exception as e:
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

@view_config(route_name='extend_reserved_name', renderer='json', request_method='PUT')
@authenticate
def extend_reserved_name(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    req_id = request.matchdict['id'].upper()
    res = DBSession.query(Reservedname).filter(Reservedname.reservedname_id == req_id).one_or_none()
    try:
        return res.extend(request.session['username'])
    except Exception as e:
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')


@view_config(route_name='colleague_triage_index', renderer='json', request_method='GET')
def colleague_triage_index(request):
    c_triages = DBSession.query(Colleaguetriage).all()
    return [x.to_dict() for x in c_triages]

@view_config(route_name='colleague_triage_show', renderer='json', request_method='GET')
def colleague_triage_show(request):
    req_id = request.matchdict['id'].upper()
    c_triage = DBSession.query(Colleaguetriage).filter(Colleaguetriage.curation_id == req_id).one_or_none()
    if c_triage:
        return c_triage.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='colleague_triage_update', renderer='json', request_method='PUT')
@authenticate
def colleague_triage_update(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    return True


@view_config(route_name='colleague_triage_promote', renderer='json', request_method='PUT')
@authenticate
def colleague_triage_promote(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error': 'Bad CSRF Token'}))
    curator_session = None
    try:
        username = request.session['username']
        curator_session = get_curator_session(username)
        req_id = int(request.matchdict['id'])
        params = request.json_body
        full_name = params['first_name'] + ' ' + params['last_name']
        format_name = set_string_format(full_name) + str(randint(1, 100))
        c_triage = curator_session.query(Colleaguetriage).filter(
            Colleaguetriage.curation_id == req_id).one_or_none()
        if not c_triage:
            return HTTPNotFound()
        orcid = params.get('orcid')
        first_name = params.get('first_name')
        last_name = params.get('last_name')
        email = params.get('email')
        is_beta_tester = params.get('willing_to_be_beta_tester')
        display_email = params.get('display_email')
        is_contact = params.get('receive_quarterly_newsletter')

        if c_triage.colleague_id:
            colleague = curator_session.query(Colleague).filter(
                Colleague.colleague_id == c_triage.colleague_id).one_or_none()
            if (colleague.first_name != first_name or colleague.last_name != last_name):
                colleague.first_name = first_name
                colleague.last_name = last_name
                colleague.format_name = format_name
                colleague.display_name = full_name
                colleague.obj_url = '/colleague/' + format_name
            colleague.orcid = orcid
            colleague.email = email
            colleague.display_email = display_email
            colleague.is_contact = is_contact
            colleague.is_beta_tester = is_beta_tester
            colleague.is_in_triage = False

            # get_username_from_db_uri() if colleague.created_by == 'OTTO' else username
        else:
            new_colleague = Colleague(
                format_name=format_name,
                display_name=full_name,
                obj_url='/colleague/' + format_name,
                source_id=759,  # direct submission
                orcid=orcid,
                first_name=first_name,
                last_name=last_name,
                email=email,
                is_contact=is_contact,
                is_beta_tester=is_beta_tester,
                display_email=display_email,
                is_in_triage=False,
                is_pi=False,
                created_by=username
            )
            curator_session.add(new_colleague)
            curator_session.flush()

        curator_session.delete(c_triage)
        transaction.commit()
        return True
    except IntegrityError as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({'message': 'Error: Duplicate record detected, Please contact sgd-helpdesk@lists.stanford.edu if issue persists'}), content_type='text/json')
    except Exception as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({'message': str(e)}), content_type='text/json')
    finally:
        if curator_session:
            curator_session.remove()


@view_config(route_name='colleague_triage_delete', renderer='json', request_method='DELETE')
@authenticate
def colleague_triage_delete(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    curator_session = None
    try:
        username = request.session['username']
        curator_session = get_curator_session(username)
        req_id = request.matchdict['id'].upper()
        c_triage = curator_session.query(Colleaguetriage).filter(Colleaguetriage.curation_id == req_id).one_or_none()
        if not c_triage:
            return HTTPNotFound()
        curator_session.delete(c_triage)
        transaction.commit()
        return True
    except Exception as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')
    finally:
        if curator_session:
            curator_session.remove()


def get_username_from_db_uri():
    s = os.environ['NEX2_URI']
    start = 'postgresql://'
    end = '@'
    userp = s[s.find(start)+len(start):s.find(end)]
    created_by = userp.split(':')[0].upper()
    return created_by


# add new colleague
#     config.add_route('add_new_colleague_triage', '/colleagues', request_method='POST')

@view_config(route_name='add_new_colleague_triage', renderer='json', request_method='POST')
def add_new_colleague_triage(request):
    curator_session = None
    if 'username' in request.session:
        curator_session = get_curator_session(request.session['username'])
    else:
        curator_session = DBSession

    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error': 'Bad CSRF Token'}))
    params = request.json_body
    required_fields = ['first_name', 'last_name', 'email', 'orcid']
    for x in required_fields:
        if not params[x]:
            msg = x + ' is a required field.'
            return HTTPBadRequest(body=json.dumps({'message': msg}), content_type='text/json')
    is_email_valid = validate_email(params['email'], verify=False)
    if not is_email_valid:
        msg = params['email'] + ' is not a valid email.'
        return HTTPBadRequest(body=json.dumps({'message': msg}), content_type='text/json')
    is_orcid_valid = validate_orcid(params['orcid'])
    if not is_orcid_valid:
        msg = params['orcid'] + ' is not a valid orcid.'
        return HTTPBadRequest(body=json.dumps({'message': msg}), content_type='text/json')
    colleague_orcid_email_exists = curator_session.query(Colleague).filter(or_(and_(Colleague.orcid == params.get('orcid'), Colleague.email == params.get(
        'email')), or_(Colleague.orcid == params.get('orcid'), Colleague.email == params.get('email')))).one_or_none()
    if colleague_orcid_email_exists:
        msg = 'You entered an ORCID or Email which is already being used by an SGD colleague. Try to find your entry or contact sgd-helpdesk@lists.stanford.edu if you think this is a mistake.'
        return HTTPBadRequest(body=json.dumps({'message': msg}), content_type='text/json')
    try:
        full_name = params['first_name'] + ' ' + params['last_name']
        # add a random number to be sure it's unique
        format_name = set_string_format(full_name) + str(randint(1, 100))
        new_c_triage = Colleaguetriage(
            json=json.dumps(params),
            triage_type='New',
        )
        curator_session.add(new_c_triage)
        transaction.commit()
        return {'colleague_id': 0}
    except IntegrityError as IE:
        transaction.abort()
        log.error(IE)
        return HTTPBadRequest(body=json.dumps({'message': 'Orcid or Email already exists, if error persist Please contact sgd-helpdesk@lists.stanford.edu'}), content_type='text/json')
    except Exception as e:
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({'message': str(e) + ' something bad happened'}), content_type='text/json')



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



@view_config(route_name='colleague_with_subscription', renderer='json', request_method='GET')
def colleague_with_subscription(request):
    try:
        colleagues = models_helper.get_all_colleague_with_subscription()
        emails_string = ";\n".join([colleague.email for colleague in colleagues])  #[colleague.email for colleague in colleagues]
        return {'colleagues':emails_string}
    except:
        return HTTPBadRequest(body=json.dumps({'error': "Error retrieving colleagues"}))

@view_config(route_name='get_newsletter_sourcecode',renderer='json',request_method='POST')
@authenticate
def get_newsletter_sourcecode(request):
    try:
        from urllib.request import urlopen
        url = str(request.POST['url'])

        if(url.startswith('https://wiki.yeastgenome.org')):
            response = urlopen(url)
            html = response.read()
            soup = BeautifulSoup(html, 'html.parser')
            body = soup.find(id='content')
            body['style']='margin-left:0'

            sitesub = body.find(id='siteSub')
            if(sitesub):
                sitesub.decompose()
            
            jumptonav = body.find(id='jump-to-nav')
            if(jumptonav):
                jumptonav.decompose()
            
            printfooter= body.find(class_="printfooter")
            if(printfooter):
                printfooter.decompose()

            catlinks = body.find(id='catlinks')
            if(catlinks):
                catlinks.decompose()
            
            for link in body.find_all(href=re.compile("^#")):
                link['href'] = url + link['href']
            for link in body.find_all(href=re.compile("^/")):
                link['href']="https://wiki.yeastgenome.org" + link['href']
            for img in body.find_all(src=re.compile("^/")):
                if(img.has_attr('srcset')):
                    del img['srcset']
                img['src']="https://wiki.yeastgenome.org" + img['src']
            
            unsubscribe = BeautifulSoup("<p>Note: If you no longer wish to receive this newsletter, please contact the SGD Help Desk at sgd-helpdesk@lists.stanford.edu .<p>").p
            body.append(unsubscribe)
            return {"code":body.prettify()}
        else:
            return HTTPBadRequest(body=json.dumps({'error': "URL must be from wiki.yeastgenome.org"}))
    except:
        return HTTPBadRequest(body=json.dumps({'error': "Unexpected error"}))

@view_config(route_name='send_newsletter',renderer='json',request_method='POST')
@authenticate
def send_newsletter(request):
    try:    
        html = request.POST['html']
        subject = request.POST['subject']
        # recipients = request.POST['recipients'].split(';')
        recipients = str(request.POST['recipients'])
        recipients = recipients.replace('\n','')
        recipients = recipients.split(";")
        
        returnValue = send_newsletter_email(subject,recipients,html)
        if "success" in returnValue:
            return HTTPOk(body=json.dumps(returnValue), content_type='text/json')
        else:
            return HTTPBadRequest(body=json.dumps(returnValue), content_type='text/json')
    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': "Error occured during sending newsletter"}), content_type='text/json')


@view_config(route_name='ptm_file_insert', renderer='json', request_method='POST')
@authenticate
def ptm_file_insert(request):
    
    try:
        file = request.POST['file'].file
        filename = request.POST['file'].filename
        CREATED_BY = request.session['username']
        xl = pd.ExcelFile(file)
        list_of_sheets = xl.sheet_names
        
        COLUMNS = {
            'gene': 'Gene(sgdid,systematic name)',
            'taxonomy': 'Taxonomy',
            'reference': 'Reference(sgdid,pubmed id,reference no)',
            'index': 'Index',
            'residue': 'Residue',
            'psimod': 'Psimod',
            'modifier': 'Modifier(sgdid,systematic name)'
        }

        SOURCE_ID = 834
        SEPARATOR = '|'

        list_of_posttranslationannotation = []
        list_of_posttranslationannotation_errors = []
        df = pd.read_excel(io=file, sheet_name="Sheet1")
        
        null_columns = df.columns[df.isnull().any()]
        for col in null_columns:
            if COLUMNS['modifier'] != col:    
                rows = df[df[col].isnull()].index.tolist()
                rows = ','.join([ str(r+2) for r in rows])
                list_of_posttranslationannotation_errors.append('No values in column ' + col + ' rows '+ rows)

        if list_of_posttranslationannotation_errors:
            err = [e + '\n' for e in list_of_posttranslationannotation_errors]
            return HTTPBadRequest(body=json.dumps({"error": list_of_posttranslationannotation_errors}), content_type='text/json')

        sgd_id_to_dbentity_id, systematic_name_to_dbentity_id = models_helper.get_dbentity_by_subclass(['LOCUS', 'REFERENCE'])
        strain_to_taxonomy_id = models_helper.get_common_strains()
        psimod_to_id = models_helper.get_psimod_all()
        posttranslationannotation_to_site = models_helper.posttranslationannotation_with_key_index()
        pubmed_id_to_reference, reference_to_dbentity_id = models_helper.get_references_all()

        for index_row, row in df.iterrows():
            index = index_row + 2
            column = ''
            try:
                posttranslationannotation_existing={
                    'dbentity_id':'',
                    'source_id': SOURCE_ID,
                    'taxonomy_id':'',
                    'reference_id':'',
                    'psimod_id':'',
                    'modifier_id':None,
                    "site_index":'',
                    "site_residue":''
                }
                posttranslationannotation_update = {}

                column = COLUMNS['gene']
                gene = unicode_to_string(row[column])

                gene_current = str(row[COLUMNS['gene']].split(SEPARATOR)[0]).strip()
                key = (gene_current, 'LOCUS')
                if(key in sgd_id_to_dbentity_id):
                    posttranslationannotation_existing['dbentity_id'] = sgd_id_to_dbentity_id[key]
                elif(key in systematic_name_to_dbentity_id):
                    posttranslationannotation_existing['dbentity_id'] = systematic_name_to_dbentity_id[key]
                else:
                    list_of_posttranslationannotation_errors.append('Error in gene on row ' + str(index) + ', column ' + column)
                    continue

                if SEPARATOR in gene:
                    gene_new = str(row[COLUMNS['gene']].split(SEPARATOR)[1]).strip()
                    key = (gene_new, 'LOCUS')
                    if(key in sgd_id_to_dbentity_id):
                        posttranslationannotation_update['dbentity_id'] = sgd_id_to_dbentity_id[key]
                    elif(key in systematic_name_to_dbentity_id):
                        posttranslationannotation_update['dbentity_id'] = systematic_name_to_dbentity_id[key]
                    else:
                        list_of_posttranslationannotation_errors.append('Error in gene on row ' + str(index) + ', column ' + column)
                        continue


                column = COLUMNS['taxonomy']
                taxonomy = row[column]
                taxonomy_current = str(row[COLUMNS['taxonomy']]).upper().split(SEPARATOR)[0]
                if taxonomy_current in strain_to_taxonomy_id:
                    posttranslationannotation_existing['taxonomy_id'] = strain_to_taxonomy_id[taxonomy_current]
                else:
                    list_of_posttranslationannotation_errors.append('Error in taxonomy on row ' + str(index) + ', column ' + column)
                    continue

                if SEPARATOR in taxonomy:
                    taxonomy_new = str(row[COLUMNS['taxonomy']]).upper().split(SEPARATOR)[1]
                    if taxonomy_new in strain_to_taxonomy_id:
                        posttranslationannotation_update['taxonomy_id'] = strain_to_taxonomy_id[taxonomy_new]
                    else:
                        list_of_posttranslationannotation_errors.append('Error in updating taxonomy on row ' + str(index) + ', column ' + column)
                        continue


                column = COLUMNS['reference']
                reference = row[column]

                reference_current = str(row[COLUMNS['reference']]).split(SEPARATOR)[0]
                if((reference_current, 'REFERENCE') in sgd_id_to_dbentity_id):
                    posttranslationannotation_existing['reference_id'] = sgd_id_to_dbentity_id[(reference_current, 'REFERENCE')]
                elif(reference_current in pubmed_id_to_reference):
                    posttranslationannotation_existing['reference_id'] = pubmed_id_to_reference[reference_current]
                elif(reference_current in reference_to_dbentity_id):
                    posttranslationannotation_existing['reference_id'] = int(reference_current)
                else:
                    list_of_posttranslationannotation_errors.append('Error in reference on row ' + str(index) + ', column ' + column)
                    continue


                if SEPARATOR in str(reference):
                    reference_new = str(row[COLUMNS['reference']]).split(SEPARATOR)[1]

                    if((reference_new, 'REFERENCE') in sgd_id_to_dbentity_id):
                        posttranslationannotation_update['reference_id'] = sgd_id_to_dbentity_id[(reference_new, 'REFERENCE')]
                    elif(reference_new in pubmed_id_to_reference):
                        posttranslationannotation_update['reference_id'] = pubmed_id_to_reference[reference_new]
                    elif(reference_new in reference_to_dbentity_id):
                        posttranslationannotation_update['reference_id'] = int(reference_new)
                    else:
                        list_of_posttranslationannotation_errors.append('Error in reference on row ' + str(index) + ', column ' + column)
                        continue

            
                column = COLUMNS['psimod']
                psimod = row[column]

                psimod_current = str(row[COLUMNS['psimod']]).upper().split(SEPARATOR)[0]
                if (psimod_current in psimod_to_id):
                    posttranslationannotation_existing['psimod_id'] = psimod_to_id[psimod_current]
                else:
                    list_of_posttranslationannotation_errors.append('Error in psimod ' + str(index) + ', column ' + column)
                    continue

                if SEPARATOR in psimod:
                    psimod_new = str(row[COLUMNS['psimod']]).upper().split(SEPARATOR)[1]
                    if (psimod_new in psimod_to_id):
                        posttranslationannotation_update['psimod_id'] = psimod_to_id[psimod_new]
                    else:
                        list_of_posttranslationannotation_errors.append('Error in psimod ' + str(index) + ', column ' + column)
                        continue
                
                column = COLUMNS['index']
                site_index = row[column]
                posttranslationannotation_existing['site_index'] = int(str(row[COLUMNS['index']]).split(SEPARATOR)[0])
                if SEPARATOR in str(site_index):
                    posttranslationannotation_update['site_index'] = int(str(row[COLUMNS['index']]).split(SEPARATOR)[1])

                column = COLUMNS['residue']
                residue = row[column]
                posttranslationannotation_existing['site_residue'] = str(row[COLUMNS['residue']]).split(SEPARATOR)[0]
                if SEPARATOR in residue:
                    posttranslationannotation_update['site_residue'] = str(row[COLUMNS['residue']]).split(SEPARATOR)[1]

                column = COLUMNS['modifier']
                modifier = row[column]
                if(pd.isnull(modifier)):
                    pass
                else:
                    modifier_current = str(row[COLUMNS['modifier']]).split(SEPARATOR)[0]

                    if((modifier_current, 'LOCUS') in sgd_id_to_dbentity_id):
                        posttranslationannotation_existing['modifier_id'] = sgd_id_to_dbentity_id[(modifier_current, 'LOCUS')]
                    elif((modifier_current, 'LOCUS') in systematic_name_to_dbentity_id):
                        posttranslationannotation_existing['modifier_id'] = systematic_name_to_dbentity_id[(modifier_current, 'LOCUS')]

                    if SEPARATOR in modifier:
                        modifier_new = str(row[COLUMNS['modifier']]).split(SEPARATOR)[1]
                        if((modifier_new, 'LOCUS') in sgd_id_to_dbentity_id):
                            posttranslationannotation_update['modifier_id'] = sgd_id_to_dbentity_id[(modifier_new, 'LOCUS')]
                        elif((modifier_new, 'LOCUS') in systematic_name_to_dbentity_id):
                            posttranslationannotation_update['modifier_id'] = systematic_name_to_dbentity_id[(modifier_new, 'LOCUS')]
                    
                list_of_posttranslationannotation.append((posttranslationannotation_existing,posttranslationannotation_update))
            
            except ValueError as e:
                list_of_posttranslationannotation_errors.append('Error in on row ' + str(index) + ', column ' + column + ', It is not a valid number.')
            except Exception as e:
                list_of_posttranslationannotation_errors.append('Error in on row ' + str(index) + ', column ' + column + ' ' + e.message)

        if list_of_posttranslationannotation_errors:
            err = [ e + '\n'  for e in list_of_posttranslationannotation_errors]
            return HTTPBadRequest(body=json.dumps({"error": list_of_posttranslationannotation_errors}), content_type='text/json')

        INSERT = 0
        UPDATE = 0
        curator_session = get_curator_session(request.session['username'])
        isSuccess = False
        returnValue = ''     
        
        if list_of_posttranslationannotation:
            for item in list_of_posttranslationannotation:    
                data,update_data = item
                if bool(update_data):
                    ptm_in_db = curator_session.query(Posttranslationannotation).filter(and_(
                        Posttranslationannotation.dbentity_id == data['dbentity_id'],
                        Posttranslationannotation.psimod_id == data['psimod_id'],
                        Posttranslationannotation.site_index == data['site_index'],
                        Posttranslationannotation.site_residue == data['site_residue'],
                        Posttranslationannotation.reference_id == data['reference_id'],
                        )).one_or_none()
                    if ptm_in_db is not None:
                        curator_session.query(Posttranslationannotation).filter(and_(
                            Posttranslationannotation.dbentity_id == data['dbentity_id'],
                            Posttranslationannotation.psimod_id == data['psimod_id'],
                            Posttranslationannotation.site_index == data['site_index'],
                            Posttranslationannotation.site_residue == data['site_residue'],
                            Posttranslationannotation.reference_id == data['reference_id'],
                        )).update(update_data)
                        UPDATE = UPDATE + 1
                else:
                    p = Posttranslationannotation(taxonomy_id=data['taxonomy_id'],
                                                    source_id=SOURCE_ID,
                                                    dbentity_id=data['dbentity_id'],
                                                    reference_id=data['reference_id'],
                                                    site_index=data['site_index'],
                                                    site_residue=data['site_residue'],
                                                    psimod_id=data['psimod_id'],
                                                    modifier_id = data['modifier_id'],
                                                    created_by=CREATED_BY)
                    curator_session.add(p)
                    INSERT = INSERT + 1
            
            try:
                transaction.commit()
                err = '\n'.join(list_of_posttranslationannotation_errors)
                isSuccess = True
                returnValue = 'Inserted: ' + str(INSERT) + ' Updated: ' + str(UPDATE) + ' Errors: ' + err
            except IntegrityError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Record already exisits for site index: ' + str(e.params['site_index']) + ' site residue: ' + e.params['site_residue'] + ' dbentity_id: ' + str(e.params['dbentity_id'])
            except DataError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Error, issue in data row with site index: ' + str(e.params['site_index']) + ' site residue: ' + e.params['site_residue'] + ' dbentity_id: ' + str(e.params['dbentity_id'])
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = e.message
            finally:
                if curator_session:
                    curator_session.close()
        
        if isSuccess:
            return HTTPOk(body=json.dumps({"success": returnValue}), content_type='text/json')
        
        return HTTPBadRequest(body=json.dumps({'error': returnValue}), content_type='text/json')


    except Exception as e:
        return HTTPBadRequest(body=json.dumps({ 'error': e.message }), content_type='text/json')


@view_config(route_name='ptm_by_gene',renderer='json',request_method='GET')
def ptm_by_gene(request):
    gene = str(request.matchdict['id'])

    if(gene is None):
        return HTTPBadRequest(body=json.dumps({'error': 'No gene provided'}), content_type='text/json')
    
    dbentity = None 
    dbentity = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid == gene,Dbentity.format_name == gene)).one_or_none()

    if dbentity is None:
        return HTTPBadRequest(body=json.dumps({'error': 'Gene not found in database'}), content_type='text/json')
    
    ptms = models_helper.get_all_ptms_by_dbentity(dbentity.dbentity_id)
    list_of_ptms = get_list_of_ptms(ptms)

    return HTTPOk(body=json.dumps({'ptms' :list_of_ptms}),content_type='text/json')

@view_config(route_name='get_strains', renderer='json', request_method='GET')
def get_strains(request):
    try:
        strains = models_helper.get_common_strains()
        
        if strains:
            return {'strains': [{'display_name':key,'taxonomy_id':value} for key,value in strains.items()]}

        return None

    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e)}))


@view_config(route_name='get_psimod', renderer='json', request_method='GET')
def get_psimod(request):
    try:
        psimods = models_helper.get_all_psimods()
        if psimods:
            distinct_psimod_ids = DBSession.query(Posttranslationannotation.psimod_id).distinct()
            psimods_in_use = psimods.filter(Psimod.psimod_id.in_(distinct_psimod_ids)).order_by(Psimod.display_name).all()
            psimods_not_in_use = psimods.filter(~Psimod.psimod_id.in_(distinct_psimod_ids)).order_by(Psimod.display_name).all()
            
            returnList = []
            for p in psimods_in_use:
                obj = {"psimod_id": p.psimod_id,
                       "format_name":p.format_name,
                       "display_name": p.display_name,
                       "inuse":True
                      }
                returnList.append(obj)
            
            for p in psimods_not_in_use:
                obj = {"psimod_id": p.psimod_id,
                       "format_name": p.format_name,
                       "display_name": p.display_name,
                       "inuse": False
                       }
                returnList.append(obj)

                
            return HTTPOk(body=json.dumps({'psimods': returnList}),content_type='text/json')

        return None
    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e)}))


@view_config(route_name="ptm_update", renderer='json', request_method='POST')
@authenticate
def ptm_update(request):
    try:
        id = int(request.params.get('id'))
        CREATED_BY = request.session['username']
        curator_session = get_curator_session(request.session['username'])
        source_id = 834

        dbentity_id = str(request.params.get('dbentity_id'))
        if not dbentity_id:
            return HTTPBadRequest(body=json.dumps({'error': "gene is blank"}), content_type='text/json')

        taxonomy_id = str(request.params.get('taxonomy_id'))
        if not taxonomy_id:
            return HTTPBadRequest(body=json.dumps({'error': "taxonomy is blank"}), content_type='text/json')
        taxonomy_id = int(taxonomy_id)

        reference_id = str(request.params.get('reference_id'))
        if not reference_id:
            return HTTPBadRequest(body=json.dumps({'error': "reference is blank"}), content_type='text/json')
        
        site_index = str(request.params.get('site_index'))
        if not site_index:
            return HTTPBadRequest(body=json.dumps({'error': "site index is blank"}), content_type='text/json')
        try:
            site_index = int(site_index)
        except:
            return HTTPBadRequest(body=json.dumps({'error': "site index should be number."}), content_type='text/json')
        
        site_residue = str(request.params.get('site_residue'))
        if len(site_residue) == 1 and site_residue in string.ascii_letters:
            site_residue = site_residue.upper()
        else:
            return HTTPBadRequest(body=json.dumps({'error': "site residue should be single letter."}), content_type='text/json')

        psimod_id = str(request.params.get('psimod_id'))
        if not psimod_id:
            return HTTPBadRequest(body=json.dumps({'error': "psimod is blank"}), content_type='text/json')
        psimod_id = int(psimod_id)
 
        modifier_id = str(request.params.get('modifier_id'))        

        dbentity_in_db = None
        dbentity_in_db = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid == dbentity_id,Dbentity.format_name == dbentity_id)).one_or_none()
        if dbentity_in_db is not None:
            dbentity_id = dbentity_in_db.dbentity_id
        else:
            return HTTPBadRequest(body=json.dumps({'error': "gene value not found in database"}), content_type='text/json')
            
        dbentity_in_db = None
        pmid_in_db = None
        dbentity_in_db = DBSession.query(Dbentity).filter(Dbentity.sgdid == reference_id).one_or_none()
        if dbentity_in_db is None:
            dbentity_in_db = DBSession.query(Dbentity).filter(Dbentity.dbentity_id == int(reference_id)).one_or_none()
        if dbentity_in_db is None:
            pmid_in_db = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == int(reference_id)).one_or_none()

        if dbentity_in_db is not None:
            reference_id = dbentity_in_db.dbentity_id
        elif (pmid_in_db is not None):
            reference_id = pmid_in_db.dbentity_id
        else:
            return HTTPBadRequest(body=json.dumps({'error': "reference value not found in database"}), content_type='text/json')
        
        if modifier_id: 
            dbentity_in_db = None
            dbentity_in_db = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid == modifier_id, Dbentity.format_name == modifier_id)).one_or_none()
            if dbentity_in_db is not None:
                modifier_id = dbentity_in_db.dbentity_id
            else:
                return HTTPBadRequest(body=json.dumps({'error': "Modifier value not found in database"}), content_type='text/json')
        else:
            modifier_id = None
        
        isSuccess = False
        returnValue = ''
        ptms_in_db = []

        if(int(id) > 0):
            try:
                update_ptm = {"dbentity_id": dbentity_id,
                              "source_id": source_id,
                              "taxonomy_id": taxonomy_id,
                              "reference_id": reference_id,
                              "site_index": site_index,
                              "site_residue": site_residue,
                              "psimod_id": psimod_id,
                              "modifier_id": modifier_id
                              }
                
                curator_session.query(Posttranslationannotation).filter(Posttranslationannotation.annotation_id == id).update(update_ptm)
                transaction.commit()
                isSuccess = True
                returnValue = 'Record updated successfully.'
                ptms = models_helper.get_all_ptms_by_dbentity(dbentity_id)
                ptms_in_db = get_list_of_ptms(ptms)
            except IntegrityError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Updated failed, record already exists' 
            except DataError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Update failed, issue in data'
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Updated failed ' + str(e.message)
            finally:
                if curator_session:
                    curator_session.close()
        
        if(int(id) == 0):
            try: 
                y = None
                y = Posttranslationannotation(taxonomy_id=taxonomy_id,
                                              source_id=source_id,
                                              dbentity_id=dbentity_id,
                                              reference_id=reference_id,
                                              site_index=site_index,
                                              site_residue=site_residue,
                                              psimod_id=psimod_id,
                                              modifier_id=modifier_id,
                                              created_by=CREATED_BY)
                curator_session.add(y)
                transaction.commit()
                isSuccess = True
                returnValue = 'Record added successfully.'
            except IntegrityError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Insert failed, record already exists'
            except DataError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Insert failed, issue in data'
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Insert failed' + ' ' + str(e.message)
            finally:
                if curator_session:
                    curator_session.close()

        if isSuccess:
            return HTTPOk(body=json.dumps({'success': returnValue, "ptms": ptms_in_db}), content_type='text/json')

        return HTTPBadRequest(body=json.dumps({'error': returnValue}), content_type='text/json')

    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e.message)}), content_type='text/json')


@view_config(route_name="ptm_delete", renderer='json', request_method='DELETE')
@authenticate
def ptm_delete(request):
    try:
        id = request.matchdict['id']
        curator_session = get_curator_session(request.session['username'])
        isSuccess = False
        returnValue = ''
        ptm_in_db = curator_session.query(Posttranslationannotation).filter(Posttranslationannotation.annotation_id == id).one_or_none()
        dbentity_id = ptm_in_db.dbentity_id
        ptms_in_db = []
        if(ptm_in_db):
            try:
                curator_session.delete(ptm_in_db)
                transaction.commit()
                isSuccess = True
                returnValue = 'Ptm successfully deleted.'
                ptms = models_helper.get_all_ptms_by_dbentity(dbentity_id)
                ptms_in_db = get_list_of_ptms(ptms)
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Error occurred deleting ptm: ' + str(e.message)
            finally:
                if curator_session:
                    curator_session.close()

            if isSuccess:
                return HTTPOk(body=json.dumps({'success': returnValue, 'ptms': ptms_in_db}), content_type='text/json')
            
            return HTTPBadRequest(body=json.dumps({'error': returnValue}), content_type='text/json')
        
        return HTTPBadRequest(body=json.dumps({'error': 'ptm not found in database.'}), content_type='text/json')

    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e.message)}), content_type='text/json')

@view_config(route_name='get_all_go_for_regulations',renderer='json',request_method='GET')
@authenticate
def get_all_go_for_regulations(request):
    go_in_db = models_helper.get_all_go()
    obj = [{'go_id': g.go_id, 'format_name': g.format_name,'display_name': g.display_name} for g in go_in_db]
    return HTTPOk(body=json.dumps({'success': obj}), content_type='text/json')


@view_config(route_name='get_all_eco_for_regulations', renderer='json', request_method='GET')
@authenticate
def get_all_eco_for_regulations(request):
    eco_in_db = models_helper.get_all_eco()
    obj = [{'eco_id':e.eco_id, 'format_name': e.format_name,'display_name':e.display_name} for e in eco_in_db]
    return HTTPOk(body=json.dumps({'success':obj}),content_type='text/json')


@view_config(route_name='regulation_insert_update', renderer='json', request_method='POST')
@authenticate
def regulation_insert_update(request):
    try:
        CREATED_BY = request.session['username']
        curator_session = get_curator_session(request.session['username'])
        source_id = 834
        MANUALLY_CURATED ='manually curated'

        annotation_id = request.params.get('annotation_id')

        target_id = request.params.get('target_id')
        if not target_id:
            return HTTPBadRequest(body=json.dumps({'error': "target gene is blank"}), content_type='text/json')

        regulator_id = request.params.get('regulator_id')
        if not regulator_id:
            return HTTPBadRequest(body=json.dumps({'error': "regulator gene is blank"}), content_type='text/json')

        taxonomy_id = request.params.get('taxonomy_id')
        if not taxonomy_id:
            return HTTPBadRequest(body=json.dumps({'error': "taxonomy is blank"}), content_type='text/json')
        
        reference_id = request.params.get('reference_id')
        if not reference_id:
            return HTTPBadRequest(body=json.dumps({'error': "reference is blank"}), content_type='text/json')

        eco_id = request.params.get('eco_id')
        if not eco_id:
            return HTTPBadRequest(body=json.dumps({'error': "eco is blank"}), content_type='text/json')
        
        regulator_type = request.params.get('regulator_type')
        if not regulator_type:
            return HTTPBadRequest(body=json.dumps({'error': "regulator type is blank"}), content_type='text/json')

        regulation_type = request.params.get('regulation_type')
        if not regulation_type:
            return HTTPBadRequest(body=json.dumps({'error': "regulation type is blank"}), content_type='text/json')

        direction = request.params.get('direction')
        if not direction:
            direction = None
        

        happens_during = request.params.get('happens_during')
        if not happens_during:
            happens_during = None

        annotation_type = MANUALLY_CURATED

        dbentity_in_db = None
        dbentity_in_db = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid == target_id, Dbentity.format_name == target_id)).filter(Dbentity.subclass == 'LOCUS').one_or_none()
        if dbentity_in_db is not None:
            target_id = dbentity_in_db.dbentity_id
        else:
            return HTTPBadRequest(body=json.dumps({'error': "target gene value not found in database"}), content_type='text/json')

        dbentity_in_db = None
        dbentity_in_db = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid == regulator_id, Dbentity.format_name == regulator_id)).filter(Dbentity.subclass == 'LOCUS').one_or_none()
        if dbentity_in_db is not None:
            regulator_id = dbentity_in_db.dbentity_id
        else:
            return HTTPBadRequest(body=json.dumps({'error': "regulator gene value not found in database"}), content_type='text/json')

        dbentity_in_db = None
        pmid_in_db = None
        dbentity_in_db = DBSession.query(Dbentity).filter(and_(Dbentity.sgdid == reference_id,Dbentity.subclass == 'REFERENCE')).one_or_none()
        if dbentity_in_db is None:
            try:
                dbentity_in_db = DBSession.query(Dbentity).filter(and_(Dbentity.dbentity_id == int(reference_id), Dbentity.subclass == 'REFERENCE')).one_or_none()
            except ValueError as e:
                pass
        if dbentity_in_db is None:
            try:
                pmid_in_db = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == int(reference_id)).one_or_none()
            except ValueError as e:
                pass

        if dbentity_in_db is not None:
            reference_id = dbentity_in_db.dbentity_id
        elif (pmid_in_db is not None):
            reference_id = pmid_in_db.dbentity_id
        else:
            return HTTPBadRequest(body=json.dumps({'error': "reference value not found in database"}), content_type='text/json')
        

        isSuccess = False
        returnValue = ''
        reference_in_db = None

        if(int(annotation_id) > 0):
            try:
                update_regulation = {'target_id': target_id,
                                    'regulator_id': regulator_id,
                                    'taxonomy_id': taxonomy_id,
                                    'reference_id': reference_id,
                                    'eco_id': eco_id,
                                    'regulator_type': regulator_type,
                                    'regulation_type': regulation_type,
                                    'direction': direction,
                                    'happens_during': happens_during,
                                    'annotation_type': annotation_type
                                    }

                curator_session.query(Regulationannotation).filter(Regulationannotation.annotation_id == annotation_id).update(update_regulation)
                transaction.commit()
                isSuccess = True
                returnValue = 'Record updated successfully.'

                regulation = curator_session.query(Regulationannotation).filter(Regulationannotation.annotation_id == annotation_id).one_or_none()
                reference_in_db = {
                    'id': regulation.annotation_id,
                    'target_id': {
                        'id': regulation.target.format_name,
                        'display_name': regulation.target.display_name
                    },
                    'regulator_id': {
                        'id': regulation.regulator.format_name,
                        'display_name': regulation.regulator.display_name
                    },
                    'taxonomy_id': '',
                    'reference_id': regulation.reference.pmid,
                    'eco_id': '',
                    'regulator_type': regulation.regulator_type,
                    'regulation_type': regulation.regulation_type,
                    'direction': regulation.direction,
                    'happens_during': '',
                    'annotation_type': regulation.annotation_type,
                }
                if regulation.eco:
                    reference_in_db['eco_id'] = str(regulation.eco.eco_id)

                if regulation.go:
                    reference_in_db['happens_during'] = str(regulation.go.go_id)

                if regulation.taxonomy:
                    reference_in_db['taxonomy_id'] = regulation.taxonomy.taxonomy_id

            except IntegrityError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Integrity Error: ' + str(e.orig.pgerror)
            except DataError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Data Error: ' + str(e.orig.pgerror)
            except InternalError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                error = str(e.orig).replace('_', ' ')
                error = error[0:error.index('.')]
                returnValue = 'Updated failed, ' + error
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Updated failed, ' + str(e)
            finally:
                if curator_session:
                    curator_session.close()

        
        if(int(annotation_id) == 0):
            try:
                y = None
                y = Regulationannotation(target_id = target_id,
                                    regulator_id = regulator_id,
                                    source_id = source_id,
                                    taxonomy_id = taxonomy_id,
                                    reference_id = reference_id,
                                    eco_id = eco_id,
                                    regulator_type = regulator_type,
                                    regulation_type = regulation_type,
                                    direction = direction,
                                    happens_during = happens_during,
                                    created_by = CREATED_BY,
                                    annotation_type = annotation_type)
                curator_session.add(y)
                transaction.commit()
                isSuccess = True
                returnValue = 'Record added successfully.'
            except IntegrityError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Integrity Error: ' + str(e.orig.pgerror)
            except DataError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Data Error: ' + str(e.orig.pgerror)
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Insert failed ' +str(e)
            finally:
                if curator_session:
                    curator_session.close()

        if isSuccess:
            return HTTPOk(body=json.dumps({'success': returnValue,'regulation':reference_in_db}), content_type='text/json')

        return HTTPBadRequest(body=json.dumps({'error': returnValue}), content_type='text/json')

    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e)}), content_type='text/json')


@view_config(route_name='regulations_by_filters',renderer='json',request_method='POST')
@authenticate
def regulations_by_filters(request):
    try:
        target_id = str(request.params.get('target_id')).strip()
        regulator_id = str(request.params.get('regulator_id')).strip()
        reference_id = str(request.params.get('reference_id')).strip()

        if not(target_id or regulator_id or reference_id):
            raise Exception("Please provide input for target gene, regulator gene, reference or combination to get the regulations.")

        regulations_in_db = DBSession.query(Regulationannotation)
        
        target_dbentity_id,regulator_dbentity_id,reference_dbentity_id = None,None,None

        if target_id:
            target_dbentity_id = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid==target_id, Dbentity.format_name==target_id)).one_or_none()

            if not target_dbentity_id:
                raise Exception('Target gene not found, please provide sgdid or systematic name')
            else:
                target_dbentity_id = target_dbentity_id.dbentity_id
                regulations_in_db = regulations_in_db.filter_by(target_id=target_dbentity_id)

        if regulator_id:
            regulator_dbentity_id = DBSession.query(Dbentity).filter(or_(Dbentity.sgdid == regulator_id,Dbentity.format_name== regulator_id)).one_or_none()

            if not regulator_dbentity_id:
                raise Exception('Regulator gene not found, please provide sgdid or systematic name')
            else:
                regulator_dbentity_id = regulator_dbentity_id.dbentity_id
                regulations_in_db = regulations_in_db.filter_by(regulator_id=regulator_dbentity_id)
        
        if reference_id:
            if reference_id.startswith('S00'):
                reference_dbentity_id = DBSession.query(Dbentity).filter(Dbentity.sgdid == reference_id).one_or_none()
            else:
                reference_dbentity_id = DBSession.query(Referencedbentity).filter(or_(Referencedbentity.pmid == int(reference_id),Referencedbentity.dbentity_id == int(reference_id))).one_or_none()
            
            if not reference_dbentity_id:
                raise Exception('Reference not found, please provide sgdid , pubmed id or reference number')
            else:
                reference_dbentity_id = reference_dbentity_id.dbentity_id
                regulations_in_db = regulations_in_db.filter_by(reference_id=reference_dbentity_id)
        
        regulations = regulations_in_db.options(joinedload(Regulationannotation.eco), joinedload(Regulationannotation.go), joinedload(Regulationannotation.taxonomy)
                                                , joinedload(Regulationannotation.reference), joinedload(Regulationannotation.regulator), joinedload(Regulationannotation.target)).order_by(Regulationannotation.annotation_id.asc()).all()
        
        list_of_regulations = []
        for regulation in regulations:
            currentRegulation = {
                'id': regulation.annotation_id,
                'target_id': {
                    'id': regulation.target.format_name,
                    'display_name': regulation.target.display_name
                },
                'regulator_id': {
                    'id': regulation.regulator.format_name,
                    'display_name': regulation.regulator.display_name
                },
                'taxonomy_id': '',
                'reference_id': regulation.reference.pmid,
                'eco_id': '',
                'regulator_type': regulation.regulator_type,
                'regulation_type': regulation.regulation_type,
                'direction': regulation.direction,
                'happens_during': '',
                'annotation_type': regulation.annotation_type,
            }

            if regulation.eco:
                currentRegulation['eco_id'] = str(regulation.eco.eco_id)

            if regulation.go:
                currentRegulation['happens_during'] = str(regulation.go.go_id)

            if regulation.taxonomy:
                currentRegulation['taxonomy_id'] = regulation.taxonomy.taxonomy_id

            list_of_regulations.append(currentRegulation)
        
        return HTTPOk(body=json.dumps({'success': list_of_regulations}), content_type='text/json')
    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': e.message}), content_type='text/json')


@view_config(route_name='regulation_delete',renderer='json',request_method='DELETE')
@authenticate
def regulation_delete(request):
    try:
        id = request.matchdict['id']
        curator_session = get_curator_session(request.session['username'])
        isSuccess = False
        returnValue = ''
        regulation_in_db = curator_session.query(Regulationannotation).filter(Regulationannotation.annotation_id == id).one_or_none()
        if(regulation_in_db):
            try:
                curator_session.delete(regulation_in_db)
                transaction.commit()
                isSuccess = True
                returnValue = 'Regulation successfully deleted.'
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Error occurred deleting regulation: ' + str(e.message)
            finally:
                if curator_session:
                    curator_session.close()

            if isSuccess:
                return HTTPOk(body=json.dumps({'success': returnValue}), content_type='text/json')

            return HTTPBadRequest(body=json.dumps({'error': returnValue}), content_type='text/json')

        return HTTPBadRequest(body=json.dumps({'error': 'regulation not found in database.'}), content_type='text/json')

    except Exception as e:
        return HTTPBadRequest(body=json.dumps({'error': str(e.message)}), content_type='text/json')

@view_config(route_name='regulation_file',renderer='json',request_method='POST')
@authenticate
def regulation_file(request):

    try:
        file = request.POST['file'].file
        filename = request.POST['file'].filename
        CREATED_BY = request.session['username']
        xl = pd.ExcelFile(file)
        list_of_sheets = xl.sheet_names

        COLUMNS = {
            'target': 'Target Gene',
            'regulator_gene':'Regulator Gene',
            'reference': 'Reference',
            'taxonomy': 'Taxonomy',
            'eco':'Eco',
            'regulator_type': 'Regulator type',
            'regulation_type':'Regulation type',
            'direction':'Direction',
            'happens_during':'Happens during',
            'annotation_type':'Annotation type'
        }

        SOURCE_ID = 834
        SEPARATOR = '|'
        HIGH_THROUGHPUT = 'high-throughput'

        list_of_regulations = []
        list_of_regulations_errors = []
        df = pd.read_excel(io=file, sheet_name="Sheet1")

        null_columns = df.columns[df.isnull().any()]
        for col in null_columns:
            if COLUMNS['direction'] != col and COLUMNS['happens_during'] !=col:
                rows = df[df[col].isnull()].index.tolist()
                rows = ','.join([str(r+2) for r in rows])
                list_of_regulations_errors.append('No values in column ' + col + ' rows ' + rows)
        
        if list_of_regulations_errors:
            err = [e + '\n' for e in list_of_regulations_errors]
            return HTTPBadRequest(body=json.dumps({"error": list_of_regulations_errors}), content_type='text/json')


        sgd_id_to_dbentity_id, systematic_name_to_dbentity_id = models_helper.get_dbentity_by_subclass(['LOCUS', 'REFERENCE'])
        strain_to_taxonomy_id = models_helper.get_common_strains()
        eco_displayname_to_id = models_helper.get_all_eco_mapping()
        happensduring_to_id = models_helper.get_all_go_mapping()
        pubmed_id_to_reference, reference_to_dbentity_id = models_helper.get_references_all()
        list_of_regulator_types = ['chromatin modifier','transcription factor','protein modifier','RNA-binding protein','RNA modifier']
        list_of_regulation_types = ['transcription','protein activity','protein stability','RNA activity','RNA stability']
        list_of_directions = ['positive','negative']

        for index_row,row in df.iterrows():
            index  = index_row + 2;
            column = ''
            try:
                regulation_existing = {
                    'target_id': '',
                    'regulator_id': '',
                    'source_id':SOURCE_ID,
                    'taxonomy_id': '',
                    'reference_id': '',
                    'eco_id': '',
                    'regulator_type': '',
                    'regulation_type': '',
                    'direction': None,
                    'happens_during': '',
                    'annotation_type': HIGH_THROUGHPUT
                }
                regulation_update = {
                    'annotation_type': HIGH_THROUGHPUT
                }

                column = COLUMNS['target']
                target = row[column]
                target_current = str(target.split(SEPARATOR)[0]).strip()
                key = (target_current,'LOCUS')
                if key in sgd_id_to_dbentity_id:
                    regulation_existing['target_id'] = sgd_id_to_dbentity_id[key]
                elif(key in systematic_name_to_dbentity_id):
                    regulation_existing['target_id'] = systematic_name_to_dbentity_id[key]
                else:
                    list_of_regulations_errors.append('Error in target gene on row ' + str(index)+ ', column ' + column)
                    continue
                                
                if SEPARATOR in target:
                    target_new = str(target.split(SEPARATOR)[1]).strip()
                    key = (target_new,'LOCUS')
                
                    if key in sgd_id_to_dbentity_id:
                        regulation_update['target_id'] = sgd_id_to_dbentity_id[key]
                    elif(key in systematic_name_to_dbentity_id):
                        regulation_update['target_id'] = systematic_name_to_dbentity_id[key]
                    else:
                        list_of_regulations_errors.append('Error in target gene on row ' + str(index)+ ', column ' + column)
                        continue
                
                column = COLUMNS['regulator_gene']
                regulator_gene = row[column]
                regulator_gene_current = str(regulator_gene.split(SEPARATOR)[0]).strip()
                key = (regulator_gene_current,'LOCUS')
                if key in sgd_id_to_dbentity_id:
                    regulation_existing['regulator_id'] = sgd_id_to_dbentity_id[key]
                elif(key in systematic_name_to_dbentity_id):
                    regulation_existing['regulator_id'] = systematic_name_to_dbentity_id[key]
                else:
                    list_of_regulations_errors.append('Error in regulator gene on row ' + str(index)+ ', column ' + column)
                    continue
                
                if SEPARATOR in regulator_gene:
                    regulator_gene_new = str(regulator_gene.split(SEPARATOR)[1]).strip()
                    key = (regulator_gene_new,'LOCUS')
                    if key in sgd_id_to_dbentity_id:
                        regulation_update['regulator_id'] = sgd_id_to_dbentity_id[key]
                    elif(key in systematic_name_to_dbentity_id):
                        regulation_update['regulator_id'] = systematic_name_to_dbentity_id[key]
                    else:
                        list_of_regulations_errors.append('Error in regulator gene on row ' + str(index)+ ', column ' + column)
                        continue
                
                column = COLUMNS['reference']
                reference = row[column]
                reference_current = str(reference).split(SEPARATOR)[0]
                key = (reference_current,'REFERENCE')
                if(key in sgd_id_to_dbentity_id):
                    regulation_existing['reference_id'] = sgd_id_to_dbentity_id[key]
                elif(reference_current in pubmed_id_to_reference):
                    regulation_existing['reference_id'] = pubmed_id_to_reference[reference_current]
                elif(reference_current in reference_to_dbentity_id):
                    regulation_existing['reference_id'] = int(reference_current)
                else:
                    list_of_regulations_errors.append('Error in reference on row ' + str(index) + ', column ' + column)
                    continue
                
                if SEPARATOR in str(reference):
                    reference_new = str(reference).split(SEPARATOR)[1]
                    key = (reference_new,'REFERENCE')
                    if(key in sgd_id_to_dbentity_id):
                        regulation_update['reference_id'] = sgd_id_to_dbentity_id[key]
                    elif(reference_new in pubmed_id_to_reference):
                        regulation_update['reference_id'] = pubmed_id_to_reference[reference_new]
                    elif(reference_new in reference_to_dbentity_id):
                        regulation_update['reference_id'] = int(reference_new)
                    else:
                        list_of_regulations_errors.append('Error in reference on row ' + str(index) + ', column ' + column)
                        continue
                 
                column = COLUMNS['taxonomy']
                taxonomy = row[column]
                taxonomy_current = str(taxonomy).upper().split(SEPARATOR)[0]
                if taxonomy_current in strain_to_taxonomy_id:
                    regulation_existing['taxonomy_id'] = strain_to_taxonomy_id[taxonomy_current]
                else:
                    list_of_regulations_errors.append('Error in taxonomy on row ' + str(index) + ', column ' + column)
                    continue
                
                if SEPARATOR in taxonomy:
                    taxonomy_new = str(taxonomy).upper().split(SEPARATOR)[1]
                    if taxonomy_new in strain_to_taxonomy_id:
                        regulation_update['taxonomy_id'] = strain_to_taxonomy_id[taxonomy_new]
                    else:
                        list_of_regulations_errors.append('Error in taxonomy on row ' + str(index) + ', column ' + column)
                        continue
                    
                column = COLUMNS['eco']
                eco = row[column]
                eco_current = str(eco).split(SEPARATOR)[0]
                if eco_current in eco_displayname_to_id:
                    regulation_existing['eco_id'] = eco_displayname_to_id[eco_current]
                else:
                    list_of_regulations_errors.append('Error in eco on row ' + str(index) + ', column ' + column)
                    continue
                
                if SEPARATOR in eco:
                    eco_new = str(eco).split(SEPARATOR)[1]
                    if eco_new in eco_displayname_to_id:
                        regulation_update['eco_id'] = eco_displayname_to_id[eco_new]
                    else:
                        list_of_regulations_errors.append('Error in eco on row ' + str(index) + ', column ' + column)
                        continue
                    

                column = COLUMNS['regulator_type']
                regulator_type = row[column]
                regulator_type_current = str(regulator_type).split(SEPARATOR)[0]
                if regulator_type_current in list_of_regulator_types:
                    regulation_existing['regulator_type'] = regulator_type_current
                else:
                    list_of_regulations_errors.append('Error in regulator type on row ' + str(index) + ', column ' + column)
                    continue
                
                if SEPARATOR in regulator_type:
                    regulator_type_new = str(regulator_type).split(SEPARATOR)[1]
                    if regulator_type_new in list_of_regulator_types:
                        regulation_update['regulator_type'] = regulator_type_new
                    else:
                        list_of_regulations_errors.append('Error in regulator type on row ' + str(index) + ', column ' + column)
                        continue
                    
                column = COLUMNS['regulation_type']
                regulation_type = row[column]
                regulation_type_current = str(regulation_type).split(SEPARATOR)[0]
                if regulation_type_current in list_of_regulation_types:
                    regulation_existing['regulation_type'] = regulation_type_current
                else:
                    list_of_regulations_errors.append('Error in regulation type on row ' + str(index) + ', column ' + column)
                    continue
                
                if SEPARATOR in regulation_type:
                    regulation_type_new = str(regulation_type).split(SEPARATOR)[1]
                    if regulation_type_new in list_of_regulation_types:
                        regulation_update['regulation_type'] = regulation_type_new
                    else:
                        list_of_regulations_errors.append('Error in regulation type on row ' + str(index) + ', column ' + column)
                        continue
                
                column = COLUMNS['direction']
                direction = row[column]
                direction_current = None if pd.isnull(direction) else None if not str(direction).split(SEPARATOR)[0] else str(direction).split(SEPARATOR)[0]
                if direction_current and direction_current not in list_of_directions:
                    list_of_regulations_errors.append('Error in direction on row ' + str(index) + ', column ' + column)
                    continue
                else:
                    regulation_existing['direction'] = direction_current

                if not pd.isnull(direction) and SEPARATOR in direction:
                    direction_new = None if pd.isnull(direction) else None if not str(direction).split(SEPARATOR)[1] else str(direction).split(SEPARATOR)[1]
                    if direction_new and direction_new not in list_of_directions:
                        list_of_regulations_errors.append('Error in direction on row ' + str(index) + ', column ' + column)
                        continue
                    else:
                        regulation_update['direction'] = direction_new
                        
                column = COLUMNS['happens_during']
                happens_during = row[column]
                happens_during_current = None if pd.isnull(happens_during) else None if not str(happens_during).split(SEPARATOR)[0] else str(happens_during).split(SEPARATOR)[0]
                if happens_during_current and happens_during_current not in happensduring_to_id:
                    list_of_regulations_errors.append('Error in direction on row ' + str(index) + ', column ' + column)
                else:
                    regulation_existing['happens_during'] = None if happens_during_current == None else happensduring_to_id[happens_during_current]
                
                if not pd.isnull(happens_during) and SEPARATOR in happens_during:
                    happens_during_new = None if pd.isnull(happens_during) else None if not str(happens_during).split(SEPARATOR)[1] else str(happens_during).split(SEPARATOR)[1]
                    if happens_during_new and happens_during_new not in happensduring_to_id:
                        list_of_regulations_errors.append('Error in happens during on row ' + str(index) + ', column ' + column)
                    else:
                        regulation_update['happens_during'] = None if happens_during_new == None else  happensduring_to_id[happens_during_new]


                list_of_regulations.append([regulation_existing,regulation_update])
            
            except Exception as e:
                list_of_regulations_errors.append('Error in on row ' + str(index) + ', column ' + column + ' ' + e.message)
        

        if list_of_regulations_errors:
            err = [e + '\n' for e in list_of_regulations_errors]
            return HTTPBadRequest(body=json.dumps({"error":list_of_regulations_errors}),content_type='text/json')
        
        INSERT = 0
        UPDATE = 0
        curator_session = get_curator_session(request.session['username'])
        isSuccess = False
        returnValue = ''
        
        if list_of_regulations:
            for item in list_of_regulations:
                regulation,update_regulation = item
                if (len(update_regulation)>1):
                    regulation_in_db = curator_session.query(Regulationannotation).filter(and_(
                        Regulationannotation.target_id == regulation['target_id'],
                        Regulationannotation.regulator_id == regulation['regulator_id'],
                        Regulationannotation.taxonomy_id == regulation['taxonomy_id'],
                        Regulationannotation.reference_id == regulation['reference_id'],
                        Regulationannotation.eco_id == regulation['eco_id'],
                        Regulationannotation.regulator_type == regulation['regulator_type'],
                        Regulationannotation.regulation_type == regulation['regulation_type'],
                        Regulationannotation.happens_during == regulation['happens_during']
                        )).one_or_none()
                    if regulation_in_db is not None:
                        curator_session.query(Regulationannotation).filter(and_(
                        Regulationannotation.target_id == regulation['target_id'],
                        Regulationannotation.regulator_id == regulation['regulator_id'],
                        Regulationannotation.taxonomy_id == regulation['taxonomy_id'],
                        Regulationannotation.reference_id == regulation['reference_id'],
                        Regulationannotation.eco_id == regulation['eco_id'],
                        Regulationannotation.regulator_type == regulation['regulator_type'],
                        Regulationannotation.regulation_type == regulation['regulation_type'],
                        Regulationannotation.happens_during == regulation['happens_during']
                        )).update(update_regulation)
                        UPDATE  = UPDATE + 1

                else:    
                    r = Regulationannotation(
                        target_id = regulation['target_id'],
                        regulator_id = regulation['regulator_id'], 
                        source_id = SOURCE_ID,
                        taxonomy_id = regulation['taxonomy_id'],
                        reference_id = regulation['reference_id'], 
                        eco_id = regulation['eco_id'],
                        regulator_type = regulation['regulator_type'],
                        regulation_type= regulation['regulation_type'],
                        direction = regulation['direction'],
                        happens_during = regulation['happens_during'],
                        created_by = CREATED_BY,
                        annotation_type = regulation['annotation_type']
                    )
                    curator_session.add(r)
                    INSERT = INSERT + 1
            
            try:
                transaction.commit()
                err = '\n'.join(list_of_regulations_errors)
                isSuccess = True    
                returnValue = 'Inserted:  ' + str(INSERT) + ' <br />Updated: ' + str(UPDATE) + '<br />Errors: ' + err
            except IntegrityError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Integrity Error: '+str(e.orig.pgerror)
            except DataError as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = 'Data Error: '+str(e.orig.pgerror)
            except Exception as e:
                transaction.abort()
                if curator_session:
                    curator_session.rollback()
                isSuccess = False
                returnValue = str(e)
            finally:
                if curator_session:
                    curator_session.close()
        
        if isSuccess:
            return HTTPOk(body=json.dumps({"success": returnValue}), content_type='text/json')
        
        return HTTPBadRequest(body=json.dumps({'error': returnValue}), content_type='text/json')    

    except Exception as e:
        return HTTPBadRequest(body=json.dumps({"error":str(e)}),content_type='text/json')


@view_config(route_name='upload_file_curate', renderer='json', request_method='POST')
def upload_file_curate(request):
    try:
        if not check_csrf_token(request, raises=False):
            return HTTPBadRequest(body=json.dumps({'error': 'Bad CSRF Token'}))
        obj = {
            'file': request.POST['file'].file,
            'file_name': request.POST['file'].filename,
            'status': request.POST['status'],
            'display_name': request.POST['displayName'],
            'keywords': request.POST['genomeVariation'],
            'previous_filename': request.POST['previousFileName'],
            'description': request.POST['description']
        }
        file_curate_update_readme(obj)

    except Exception as e:
        pass

    return {}


@view_config(route_name="get_file", renderer='json', request_method='GET')
@authenticate
def get_file(request):
    ''' Get file data '''
    try:
        dname = request.matchdict['name']
        if dname:
            return get_file_details(dname)
        return None
    except Exception as e:
         return HTTPBadRequest(body=json.dumps({'error': str(e.message)}), content_type='text/json')


@view_config(route_name="upload_tar_file", renderer='json', request_method='POST')
@authenticate
def upload_tar_file(request):
    ''' Upload tar files containing zip/sra file with README file '''
    try:
        obj = {}
        for key, val in request.POST.items():
            if type(cgi.FieldStorage()) is type(val):
                obj[val.name] = val.file
            else:
                obj[key] = val

        obj['uname'] = request.session['username']
        obj['source_id'] = SGD_SOURCE_ID
        return upload_new_file(obj)
    except Exception as e:
         return HTTPBadRequest(body=json.dumps({'error': str(e)}), content_type='text/json')


@view_config(route_name="file_curate_menus", renderer='json', request_method='GET')
def file_curate_menus(request):

    return get_file_curate_dropdown_data()