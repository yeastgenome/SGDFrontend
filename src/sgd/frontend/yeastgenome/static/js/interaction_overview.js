if(interaction_overview != null) {
    if(interaction_overview['num_gen_interactors'] + interaction_overview['num_phys_interactors'] > 0){
        var r = interaction_overview['gen_circle_size'];
        var s = interaction_overview['phys_circle_size'];
        var x = interaction_overview['circle_distance'];
        var A = interaction_overview['num_gen_interactors'];
        var B = interaction_overview['num_phys_interactors'];
        var C = interaction_overview['num_both_interactors'];

        //Colors chosen as colorblind safe from http://colorbrewer2.org/.
        var stage = draw_venn_diagram("venn_diagram", r, s, x, A, B, C, "#572d15", "#d78759");
    }
    else {
        document.getElementById("interaction_summary_message").style.display = "block";
        document.getElementById("interaction_summary_wrapper").style.display = "none";
    }
}