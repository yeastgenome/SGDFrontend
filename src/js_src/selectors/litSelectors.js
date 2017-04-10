import { createSelector } from 'reselect';

export const selectLitDomain = (state) => state.lit;
export const selectRoutingDomain = (state) => state.routing;

export const selectActiveLitEntry = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('activeLitEntry').toJS()
);

export const selectHasData = createSelector(
  [selectActiveLitEntry],
  (d) => (Object.keys(d).length > 0)
);

export const selectTriageEntries = createSelector(
  [selectLitDomain],
  (litDomain) => litDomain.get('triageEntries').toJS()
);
