from oauth2client import client, crypt
from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound, HTTPFound
from pyramid.view import view_config
from pyramid.session import check_csrf_token
from sqlalchemy import create_engine, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import scoped_session, sessionmaker
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

from .helpers import allowed_file, extract_id_request, secure_save_file, curator_or_none, extract_references, extract_keywords, get_or_create_filepath, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file, FILE_EXTENSIONS, get_locus_by_id, get_go_by_id
from .curation_helpers import ban_from_cache, process_pmid_list, get_curator_session, get_pusher_client, validate_orcid
from .loading.promote_reference_triage import add_paper
from .models import DBSession, Dbentity, Dbuser, CuratorActivity, Colleague, Colleaguetriage, LocusnoteReference, Referencedbentity, Reservedname, ReservednameTriage, Straindbentity, Literatureannotation, Referencetriage, Referencedeleted, Locusdbentity, CurationReference, Locussummary, validate_tags, convert_space_separated_pmids_to_list
from .tsv_parser import parse_tsv_annotations

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)
log = logging.getLogger()

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
    return { 'username': request.session['username'] }

@view_config(route_name='get_locus_curate', request_method='GET', renderer='json')
@authenticate
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
        repeat_pmids = [x for x, count in collections.Counter(int_pmids).items() if count > 1]
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
            new_ref = add_paper(pmid, username)
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
    except Exception, e:
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
            DBSession.delete(triage)
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
@authenticate
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
        return { 'username': session['username'] }
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
@authenticate
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
    except Exception, e:
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')

@view_config(route_name='get_recent_annotations', request_method='GET', renderer='json')
@authenticate
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
    if 'authors' in data.keys():
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
    colleague = DBSession.query(Colleague).filter(Colleague.colleague_id == req_id).one_or_none()
    if not colleague:
        return HTTPNotFound()
    # add colleague triage entry
    try:
        is_changed = False
        old_dict = colleague.to_simple_dict()
        for x in old_dict.keys():
            if old_dict[x] != data[x]:
                is_changed = True
        if is_changed:
            existing_triage = DBSession.query(Colleaguetriage).filter(Colleaguetriage.colleague_id == req_id).one_or_none()
            if existing_triage:
                existing_triage.json = json.dumps(data)
            else:
                new_c_triage = Colleaguetriage(
                    colleague_id = req_id,
                    json=json.dumps(data),
                    triage_type='Update',
                )
                DBSession.add(new_c_triage)
            transaction.commit()
            return { 'colleague_id': req_id }
        else:
            return { 'colleague_id': req_id }
    except Exception as e:
        traceback.print_exc()
        transaction.abort()
        log.error(e)
        return HTTPBadRequest(body=json.dumps({ 'message': str(e) }), content_type='text/json')

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
@authenticate
def colleague_triage_index(request):
    c_triages = DBSession.query(Colleaguetriage).all()
    return [x.to_dict() for x in c_triages]

@view_config(route_name='colleague_triage_show', renderer='json', request_method='GET')
@authenticate
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
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))
    curator_session = None
    try:
        username = request.session['username']
        curator_session = get_curator_session(username)
        req_id = int(request.matchdict['id'])
        params = request.json_body
        c_triage = curator_session.query(Colleaguetriage).filter(Colleaguetriage.curation_id == req_id).one_or_none()
        if not c_triage:
            return HTTPNotFound()
        colleague = curator_session.query(Colleague).filter(Colleague.colleague_id == c_triage.colleague_id).one_or_none()
        colleague.first_name = params.get('first_name')
        colleague.last_name = params.get('last_name')
        colleague.orcid = params.get('orcid')
        colleague.email = params.get('email')
        colleague.display_email = params.get('display_email')
        colleague.is_contact = params.get('receive_quarterly_newsletter')
        colleague.is_beta_tester = params.get('willing_to_be_beta_tester')
        colleague.is_in_triage = False
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
