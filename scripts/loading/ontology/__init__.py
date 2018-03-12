__author__ = 'sweng66'

def read_obo(filename):

    f = open(filename, 'r')
    start_ontology = 0
    data = []
    parents = []
    # other_parents = []
    aliases = []
    term = None
    id = None
    # namespace = None
    definition = None
    is_obsolete = 0
    
    for line in f:
        line = line.strip()
        if line == '[Term]' or line == '[Typedef]':
            if term is not None and id is not None and is_obsolete == 0:
                data.append({ 'term': term.replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">"),
                              'id': id,
                              'aliases': aliases,
                              'parents': parents,
                              'definition': definition})
            term = None
            id = None
            aliases = []
            parents = []
            definition = None
            is_obsolete = 0
            continue
        if line.startswith('is_obsolete: true'):
            is_obsolete = 1
            continue

        pieces = line.split(': ')
        if len(pieces) >= 2:
            if pieces[0] == 'id':
                id = pieces[1].strip()
            elif pieces[0] == 'name':
                term = pieces[1].strip()
            elif pieces[0] == 'synonym':
                synonym_items = pieces[1].split('"')
                alias = synonym_items[1].replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">")
                alias_type = synonym_items[2].strip().split(' ')[0]
                aliases.append((alias, alias_type))
            elif pieces[0] == 'def':
                defline = pieces[1]
                if len(pieces) > 2:
                    pieces.pop(0)
                    defline = ": ".join(pieces)
                quotation_split = defline.split('" [')
                definition = quotation_split[0][1:]
                definition = definition.replace("\\", "")
            elif pieces[0] == 'is_a':
                parent = pieces[1].split(' ! ')[0]
                parents.append(parent)

    f.close()

    return data

def read_data_file(filename):
    
    f = open(filename)

    data = []
    aliases = []
    alias = ''
    entry = {}
    
    for line in f:
        if line.startswith("//") and entry.get('id'):
            # new entry
            entry['description'] = entry['description'].rstrip('.')
            entry['aliases'] = aliases
            data.append(entry)
            aliases = []
            alias = ''
            entry = {}
            continue
        field = line.split('   ')
        if field[0] not in ['ID', 'DE', 'AN']:
            continue
        field[1] = field[1].rstrip()
        if field[0] == 'ID' and 'n' not in field[1]:
            entry['id'] = field[1]
        if entry.get('id') and field[0] == 'DE':
            if entry.get('description'):
                entry['description'] = entry['description'] + " " + field[1]
            else:
                entry['description'] = field[1]
        if entry.get('id') and field[0] == 'AN':
            if alias:
                alias = alias + " " + field[1]
            else:
                alias = field[1]
            if alias.endswith('.'):
                aliases.append(alias.rstrip('.'))
                alias = ''

    return data


def children_for_taxonomy_ancestor(filename, ancestor):

    f = open(filename, 'r')
    child = ''
    parent_to_children = {}
    id_to_rank = {}

    for line in f:

        # <owl:Class rdf:about="http://purl.obolibrary.org/obo/NCBITaxon_100000">
        if "<owl:Class rdf:about=" in line:
            pieces = line.split('>')[0].split('/')
            child = pieces.pop().replace('"', '').replace('_', ':')

        # <rdfs:subClassOf rdf:resource="http://purl.obolibrary.org/obo/NCBITaxon_963"/>
        if "<rdfs:subClassOf rdf:resource=" in line:
            pieces = line.split('/>')[0].split('/')
            parent = pieces.pop().replace('"', '').replace('_', ':')
            if parent not in parent_to_children:
                parent_to_children[parent] = []
            parent_to_children[parent].append(child)
        
        # <ncbitaxon:has_rank rdf:resource="http://purl.obolibrary.org/obo/NCBITaxon_species"/>
        if "<ncbitaxon:has_rank rdf:resource=" in line:
            pieces = line.split('/>')[0].split('/')
            rank = pieces.pop().replace('"', '').replace("NCBITaxon_/", "")
            id_to_rank[child] = rank
     
    # do breadth first search of parent_to_children 
    # populate filtered_parent_set                                                      

    filtered_parent_set = []
    working_set = []
    working_set.append(ancestor)
    filtered_id_to_rank = {}
    while len(working_set) > 0:
        current = working_set[0]
        working_set = working_set[1:]
        filtered_parent_set.append(current)
        filtered_id_to_rank[current] = id_to_rank.get(current)
        if current in parent_to_children:
            for child in parent_to_children[current]:
                if child not in filtered_parent_set:
                    working_set.append(child)

    return [filtered_parent_set, filtered_id_to_rank]


