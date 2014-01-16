document.getElementById("primary_header").innerHTML = data['primary'].length;
set_up_references(data['primary'], "primary_list");
if (data['primary'].length == 0) {
	document.getElementById("primary_message").style.display = "block";
  	document.getElementById("primary_wrapper").style.display = "none";
}
document.getElementById("export_primary").onclick = function f() {
	download_citations("primary_list", download_link, display_name + "_primary_citations")
};