// References for a list of PubMed IDs (/reference/getReferences?id=pmids). The
// rows are rendered server-side from the injected `references` var; here we set
// the header count and wire the citation download.
$(document).ready(function () {
    var refs = (typeof references !== 'undefined' && references) ? references : [];
    set_up_header("references", refs.length, 'reference', 'references');

    var reference_ids = [];
    for (var i = 0; i < refs.length; i++) {
        reference_ids.push(refs[i]['id']);
    }

    if (refs.length === 0) {
        $("#references_list_empty_message").show();
        $("#references_list_wrapper").hide();
    }

    $("#references_list_download").click(function () {
        post_to_url('/download_citations', { "display_name": "citations", "reference_ids": reference_ids });
    });
});
