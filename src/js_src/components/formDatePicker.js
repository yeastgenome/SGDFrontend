import React, {Component} from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { DateUtils } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import dateFnsFormat from 'date-fns/format';
import dateFnsParse from 'date-fns/parse';

const DEFAULT_FORMAT = 'M/D/YYYY';

/* eslint-disable no-debugger */
class FormDatePicker extends Component{
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);

  }

  handleChange(date) {
    this.setState({startDate: date});
  }

  render(){
    return (
        <div>
          <DayPickerInput
            formatDate={formatDate}
            format={DEFAULT_FORMAT}
            parseDate={parseDate}
            placeholder={`${dateFnsFormat(new Date(), DEFAULT_FORMAT)}`}
          />
        </div>
    );
  }
}

function parseDate(str, format, locale) {
  const parsed = dateFnsParse(str, format, { locale });
  if (DateUtils.isDate(parsed)){
    return parsed;
  }
  return undefined;
}

function formatDate(date, format, locale){
  return dateFnsFormat(date, format, {locale});
}

export default FormDatePicker;
