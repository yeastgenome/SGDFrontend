class MockQueryFilter(object):
    def __init__(self, query_result):
        self._return = query_result

    def one_or_none(self):
        return self._return

    def first(self):
        return self._return
    

class MockQuery(object):
    def __init__(self, query_result):
        self._query_result = query_result

    def filter(self, query_result):
        return MockQueryFilter(self._query_result)


class MockFileStorage(object):
    pass
