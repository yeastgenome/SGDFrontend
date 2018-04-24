import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  'togglable': {
    'color': '#D78770',
    'cursor': 'pointer'
  },
  'togglable-down::after': {
    'fontSize': [{ 'unit': 'px', 'value': NaN }],
    'marginLeft': [{ 'unit': 'em', 'value': NaN }]
  },
  'togglable-up::after': {
    'fontSize': [{ 'unit': 'px', 'value': NaN }],
    'marginLeft': [{ 'unit': 'em', 'value': NaN }]
  },
  'togglable-down::after': {
    'content': '▼',
    'display': 'inline-block'
  },
  'togglable-up::after': {
    'content': '▶',
    'display': 'inline-block'
  }
});
