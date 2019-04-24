import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import NewsLetterForm from './newsletterform';


class NewsLetter extends Component{
  constructor(props){
    super(props);
  }

  render(){
    return(
      <CurateLayout>
          <NewsLetterForm />
      </CurateLayout>
    );
  }
}

export default NewsLetter ;