class MockQueryFilter(object):
    def __init__(self, query_params, query_result):
        self._return = query_result
        self._params = query_params

    def one_or_none(self):
        return self._return

    def first(self):
        return self._return

    def order_by(self, *args, **kwargs):
        return self

    def all(self):
        if self._return is None:
            return []
        elif self._return.__class__ == list:
            return self._return
        else:
            return [self._return]

    def query_params(self):
        return self._params
    

class MockQuery(object):
    def __init__(self, query_result):
        self._query_result = query_result

    def filter_by(self, **query_params):
        self._query_filter = MockQueryFilter(query_params, self._query_result)
        self._full_params = query_params
        return self._query_filter

    def filter(self, *query_params):
        self._query_filter = MockQueryFilter(query_params[0], self._query_result)
        self._full_params = query_params
        return self._query_filter

    def all(self):
        return self._query_result


class MockFileStorage(object):
    pass
