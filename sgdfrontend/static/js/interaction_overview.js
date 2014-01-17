
if(data['num_gen_interactors'] + data['num_phys_interactors'] > 0){
  	var r = data['gen_circle_size'];
    var s = data['phys_circle_size'];
	var x = data['circle_distance'];

	//Colors chosen as colorblind safe from http://colorbrewer2.org/.
	var stage = draw_venn_diagram("venn_diagram", r, s, x, A, B, C, "#762A83", "#1B7837");
	document.getElementById("download_overview").onclick = function() {
		download_image(stage, 450, 300, download_image_link, summary_download_filename);
	};
	document.getElementById("download_overview").removeAttribute('disabled');

}
else {
  	document.getElementById("summary_message").style.display = "block";
  	document.getElementById("summary_wrapper").style.display = "none";
}