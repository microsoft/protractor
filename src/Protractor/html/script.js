// Viewport dimension.
var width;
var height;

// Canvases and contexts.
var mainCanvas;
var mainCtx;
var protractorCanvas;
var proCtx;

// Graphics.
var gridImage;
var settingsImage;

// Config
var inConfig = false;
var useMM = true;    // use millimeters or inches
var buttonWidth = 100;
var buttonHeight = 75;
var buttonDownX = 450;
var buttonDownY = 220;
var buttonUpX = buttonDownX + buttonWidth + 20;
var buttonUpY = buttonDownY;
var buttonUseMMX = buttonDownX;
var buttonUseMMY = 320;

// Screen metrics.
var dpix;
var dpiy;
var screenWidthMM = 81;
var pixelWidth;
var pixelsOnMM;

// Center of the protractor circle.
var ptxcenter;
var ptycenter;

// Radius of protractor arcs.
var outerarcr;
var innerarcr;

// Measured values.
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
    gridImage.src = "papergrid.png";

	settingsImage = new Image();
	settingsImage.src = "settings.png";
    
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
    mainCanvas.addEventListener('mousedown', ev_mouseDown, false);
    mainCanvas.addEventListener('mousemove', ev_mouseMove, false);
    mainCanvas.addEventListener('mouseup', ev_mouseUp, false);
    mainCtx = mainCanvas.getContext('2d');

    protractorCanvas = document.createElement('canvas');
    protractorCanvas.style.display = "none";
    protractorCanvas.width = width;
    protractorCanvas.height = height;
    proCtx = protractorCanvas.getContext('2d');

    dpix = document.getElementById("dpi").offsetWidth;
    dpiy = document.getElementById("dpi").offsetHeight;
    
    ptxcenter = width / 2;
    ptycenter = width / 7;
    outerarcr = width * 0.45;
    innerarcr = outerarcr * 0.6;

    drawProtractor(proCtx);
    draw();
}


/*
  Draws the pre-rendered protractor and the measurement lines or pre-rendered protractor
  and the config screen.
*/
function draw() {
    mainCtx.drawImage(protractorCanvas, 0, 0);
    if (inConfig) {
		drawConfig(mainCtx);
	}
	else {
		drawMarkers(mainCtx);
	}
}


/*
  Draws the protactor to the given context.
*/
function drawProtractor(context) {
    pixelWidth = screenWidthMM / width;
    pixelsOnMM = 1 / pixelWidth;

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

    context.textAlign = "center";
    context.fillStyle = "#FFFFFF";
	context.font = "10pt Arial";

	var unit = 0;

	if (useMM) {
		while (pixels < width + 1) {
			// Draw centimeter lines
			if (unit % 10 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 33);
				context.fillText(unit / 10, pixels, 47);
			}
			// Draw half centimeter lines
			else if (unit % 5 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 25);
			}
			// Draw millimeter lines
			else if (unit % 1 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 16);
			}

			pixels += pixelsOnMM;
			unit++;
		}
	
		context.fillText("mm", 16, 32);
	}
	else {
		while (pixels < width + 1) {
			// Draw inch lines
			if (unit % 16 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 33);
				context.fillText(unit / 16, pixels, 47);
			}
			// Draw half inch lines
			else if (unit % 8 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 25);
			}
			// Draw quarter inch lines
			else if (unit % 4 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 16);
			}
			else if (unit % 2 == 0) {
				context.moveTo(pixels, 0);
				context.lineTo(pixels, 10);
			}

			pixels += pixelsOnMM * 25.4 / 16;
			unit++;
		}
	
		context.fillText("inches", 24, 32);
	}

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

	context.drawImage(settingsImage, 10, height - 74);
}


