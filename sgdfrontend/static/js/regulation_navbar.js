add_navbar_title('<a href="' + link + '">' + display_name + '/' + format_name + '</a> Regulation');
add_navbar_element('Regulation Summary', 'summary');
if(target_count > 0) {
    add_navbar_element('Domains and Classification', 'domains');
    add_navbar_element('DNA Binding Site Motifs', 'binding');
  	add_navbar_element('Targets', 'targets');
  	add_navbar_element('Shared GO Processes Among Targets', 'enrichment');
}
if(regulator_count > 0) {
    add_navbar_element('Regulators', 'regulators');
}
if(target_count + regulator_count > 0) {
    add_navbar_element('Network Visualization', 'network');
}