import React, {Component} from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { DateUtils } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import dateFnsFormat from 'date-fns/format';
import dateFnsParse from 'date-fns/parse';
import PropTypes from 'prop-types';

const DEFAULT_FORMAT = 'M/D/YYYY';

class FormDatePicker extends Component{
  constructor(props){
    super(props);

  }

  render(){
    return (
        <div>
          <DayPickerInput
            id='rPicker'
            formatDate={formatDate}
            format={DEFAULT_FORMAT}
            parseDate={parseDate}
            placeholder={`${dateFnsFormat(new Date(), DEFAULT_FORMAT)}`}
            onDayChange={this.props.onDateChange}
            selectedDay={this.props.date}
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

FormDatePicker.propTypes = {
  onDateChange: PropTypes.func,
  date: PropTypes.string
};

export default FormDatePicker;