/*
  Draws the markers to the given context.
*/
function drawMarkers(context) {
    // Draw the length measure line
    context.beginPath();

    context.strokeStyle = "#FF0000";

    // Draw the first length line
    if (measuredLength >= 0) {
        context.moveTo(measuredLength * pixelsOnMM, 0);
        context.lineTo(measuredLength * pixelsOnMM, height);
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
	context.font = "16pt Arial";

    if (measuredAngleRadians >= 0) {
        context.fillText("Angle: " + (measuredAngleRadians / Math.PI * 180).toFixed(1) + "°",
                         width / 2,
                         innerarcr * 0.5 + ptycenter + 20);
    }

    if (measuredLength >= 0) {
		if (useMM) {
	       context.fillText("Measure width: " + measuredLength.toFixed(1) + " mm",
		                     width / 2,
							 innerarcr * 0.5 + ptycenter - 20);
		}
		else {
			context.fillText("Measure width: " + (measuredLength / 25.4).toFixed(2) + "\"",
		                     width / 2,
							 innerarcr * 0.5 + ptycenter - 20);
		}
    }
}


/*
  Draws the config screen.
*/
function drawConfig(context) {
	context.globalAlpha = 0.5;
	context.fillStyle = "#333333";
	context.fillRect(0, 0, width, height);
	
	context.globalAlpha = 1.0;
	context.fillStyle = "#FFFFFF";
	context.fillRect(100, 40, 600, 400);

    context.fillStyle = "#000000";
	context.textAlign = "left";
	context.font = "18pt Arial";

	context.fillText("Settings", 120, 75);

	context.fillText("Set the screen width to adjust the ruler scale.", 160, 160);

	if (useMM) {
		context.fillText("Screen width: " + screenWidthMM.toFixed(1) + " mm", 160, buttonUpY + 43);
		context.fillText("Set length unit: mm", 160, buttonUseMMY + buttonHeight / 2);
	}
	else {
		context.fillText("Screen width: " + (screenWidthMM / 25.4).toFixed(2) + " inch", 160, buttonUpY + 43);
		context.fillText("Set length unit: inch", 160, buttonUseMMY + buttonHeight / 2);
	}



	context.fillStyle = "#888888";
	context.textAlign = "center";
	context.fillRect(buttonUpX, buttonUpY, buttonWidth, buttonHeight);
	context.fillRect(buttonDownX, buttonDownY, buttonWidth, buttonHeight);
	context.fillRect(buttonUseMMX, buttonUseMMY, buttonWidth, buttonHeight);

	context.fillStyle = "#FFFFFF";
	context.fillText("+", buttonUpX + buttonWidth / 2, buttonUpY + buttonHeight / 2 + 5);
	context.fillText("-", buttonDownX + buttonWidth / 2, buttonDownY + buttonHeight / 2 + 5);
	context.fillText("Toggle", buttonUseMMX + buttonWidth / 2, buttonUseMMY + buttonHeight / 2 + 5);
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
	
	touchX = ev.clientX;
    touchY = ev.clientY;
    
	if (touchX < 80 && touchY > 400) {
		inConfig = !inConfig;
	}
	else if (inConfig) {
		if (touchX > buttonUpX && touchX < buttonUpX + buttonWidth && touchY > buttonUpY && touchY < buttonUpY + buttonHeight) {
			screenWidthMM += 0.5;
			drawProtractor(proCtx);
		}
		else if (touchX > buttonDownX && touchX < buttonDownX + buttonWidth && touchY > buttonDownY && touchY < buttonDownY + buttonHeight) {
			if (screenWidthMM <= 40) {
				screenWidthMM = 40;
			}
			else {
				screenWidthMM -= 0.5;
			}

			drawProtractor(proCtx);
		}
		else if (touchX > buttonUseMMX && touchX < buttonUseMMX + buttonWidth && touchY > buttonUseMMY && touchY < buttonUseMMY + buttonHeight) {
			useMM = !useMM;

			drawProtractor(proCtx);
		}
	}
	else {
		calculateMeasurements();
	}

	draw();
}


/*
  Mouse move event handler.
*/
function ev_mouseMove(ev) {
    if (mouseDown) {
        touchX = ev.clientX;
        touchY = ev.clientY;
    
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
