// Viewport dimension.
var width;
var height;

// Canvases and contexts.
var mainCanvas;
var mainCtx;
var protractorCanvas;
var proCtx;

var gridImage;

// Screen metrics.
var dpix;
var dpiy;
var screenWidthMM;
var pixelWidth;
var pixelsOnMM;

// Center of the protractor circle
var ptxcenter;
var ptycenter;

// Radius of protractor arcs.
var outerarcr;
var innerarcr;

// Measured values
var measuredLength = -1;
var measuredAngleRadians = -1;

// Mouse states.
var mouseDown = false;
var touchX = -1;
var touchY = -1;

/*
  Sets the onresize handler event handler and initializes canvases.
*/
function init() {
    gridImage = new Image();
    gridImage.src = "images/papergrid.png";
    
    window.onresize = initCanvas;
  
    initCanvas();
}

/*
  Initializes the canvases. The protractor is pre-drawn into a separate canvas to
  speed up the rendering.
*/
function initCanvas() {
    width = document.body.offsetWidth;
    height = document.body.offsetHeight;
    
    mainCanvas = document.getElementById('canvas');
    mainCanvas.width = width;
    mainCanvas.height = height;

    dpix = document.getElementById("dpi").offsetWidth;
    dpiy = document.getElementById("dpi").offsetHeight;
    
    //screenWidthMM = 25.4 / 98.33 * width;
    screenWidthMM = 25.4 / dpix * width; 
    
    pixelWidth = screenWidthMM / width;
    pixelsOnMM = 1 / pixelWidth;
    
    ptxcenter = width / 2;
    ptycenter = width / 7;
    outerarcr = width * 0.45;
    innerarcr = outerarcr * 0.6;
    
    mainCanvas.addEventListener('mousedown', ev_mouseDown, false);
    mainCanvas.addEventListener('mousemove', ev_mouseMove, false);
    mainCanvas.addEventListener('mouseup', ev_mouseUp, false);

    protractorCanvas = document.createElement('canvas');
    protractorCanvas.style.display = "none";
    protractorCanvas.width = width;
    protractorCanvas.height = height;
    proCtx = protractorCanvas.getContext('2d');
        
    mainCtx = mainCanvas.getContext('2d');
        
    drawProtractor(proCtx);
    draw();
}


/*
  Draws the pre-rendered protractor and the measurement lines.
*/
function draw() {
    mainCtx.drawImage(protractorCanvas, 0, 0);
    drawMarkers(mainCtx);
}


/*
  Draws the protactor to the given context.
*/
function drawProtractor(context) {
    var gridPattern = context.createPattern(gridImage, "repeat");

    // Clear the canvas with paper grid pattern
    context.fillStyle = gridPattern;
    context.fillRect(0, 0, width, height);

    context.lineWidth = 1.0;
    context.strokeStyle = "#000000";

    // Draw the protractor beginning from upper right corner.
    context.beginPath();
    context.moveTo(width, 0);
    context.lineTo(width, ptycenter);
    context.lineTo(ptxcenter + outerarcr, ptycenter);

    context.arc(ptxcenter, ptycenter, outerarcr, 0 * Math.PI, Math.PI);

    context.lineTo(0, ptycenter);
    context.lineTo(0, 0);
    context.lineTo(width, 0);

    context.closePath();

    // Fill the protractor with gradient
    var gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#999999");
    gradient.addColorStop(1, "#BBBBBB");
    context.fillStyle = gradient;
    context.fill();
    context.stroke();

    // Draw the inside of the protractor with paper grid.
    context.beginPath();

    context.moveTo(ptxcenter + innerarcr, ptycenter);
    context.arc(ptxcenter, ptycenter, innerarcr, 0 * Math.PI, Math.PI);
    context.lineTo(ptxcenter + innerarcr, ptycenter);

    context.fillStyle = gridPattern;
    context.fill();

    // Draw center marker
    context.moveTo(ptxcenter, ptycenter - 4);
    context.lineTo(ptxcenter, ptycenter + 4);

    // Draw the scale of the ruler
    var pixels = 0;
    var mms = 0;

    context.textAlign = "center";

    while (pixels < width + 1) {
        // Draw centimeter lines
        if (mms % 10 == 0) {
            context.moveTo(pixels, 0);
            context.lineTo(pixels, 30);
            context.fillText(mms / 10, pixels, 45);
        }
        // Draw half centimeter lines
        else if (mms % 5 == 0) {
            context.moveTo(pixels, 0);
            context.lineTo(pixels, 22);
        }
        // Draw millimeter lines
        else if (mms % 1 == 0) {
            context.moveTo(pixels, 0);
            context.lineTo(pixels, 15);
        }
        
        pixels += pixelsOnMM * 1;
        mms += 1;
    }

    context.fillText("mm", 14, 32);
    context.stroke();

    // Draw the scale of the protractor.
    var radians

    for (var i=0; i<=36; i++) {
        radians = i * 5 / 180 * Math.PI;

        var cosX = Math.cos(radians);
        var sinY = Math.sin(radians);
        var r1;
        var r2;
        
        if (i % 2) {
            r1 = outerarcr * 0.95;
            r2 = outerarcr * 0.99;
            context.moveTo(r1 * cosX + ptxcenter, r1 * sinY + ptycenter);
            context.lineTo(r2 * cosX + ptxcenter, r2 * sinY + ptycenter);
        }
        else {
            r1 = outerarcr * 0.90;
            r2 = outerarcr * 0.99;
            var rtext = outerarcr * 0.85;
            context.moveTo(r1 * cosX + ptxcenter, r1 * sinY + ptycenter);
            context.lineTo(r2 * cosX + ptxcenter, r2 * sinY + ptycenter);
            context.fillText(180 - i * 5, rtext * cosX + ptxcenter, rtext * sinY + ptycenter + 4);
        }
    }

    context.stroke();
}


