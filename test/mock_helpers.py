class MockQueryFilter(object):
    def __init__(self, query_params, query_result):
        self._return = query_result
        self._params = query_params

    def one_or_none(self):
        return self._return

    def first(self):
        return self._return

    def query_params(self):
        return self._params
    

class MockQuery(object):
    def __init__(self, query_result):
        self._query_result = query_result

    def filter(self, query_params):
        self._query_filter = MockQueryFilter(query_params, self._query_result)
        return self._query_filter


class MockFileStorage(object):
    pass
