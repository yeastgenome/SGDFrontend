
function draw_venn_diagram(container_name, r, s, x) {
	var zoom = 1;
	if(r > s) {
		zoom = 1.0/r;
	}
	else {
		zoom = 1.0/s;
	}
	
	var stage = new Kinetic.Stage({
		container: container_name,
		draggable: false,
		width:500,
		height:250
	});	
	
	var layer = new Kinetic.Layer();
	
	var physical_circle = new Kinetic.Circle({
		x: 100,
		y: 150,
		radius: 100*s*zoom,
        fill: "red",
        opacity: 0.5
	});
    layer.add(physical_circle);
    
    var genetic_circle = new Kinetic.Circle({
		x: 100+100*x*zoom,
		y: 150,
		radius: 100*r*zoom,
        fill: "blue",
        opacity: 0.5
	});
    layer.add(genetic_circle);
    
    var physical_label = new Kinetic.Text({
        x: 70,
        y: 125-(100*s*zoom),
        text: 'Physical',
        fontSize: 20,
        fontFamily: 'Calibri',
        fill: 'black'
        });
    layer.add(physical_label);
        
    var genetic_label = new Kinetic.Text({
        x: 70+100*x*zoom,
        y: 125-(100*r*zoom),
        text: 'Genetic',
        fontSize: 20,
        fontFamily: 'Calibri',
        fill: 'black'
        });
    layer.add(genetic_label);
        
    stage.add(layer);

	return stage;
}



