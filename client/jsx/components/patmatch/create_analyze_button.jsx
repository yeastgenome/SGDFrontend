var React = require('react');

// http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
function post_to_url(path, params) {
  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  var form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', path);

  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      var hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', params[key]);

      form.appendChild(hiddenField);
    }
  }
  document.body.appendChild(form);
  form.submit();
}

// Function to trigger the file download
function download_file(url) {
  var link = document.createElement('a');
  var filename = '';
  link.href = url;
  link.setAttribute('download', filename);
  link.click();
}

export function download_analyze_buttons(downloadUrl, analyze_genes) {
  const handleDownload = () => {
    download_file(downloadUrl);
  };

  const handleAnalyze = () => {
    post_to_url('/analyze', {
      list_name: 'PatMatch Gene List',
      bioent_ids: JSON.stringify(analyze_genes),
    });
  };

  if (analyze_genes.length < 2) {
    return (
      <button className="small button secondary" onClick={handleDownload}>
        <i className="fa fa-download"></i> Download Full Results
      </button>
    );
  }

  return (
    <ul className="button-group radius">
      <li>
        <button className="small button secondary" onClick={handleDownload}>
          <i className="fa fa-download"></i> Download Full Results
        </button>
      </li>
      <li>&nbsp; &nbsp;</li>
      <li>
        <button
          id="patmatch_gene_analyze"
          className="small button secondary"
          onClick={handleAnalyze}
        >
          <i className="fa fa-briefcase"></i> Analyze Gene List
        </button>
      </li>
    </ul>
  );
}
