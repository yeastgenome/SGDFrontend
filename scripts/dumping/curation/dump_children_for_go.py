import sys
from src.models import Go, GoRelation
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

def dump_data(goid):
 
    nex_session = get_session()

    go_id_to_go = dict([(x.go_id, (x.goid, x.display_name)) for x in nex_session.query(Go).all()])

    goObj = nex_session.query(Go).filter_by(goid=goid).one_or_none()

    if goObj is None:
        print("The goid:", goid, " is not in the database.")
        return

    go_id = goObj.go_id

    parent_to_children = {}
    for x in nex_session.query(GoRelation).all():
        children = []
        if x.parent_id in parent_to_children:
            children = parent_to_children[x.parent_id]
        children.append(x.child_id)
        parent_to_children[x.parent_id] = children

    output_children(go_id, parent_to_children, go_id_to_go)

    nex_session.close()


def output_children(go_id, parent_to_children, go_id_to_go):
    if go_id not in parent_to_children:
        return
    for this_go_id in parent_to_children[go_id]:
        (goid, term) = go_id_to_go[this_go_id]
        print(goid + "\t" + term)
        output_children(this_go_id, parent_to_children, go_id_to_go)

if __name__ == '__main__':

    if len(sys.argv) >= 2:
        goid = sys.argv[1]
        dump_data(goid)
    else:
        print("Usage:         python dump_children_for_go.py goid")
        print("Usage example: python dump_children_for_go.py GO:0002057")
        exit()

    