def read_owl(filename, ontology, is_sgd_term=None):

    f = open(filename, 'r')
    start_ontology = 0
    data = []
    parents = []
    other_parents = []
    aliases = []
    term = None
    id = None
    namespace = None
    definition = None
    is_obsolete_id = 0
    subclassStart = 0
    parentRo = None
    parentId = None
    ignore_section_start = 0

    # <owl:Class rdf:about="http://edamontology.org/data_0006"> 
    # <owl:AnnotationProperty rdf:about="http://purl.obolibrary.org/obo/RO_0002161"> 
    # <owl:ObjectProperty rdf:about="http://purl.obolibrary.org/obo/RO_0000301">
    # <owl:ObjectProperty rdf:about="http://purl.obolibrary.org/obo/BFO_0000054"><!-- realized in --> 
    term_start_tags = ['<owl:Class rdf:about=', 
                       '<owl:AnnotationProperty rdf:about=',
                       '<owl:ObjectProperty rdf:about', 
                       '<owl:NamedIndividual rdf:about=',
                       '<owl:DatatypeProperty rdf:about=',
                       '<owl:Thing rdf:about=']
    term_stop_tags = ['</owl:Class>',
                      '</owl:AnnotationProperty>',
                      '</owl:ObjectProperty>',
                      '</owl:NamedIndividual>',
                      '</owl:DatatypeProperty>',
                      '</owl:Thing>']
    for line in f:
        line = line.strip()        
        for term_start_tag in term_start_tags:
            if term_start_tag in line:
                pieces = line.split('>')[0].split('/')
                if ontology == 'EDAM':
                    # id = pieces.pop().replace('"', '').split('_')[1]
                    id_field = pieces.pop().replace('"', '')
                    if "_" in id_field:
                        namespace_id = id_field.split('_')
                        namespace = namespace_id[0]
                        if namespace not in ['format', 'data', 'operation', 'topic']:
                            id = None
                            continue
                        id = ontology + ":" + namespace_id[1]
                    else:
                        id = None
                        continue
                else: 
                    id = pieces.pop().replace('"', '').replace('_', ':')

                if id is not None and "#" in id:
                    id = None
                    continue
                if ontology == 'GO' and 'GO:' not in id:
                    id = None
                    continue

                # print "LINE=", line, "ID=", id

                start_ontology = 1
                break
            
        if "<owl:equivalentClass>" in line or (ontology != 'GO' and "<rdfs:subClassOf>" in line):
            ignore_section_start = 1
            
        if "</owl:equivalentClass>" in line and ignore_section_start == 1:
            ignore_section_start = 0
        if ontology != 'GO' and "</rdfs:subClassOf>" in line and ignore_section_start == 1:
            ignore_section_start = 0

        if ignore_section_start == 1:
            if "<owl:onProperty rdf:resource=" in line:
                pieces = line.replace('/>', '').split('/')
                parentRo = pieces.pop().replace('"', '').replace('_', ':')
                if "<!--" in parentRo:
                    parentRo = parentRo.split("<!")[0]
            elif "<owl:someValuesFrom rdf:resource=" in line:
                pieces = line.replace('/>', '').split('/')
                parentId = pieces.pop().replace('"', '').replace('_', ':')
                if "<!--" in parentId:
                    parentId = parentId.split("<!")[0]
                if (parentId, parentRo) not in other_parents:
                    other_parents.append((parentId, parentRo))
                parentRo = None
                parentId = None
            continue

        if start_ontology == 1:
            for term_stop_tag in term_stop_tags:
                if term_stop_tag in line:
                    if is_obsolete_id == 0 and id is not None and term is not None:
                        data.append({ "term": term.replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">"),
                                      "id": id,
                                      "namespace": namespace,
                                      "definition": definition,
                                      "parents": parents,
                                      "other_parents": other_parents,
                                      "aliases": aliases })
                  
                    parents = []
                    other_parents = []
                    aliases = []
                    term = None
                    id = None
                    namespace = None
                    definition = None
                    is_obsolete_id = 0
                    subclassStart = 0
                    parentRo = None
                    parentId = None
                    ignore_section_start = 0

                    break

        # <rdfs:subClassOf rdf:resource="http://purl.obolibrary.org/obo/GO_0048308"/>   
        # <rdfs:subPropertyOf rdf:resource="http://purl.obolibrary.org/obo/RO_0002172"/>
        # <rdfs:subClassOf>
        #    <owl:Restriction>
        #        <owl:onProperty rdf:resource="http://purl.obolibrary.org/obo/RO_0002211"/>
        #        <owl:someValuesFrom rdf:resource="http://purl.obolibrary.org/obo/GO_0009790"/>
        #    </owl:Restriction>
        # </rdfs:subClassOf>

        if id is not None and '_' in line and ('<rdfs:subClassOf rdf:resource=' in line or '<rdfs:subPropertyOf rdf:resource=' in line):
            pieces = line.replace('/>', '').split('/')
            if ontology == 'EDAM':
                parent_id = pieces.pop().replace('"', '').split('_')[1]
                parent_id = ontology + ":" + parent_id
            else:
                parent_id = pieces.pop().replace('"', '').replace('_', ':')
            if "<!--" in parent_id:
                parent_id = parent_id.split("<!")[0]
            parents.append(parent_id)

        if id is not None and "<rdfs:subClassOf>" in line:
            subclassStart = 1
            continue

        # <owl:onProperty rdf:resource="http://purl.obolibrary.org/obo/RO_0002211"/>
        if id is not None and subclassStart == 1 and "<owl:onProperty rdf:resource=" in line:
            pieces = line.replace('/>', '').split('/')
            parentRo = pieces.pop().replace('"', '').replace('_', ':')
            if "<!--" in parentRo:
                parentRo = parentRo.split("<!")[0]
            continue

        # <owl:someValuesFrom rdf:resource="http://purl.obolibrary.org/obo/GO_0009790"/>
        if id is not None and subclassStart == 1 and "<owl:someValuesFrom rdf:resource=" in line:
            pieces = line.replace('/>', '').split('/')
            parentId = pieces.pop().replace('"', '').replace('_', ':')
            if "<!--" in parentId:
                parentId = parentId.split("<!")[0]
            continue
        
        # </rdfs:subClassOf>
        if id is not None and "</rdfs:subClassOf>" in line and subclassStart == 1 and parentId is not None:
            if (parentId, parentRo) not in other_parents:
                other_parents.append((parentId, parentRo))
            subclassStart = 0
            parentRo = None
            parentId = None

        # <rdfs:label rdf:datatype="http://www.w3.org/2001/XMLSchema#string">mitochondrion inheritance</rdfs:label> 
        # <rdfs:label rdf:datatype="http://www.w3.org/2001/XMLSchema#string">never in taxon</rdfs:label>              
        if '<rdfs:label' in line:
            term = line.split('>')[1].split('<')[0].strip().replace('_', ' ').replace("&apos;", "'")
            if '#' in term:
                term = None
            
        # <oboInOwl:hasExactSynonym rdf:datatype="http://www.w3.org/2001/XMLSchema#string">mitochondrial inheritance</oboInOwl:hasExactSynonym>                                                                   
        # <oboInOwl:hasExactSynonym>has active substance</oboInOwl:hasExactSynonym>
        if 'ExactSynonym' in line or 'BroadSynonym' in line or 'NarrowSynonym' in line or 'RelatedSynonym' in line:
            alias_name = line.split('>')[1].split('<')[0]
            alias_type = line.split('Synonym')[0].replace('<oboInOwl:has', '')
            alias_type = alias_type.upper()
            if alias_name == '':
                # print "ALIAS LINE: ", line                                                                                      
                # print "ALIAS TYPE: ", alias_type
                # print "ALIAS NAME: ", alias_name     
                continue
            alias_name = alias_name.replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">")
            aliases.append((alias_name, alias_type))

        # <oboInOwl:hasOBONamespace rdf:datatype="http://www.w3.org/2001/XMLSchema#string">biological_process</oboInOwl:hasOBONamespace>                                                                            
        if ontology != 'EDAM' and '<oboInOwl:hasOBONamespace' in line:
            namespace = line.split('>')[1].split('<')[0]

        # <obo:IAO_0000115 rdf:datatype="http://www.w3.org/2001/XMLSchema#string">The distribution of mitochondria, including the mitochondrial genome, into daughter cells after mitosis or meiosis, mediated by interactions between mitochondria and the cytoskeleton.</obo:IAO_0000115> ## go.owl
        # <obo:IAO_0000115>x never in taxon T if and only if T is a class, and x does not instantiate the class expression &quot;in taxon some T&quot;. Note that this is a shortcut relation, and should be used as a hasValue restriction in OWL.</obo:IAO_0000115>
        # <oboInOwl:hasDefinition>The design of an experiment involving non-human animals.</oboInOwl:hasDefinition>               
        if '<obo:IAO_0000115' in line or '<oboInOwl:hasDefinition' in line:
            definition = line.split('>')[1].split('<')[0]


        # <owl:deprecated rdf:datatype="http://www.w3.org/2001/XMLSchema#boolean">true</owl:deprecated>                  
        # <owl:deprecated>true</owl:deprecated>

        if 'obsolete_since' in line or '<owl:deprecated' in line:
            is_obsolete_id = 1
        if ontology == 'APO' and '<oboInOwl:inSubset rdf:resource=' in line and '#SGD' in line and is_sgd_term is not None:
            is_sgd_term[id] = 1
        elif ontology == 'CHEBI' and '<oboInOwl:inSubset rdf:resource=' in line and '#3_STAR' in line and is_sgd_term is not None:
            is_sgd_term[id] = 1

    f.close()

    return data


