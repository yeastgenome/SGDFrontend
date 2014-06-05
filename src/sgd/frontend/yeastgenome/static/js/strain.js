/**
 * Created by kpaskov on 5/30/14.
 */

$(document).ready(function() {
    document.getElementById("summary_paragraph").innerHTML = paragraph['text'];
    set_up_references(paragraph['references'], "summary_paragraph_reference_list");
});