/*
  Draws the markers to the given context.
*/
function drawMarkers(context) {
    // Draw the length measure line
    context.beginPath();

    context.strokeStyle = "#FF0000";

    // Draw the first length line
    if (touchX >= 0) {
        context.moveTo(touchX, 0);
        context.lineTo(touchX, height);
    }

    // Draw the angle measure line
    if (measuredAngleRadians >= 0) {
        var lineX = outerarcr * Math.cos(measuredAngleRadians);
        var lineY = outerarcr * Math.sin(measuredAngleRadians);

        context.moveTo(ptxcenter, ptycenter);
        context.lineTo(ptxcenter - lineX, ptycenter + lineY);

        lineX = 30 * Math.cos(measuredAngleRadians);
        lineY = 30 * Math.sin(measuredAngleRadians);

        context.moveTo(ptxcenter - lineX, ptycenter + lineY);
        context.arc(ptxcenter, ptycenter, 30,
                    Math.PI - measuredAngleRadians, Math.PI);
    }

    context.stroke();


    // Draw the Angle and measure texts
    context.fillStyle = "black";
    context.textAlign = "center";

    if (measuredAngleRadians >= 0) {
        context.fillText("Angle: " + (measuredAngleRadians / Math.PI * 180).toFixed(1) + "°",
                         width / 2,
                         innerarcr * 0.5 + ptycenter);
    }

    if (measuredLength >= 0) {
        context.fillText("Measure width: " +
                         measuredLength.toFixed(1) + " mm",
                         width / 2,
                         innerarcr * 0.5 + ptycenter - 20);
    }

    context.textAlign = "left";
    context.fillText("Screen width: " + screenWidthMM.toFixed(1) + " mm   DPI: " + dpix + "x" + dpiy,
                     5, height - 5);
}


/*
  Calculates the width and angle of the tap on the screen. The tap / mouse position
  is retrieved from the event.
*/
function calculateMeasurements(ev) {
    measuredLength = touchX / pixelsOnMM;

    if (touchY < ptycenter) {
        measuredAngleRadians = -1;
    }
    else {
        if (touchX < width / 2) {
            measuredAngleRadians = Math.atan((touchY - ptycenter) / (ptxcenter - touchX));
        }
        else {
            measuredAngleRadians = Math.PI - (Math.atan((touchY - ptycenter) / (touchX - ptxcenter)));
        }
    }
}


/*
  Mouse down event handler.
*/
function ev_mouseDown(ev) {
    mouseDown = true;

    touchX = ev.offsetX;
    touchY = ev.offsetY;
    
    calculateMeasurements();
   
    draw();
}


/*
  Mouse move event handler.
*/
function ev_mouseMove(ev) {
    if (mouseDown) {
        touchX = ev.offsetX;
        touchY = ev.offsetY;
    
        calculateMeasurements();
    
        draw();
    }
}


/*
  Mouse move event handler.
*/
function ev_mouseUp(ev) {
    mouseDown = false;
}