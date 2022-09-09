var clicked = 1;
function zoom() {
        if (clicked == 3) {
            clicked = 1;
        }
        else {
            clicked = 3;
        }
        zoomOut(clicked)
}

function zoomOut(count) {
        var image = document.getElementById('strucImg');
        var src = image.src;
        image.src = src.substring(0, src.indexOf('dimensions=')) + 'dimensions=' + (200 * count);
        image.style.display = "block";
}

