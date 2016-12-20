import { createSelector } from 'reselect';

export const selectLitDomain = (state) => state.lit;
export const selectRoutingDomain = (state) => state.routing;

export const selectCurrentSection = (state) => {
  let routing = selectRoutingDomain(state);
  let id = selectActiveLitId(state);
  let baseUrl = `/curate_literature/${id}/`;
  let path = routing.locationBeforeTransitions.pathname;
  let section = path.replace(baseUrl, '');
  return section;
};

export const selectActiveLitEntry = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('activeLitEntry').toJS()
);

export const selectActiveLitId = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('activeLitEntry').toJS().id
);

export const selectTriageEntries = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('triageEntries').toJS()
);

export const selectActiveEntries = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('activeEntries').toJS()
);

export const selectUsers = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('allCuratorUsers').toJS()
);
