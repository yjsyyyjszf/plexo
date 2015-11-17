/**
*  Plexo
*  Created by Diego Cantor 
*  (c) 2015 onwards
*/


//@koala-append "definitions.js"
//@koala-append "LabelSet.js"
//@koala-append "Brush.js"
//@koala-append "Eraser.js"
//@koala-append "Slice.js"
//@koala-append "Dataset.js"
//@koala-append "AnnotationLayer.js"
//@koala-append "PaintBucket.js"
//@koala-append "Zoom.js"
//@koala-append "AnnotationSet.js"
//@koala-append "Renderer.js"
//@koala-append "View.js"
//@koala-append "ViewInteractor.js"



var plx = plx || {};

plx.PI2         = Math.PI * 2;
plx.COORDINATES = {X: 0, Y: 0};
plx.GUI_TOUCH   = false;
plx.BRUSH       = undefined;
plx.ERASER      = undefined;
plx.LABELS      = undefined;

/*-----------------------------------------------------------------------------------------------
 Operations
 ------------------------------------------------------------------------------------------------*/
plx.OP_ANNOTATE     = 'plx-op-annotate';
plx.OP_DELETE       = 'plx-op-delete';
plx.OP_EROSION      = 'plx-op-erosion';
plx.OP_PAINT_BUCKET = 'plx-op-paint-bucket';
plx.OP_ZOOM         = 'plx-op-zoom';
plx.OP_PANNING      = 'plx-op-panning';
plx.OP_NONE         = 'plx-op-none';

plx.CURRENT_OPERATION = plx.OP_NONE;

plx.setCurrentOperation = function (operation) {

    plx.CURRENT_OPERATION = operation;
    console.debug('set operation: ' + plx.CURRENT_OPERATION);
};

plx.setCurrentCoordinates = function (x, y) {
    plx.COORDINATES.X = x;
    plx.COORDINATES.Y = y;
}
/*-----------------------------------------------------------------------------------------------
 EVENTS
 ------------------------------------------------------------------------------------------------*/
plx.EV_SLICE_CHANGED     = 'plx-ev-slice-changed';
plx.EV_COORDS_UPDATED    = 'plx-ev-coords-updated';
plx.EV_OPERATION_CHANGED = 'plx-ev-op-changed';

/*-----------------------------------------------------------------------------------------------
 Utilities
 ------------------------------------------------------------------------------------------------*/

plx.hex2rgb = function (hex) {
    hex   = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return {'r': r, 'g': g, 'b': b};
}

plx.rgb2hex = function (R, G, B) {
    function toHex(n) {
        n = parseInt(n, 10);
        if (isNaN(n)) {
            return "00";
        }
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - n % 16) / 16)
            + "0123456789ABCDEF".charAt(n % 16);
    }

    return '#' + toHex(R) + toHex(G) + toHex(B);
};

plx.smoothingEnabled = function (ctx, flag) {
    ctx.imageSmoothingEnabled       = flag;
    ctx.mozImageSmoothingEnabled    = flag;
    ctx.webkitImageSmoothingEnabled = flag;
    ctx.msImageSmoothingEnabled     = flag;
}

function message(text) {
    document.getElementById('status-message-id').innerHTML = text;
};

/**
 * Detects if the device is touch-enabled
 */
window.addEventListener('touchstart', function setHasTouch() {
    plx.GUI_TOUCH = true;
    console.debug('touch device detected');
    window.removeEventListener('touchstart', setHasTouch);
});




/*-----------------------------------------------------------------------------------------------
 Labels
 ------------------------------------------------------------------------------------------------*/

plx.Label = function(id, name, color){
    this.id = id;
    this.name = name;
    this.color = color;
    this.setColor(color);
};

plx.Label.prototype.setColor = function(color){
    var rgb = plx.hex2rgb(color);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
};


plx.LabelSet = function(labels){
    this.labels = labels;
};

plx.LabelSet.prototype.getLabelByIndex = function (label_index) {

    if (label_index > 0 && label_index <= this.labels.length) {
        return this.labels[label_index - 1];
    }
    else {
        return undefined;
    }
};

plx.LabelSet.prototype.getLabelByID = function (label_id) {
    var N = this.labels.length;
    for (var i = 0; i < N; i += 1) {
        if (this.labels[i].id == label_id) {
            return this.labels[i];
        }
    }
    return undefined;
};

plx.LabelSet.prototype.getLabels = function(){
    return this.labels;
};

plx.LabelSet.prototype.getLabelByRGBColor = function(r,g,b){
    var N = this.labels.length;

    for (var i=0; i<N; i++){
        var label = this.labels[i];

        if (label.r == r && label.g == g && label.b == b){
            return label;
        }
    }
    return undefined;
};



/*-----------------------------------------------------------------------------------------------
 Brush
 ------------------------------------------------------------------------------------------------*/
plx.Brush = function (size, opacity, type) {
    this.size     = size;
    this.opacity  = opacity;
    this.type     = type;
    this.comp     = 'lighten';
    this.color    = "rgba(0,0,0," + opacity + ')';
    this.r        = 0;
    this.g        = 0;
    this.b        = 0;
    this.label_id = undefined;
};

plx.Brush.prototype.getHexColor = function () {
    return plx.rgb2hex(this.r, this.g, this.b);
};

plx.Brush.prototype.setColor = function (hex) {
    var clr    = plx.hex2rgb(hex);
    this.r     = clr.r;
    this.g     = clr.g;
    this.b     = clr.b;
    this.color = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.opacity + ')';
};

plx.Brush.prototype.setOpacity = function (opacity) {
    this.opacity = opacity;
    this.color   = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.opacity + ')';
};

plx.Brush.prototype.setLabelID = function (label_id) {
    this.label_id = label_id;
    var label     = plx.LABELS.getLabelByID(label_id);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.Brush.prototype.setLabelByIndex = function (label_index) {
    var label     = plx.LABELS.getLabelByIndex(label_index);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.setGlobalBrush = function (brush) {
    plx.BRUSH = brush;
    return plx.BRUSH;
};



/*-----------------------------------------------------------------------------------------------
 Eraser
 ------------------------------------------------------------------------------------------------*/
plx.Eraser = function (size) {
    this.size = size;
    this.type = 'square';
};

plx.setGlobalEraser = function (eraser) {
    plx.ERASER = eraser;
    return plx.ERASER;
};


/*-----------------------------------------------------------------------------------------------
 Slice
 ------------------------------------------------------------------------------------------------*/
/**
 * Displays an image on a canvas
 */
plx.Slice = function (dataset, filename, index) {

    this.dataset  = dataset;
    this.filename = filename;
    this.index     = index;

    this.url = this.dataset.url + '/' + this.filename;
    this.image   = new Image();
};



/**
 * Loads he image to display and tries to display it
 * @param filename
 */
plx.Slice.prototype.load = function () {
    var slice              = this;

    var xhr                = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var url         = window.URL || window.webkitURL;
            slice.image.src = url.createObjectURL(this.response);
            if (slice.dataset != undefined) {
                slice.dataset.onLoadSlice(slice);
            }
        }
    }

    xhr.open('GET', slice.url + '?v=' + Math.random()); //no cache
    xhr.responseType = 'blob';
    xhr.send();
};

/**
 * Checks if this is the current slice
 * @returns {boolean}
 */
plx.Slice.prototype.isCurrent = function (view) {
    return view.current_slice == this;
};

plx.Slice.prototype.updateLayer = function (view) {

    var ctx = view.ctx;

    /*----------------------------------------------------------*/
    // ALL CANVAS OPERATIONS OCCUR IN ORIGINAL IMAGE COORDINATES
    // Regardless of the current scaling of the canvas through CSS
    //
    // Canvas style      width and height -> determine appearance on screen
    //
    // WHEREAS:
    // Canvas properties width and height -> determine buffer operations
    /*----------------------------------------------------------*/
    var width  = this.image.width;
    var height = this.image.height;

    view.canvas.width = width;  //this resets the canvas state (content, transform, styles, etc).
    view.canvas.height = height;

    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);

    if (plx.zoom) {
        plx.zoom.apply(ctx);
    }

    plx.smoothingEnabled(ctx, false);
    ctx.drawImage(this.image, 0, 0, width, height);
    //this._debugZooom(ctx);

};

//plx.Slice.prototype._debugZoom = function(ctx){
//    var p1 = [150,150];
//    var p2 = [300,300];
//    ctx.fillStyle = '#FF0000';
//    ctx.beginPath();
//    ctx.arc(p1[0], p1[1], 5, 0, plx.PI2);
//    ctx.fill();
//    ctx.beginPath();
//    ctx.arc(p2[0], p2[1], 5, 0, plx.PI2);
//    ctx.fill();
//};


/*-----------------------------------------------------------------------------------------------
 Dataset
 ------------------------------------------------------------------------------------------------*/

plx.Dataset = function (url, select, options) {

    this.url = url;

    this.select  = select;
    this.options = options;
    this.slices  = []; //to do set operations
    
    this._slicemap = {}; // for private operations, to quickly access a slice by index
    this._keys = [];     // for private operations easy access to keys in the slicemap


    this._parseURL();
    this._populate();
};

plx.Dataset.SELECT_ALL     = 'all';
plx.Dataset.SELECT_SINGLE  = 'single';
plx.Dataset.SELECT_INDEXED = 'indexed';

plx.Dataset.prototype._parseURL = function () {
    var link      = document.createElement('a');
    link.href     = this.url;  //initalize with the url passed initially (might be a relative one_

    this.hostname = link.hostname;
    this.port     = link.port;
    this.pathname = link.pathname;
    this.protocol = link.protocol;

    this.url = link.href; //now the url is completed

    this.name =  this.url.substr(this.url.lastIndexOf('/') + 1);
};

plx.Dataset.prototype._populate = function () {

    switch (this.select) {
        case plx.Dataset.SELECT_INDEXED:
            this._populateIndexed();
            break;
        default:
            throw ('plx.Dataset ERROR: kind of selection (' + this.source + ') unknown');
    }
};

/**
 * Look for files in the given dataset folder (url) whose name is equal to the dataset with the suffix '_i.png</i>
 * where 'i' is a number.
 *
 * An indexed dataset requires a start, step and end parameters to be passed in the options (see constructor).
 *
 */
plx.Dataset.prototype._populateIndexed = function () {

    var step  = 1 || this.options.step;
    var start = this.options.start;
    var end   = this.options.end;

    if (step <= 0) {
        step = 1;
        console.warn('changing step to 1 (negative steps are not allowed)');
    }

    if (start > end) {
        throw 'plx.Dataset ERROR: start index must be lower than end index';
    }

    var baseurl = this.url;

    for (var index = start; index <= end; index = index + step) {

        var filename = baseurl.substr(baseurl.lastIndexOf('/') + 1) + '_' + index + '.png';
        this.addSlice(filename, index);
    }

    this.num_items  = this.slices.length;
    this.num_loaded = 0;

    console.debug('dataset url: ' + this.url + ', number items: ' + this.num_items);
};


plx.Dataset.prototype.addSlice = function(filename, index){

    var slice    = new plx.Slice(this, filename, index);

    //Update Internal Collections
    this.slices.push(slice);
    this._slicemap[index] = slice;
    this._keys.push(index);
};


plx.Dataset.prototype.load = function (progress_callback) {
    this.progress_callback = progress_callback;
    this.num_loaded        = 0;
    for (var i = 0; i < this.num_items; i++) {
        this.slices[i].load();
    }
};

plx.Dataset.prototype.onLoadSlice = function (slice) {
    this.num_loaded++;
    if (this.num_loaded == this.num_items) {
        console.debug('all items loaded');
    }
    this.progress_callback(this);
};

plx.Dataset.prototype.hasLoaded = function () {
    return (this.num_loaded == this.num_items);
};

plx.Dataset.prototype.getSliceByIndex = function(index){
   return this._slicemap[index]; 
};


plx.Dataset.prototype.getMiddleSlice = function(){
    var index = Math.floor(this._keys.length / 2);
    return this._slicemap[this._keys[index]];
};


plx.Dataset.prototype.getNextSlice = function(index){
    var keys      = this._keys;
    var i       = keys.indexOf(index);
    var next_index     = undefined;

    if (i < keys.length - 1) {
        next_index = keys[i + 1];
        return this._slicemap[next_index];
    }

    return undefined;
};

plx.Dataset.prototype.getPreviousSlice = function(index){
    var keys      = this._keys;
    var i       = keys.indexOf(index);
    var previous_index     = undefined;

    if (i > 0) {
        previous_index = keys[i - 1];
        return this._slicemap[previous_index];
    }

    return undefined;

};

/*-----------------------------------------------------------------------------------------------
 Annotation Layer
 ------------------------------------------------------------------------------------------------*/
/**
 * Represents the annotated slice. There can only be one at a time per slice.
 */
plx.AnnotationLayer = function (slice_id) {

    this.slice_id     = slice_id;
    this.canvas       = document.createElement('canvas');
    this.ctx          = this.canvas.getContext('2d');
    this.imageData    = undefined;
    this.lastX        = undefined;
    this.lastY        = undefined;
    this.undo_history = [];
    this.redo_history = [];
    this.view         = undefined;
};

//Constants
plx.AnnotationLayer.LABEL_DISTANCE_TOLERANCE = 20;

/**
 * Sets the reference of the view where this annotation layer will be displayed
 * @param view
 */
plx.AnnotationLayer.prototype.setView = function (view) {
    this.view = view;
};

/**
 * Checks if this annotation layer is empty
 * @returns true or false
 */
plx.AnnotationLayer.prototype.isEmpty = function () {
    if (this.imageData == undefined) {
        //we have never annotated here
        return true;
    }
    var data = this.imageData.data;
    var maxR = 0, maxG = 0, maxB = 0, N = data.length;
    for (var i = 0; i < N; i += 4) {
        if (data[i] > maxR) {maxR = data[i];}
        if (data[i + 1] > maxG) {maxG = data[i + 1];}
        if (data[i + 2] > maxB) {maxB = data[i + 2];}
    }
    return (maxR == maxG && maxG == maxB & maxR == 0); //nothing ?
};

/**
 * Clears this annotation layer. The Undo/Redo history is cleared too.
 */
plx.AnnotationLayer.prototype.clearAnnotations = function () {
    if (this.imageData == undefined) {
        return;
    } //nothing here to clear

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.imageData    = undefined;
    this.undo_history = [];
    this.redo_history = [];
};

/**
 * Creates a new undo step with the current content of the annotation context
 */
plx.AnnotationLayer.prototype.saveUndoStep = function () {
    this.undo_history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
};

/**
 * Sets the contents of the annotation layer to one step before in history
 * @returns {boolean}
 */
plx.AnnotationLayer.prototype.undo = function () {
    if (this.undo_history.length == 0) {
        console.warn(this.slice_id + ' nothing to undo here');
        return false;
    }
    var currentStep = this.undo_history.pop();
    this.redo_history.push(currentStep);

    var previousStep = this.undo_history[this.undo_history.length - 1];
    this.imageData   = previousStep;
    if (this.imageData == undefined) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    return true;
};

/**
 * Sets the contents of the annotation layer to one step further in history
 * @returns {boolean}
 */
plx.AnnotationLayer.prototype.redo = function () {

    if (this.redo_history.length == 0) {
        console.warn(this.slice_id + ' nothing to redo here');
        return false;
    }

    this.imageData = this.redo_history.pop();
    this.undo_history.push(this.imageData);
    this.ctx.putImageData(this.imageData, 0, 0);
    return true;
};

/**
 * Starts annotating
 * @param x coordinate x
 * @param y coordinate y
 * @param view corresponding view
 */
plx.AnnotationLayer.prototype.startAnnotation = function (x, y) {

    if (this.view === undefined) {
        throw 'Annotation cannot start, the view has not been set';
    }
    var view   = this.view;
    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;

    /*---------------------------------------------*/
    // Propagate coordinates from background layer (image)
    /*---------------------------------------------*/
    this.canvas.width  = view.canvas.width;
    this.canvas.height = view.canvas.height;

    /*---------------------------------------------*/

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
            this.ctx.strokeStyle = plx.BRUSH.color;
            this.ctx.fillStyle   = plx.BRUSH.color;
            this.ctx.lineJoin    = brush.type;
            this.ctx.lineCap     = brush.type;
            this.ctx.lineWidth   = brush.size;

            break;

        case plx.OP_DELETE:
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            this.ctx.fillStyle   = 'rgba(0,0,0,1)';
            this.ctx.lineJoin    = eraser.type;
            this.ctx.lineCap     = eraser.type;
            this.ctx.lineWidth   = eraser.size;
            break;
    }

    this.lastX = x;
    this.lastY = y;

    plx.smoothingEnabled(this.ctx, false);

    if (this.imageData) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(this.imageData, 0, 0); //adds the current annotations to the annotation context
    }

    this.redo_history = [];
};

plx.AnnotationLayer.prototype.updateAnnotation = function (curr_x, curr_y) {

    var ctx    = this.ctx;
    var view   = this.view;
    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;
    var mouseX = curr_x;
    var mouseY = curr_y;
    var x1     = curr_x;
    var y1     = curr_y;
    var x2     = this.lastX;
    var y2     = this.lastY;
    var steep  = (Math.abs(y2 - y1) > Math.abs(x2 - x1));
    var bsize2 = brush.size * 2;
    var esize2 = eraser.size * 2;

    if (steep) {
        var x = x1;
        x1    = y1;
        y1    = x;
        var y = y2;
        y2    = x2;
        x2    = y;
    }
    if (x1 > x2) {
        var x = x1;
        x1    = x2;
        x2    = x;
        var y = y1;
        y1    = y2;
        y2    = y;
    }
    var dx    = x2 - x1,
        dy    = Math.abs(y2 - y1),
        error = 0,
        de    = dy / dx,
        yStep = -1,
        y     = y1;
    if (y1 < y2) {
        yStep = 1;
    }

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE) {
        for (var x = x1; x < x2; x += 1) {
            if (brush.type == 'square') {
                if (steep) {
                    ctx.fillRect(y - brush.size, x - brush.size, bsize2, bsize2);
                }
                else {
                    ctx.fillRect(x - brush.size, y - brush.size, bsize2, bsize2);
                }
            }
            else {
                if (steep) {
                    ctx.beginPath();
                    ctx.arc(y, x, brush.size, 0, plx.PI2);
                    ctx.fill();
                }
                else {
                    ctx.beginPath();
                    ctx.arc(x, y, brush.size, 0, plx.PI2);
                    ctx.fill();
                }
            }
            error += de;
            if (error >= 0.5) {
                y += yStep;
                error -= 1.0;
            }
        }
    }
    else if (plx.CURRENT_OPERATION == plx.OP_DELETE) {
        for (var x = x1; x < x2; x += 1) {
            if (steep) {
                ctx.clearRect(y - eraser.size, x - eraser.size, esize2, esize2);
            }
            else {
                ctx.clearRect(x - eraser.size, y - eraser.size, esize2, esize2);
            }
            error += de;
            if (error >= 0.5) {
                y += yStep;
                error -= 1.0;
            }
        }
    }

    this.lastX = mouseX;
    this.lastY = mouseY;

    var width  = this.canvas.width;
    var height = this.canvas.height;

    view.ctx.globalAlpha = 1;
    view.ctx.clearRect(0, 0, width, height);
    view.ctx.drawImage(view.current_slice.image, 0, 0, width, height);

    view.ctx.globalAlpha = plx.BRUSH.opacity;
    view.ctx.drawImage(this.canvas, 0, 0, width, height);
};

plx.AnnotationLayer.prototype.saveAnnotation = function () {

    this.processPixels();


    this.saveUndoStep();
    this.view.render();
};

plx.AnnotationLayer.prototype.updateLayer = function (view) {

    if (view !== this.view) {
        throw 'Assertion error: the annotation layer is not assigned to the current view being rendered';
    }

    var view_ctx = view.ctx;
    var off_ctx  = this.ctx;

    off_ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.imageData) {

        plx.smoothingEnabled(off_ctx, false);
        off_ctx.putImageData(this.imageData, 0, 0);

        view_ctx.globalAlpha = plx.BRUSH.opacity;
        plx.smoothingEnabled(view_ctx, false);
        view_ctx.drawImage(this.canvas, 0, 0, view.canvas.width, view.canvas.height);

    }
};

plx.AnnotationLayer.prototype._getPixelPopulation = function () {

    //assertion: this.imageData has been set
    if (this.imageData == undefined) {
        return {};
    }

    var data = this.imageData.data;

    var dict = {};

    for (var i = 0, N = data.length; i < N; i += 4) {

        var r = data[i], g = data[i + 1], b = data[i + 2];

        if (r == g && g == b & b == 0) {
            continue;
        }
        var hex = plx.rgb2hex(r, g, b);
        if (dict[hex] == undefined) {
            dict[hex] = 1;
        }
        else {
            dict[hex]++;
        }
    }

    return dict;
};

plx.AnnotationLayer.prototype.getUsedLabels = function () {

    var dict   = this._getPixelPopulation();
    var colors = Object.keys(dict);

    if (colors.length == 0) {
        return [];
    }

    var labels       = plx.LABELS.labels;
    var MAX_DISTANCE = plx.AnnotationLayer.LABEL_DISTANCE_TOLERANCE;
    var used         = [];

    function distanceToLabel(label) {

        var minDistance = 255 * 3; //maximum possible distance

        for (var i = 0, N = colors.length; i < N; i++) {
            var color    = plx.hex2rgb(colors[i]);
            var distance = Math.abs(color.r - label.r) + Math.abs(color.g - label.g) + Math.abs(color.b - label.b);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        //console.log('minimum distance to label ' + label.id + ' (' + label.color + ') :' + minDistance);
        return minDistance;
    }

    for (var i = 0, N = labels.length; i < N; i++) {
        var label = labels[i];
        if (distanceToLabel(label) <= MAX_DISTANCE) {
            used.push(label);
        }
    }
    return used;
};

/**
 * Removes the smoothing due to the bilinear interpolation
 * caused by ctx.fillRect ctx.arc and ctx.fill (problem inherent to html canvas)
 *
 * This method UPDATES the current ImageData object of the annotation layer.
 *
 */
plx.AnnotationLayer.prototype.processPixels = function () {

    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    var labels = this.getUsedLabels();
    var data   = this.imageData.data;

    var dict = {};

    for (var i = 0, N = data.length; i < N; i += 4) {

        var r = data[i], g = data[i + 1], b = data[i + 2];

        if (r == g && g == b & b == 0) {
            continue;
        }

        data[i + 3] = 255; //no alpha

        //assign pixel to closest label

        var lastDistance = 255 * 3;
        var index        = 0;
        for (var j = 0, M = labels.length; j < M; j++) {
            var label    = labels[j];
            var distance = Math.abs(label.r - r) + Math.abs(label.g - g) + Math.abs(label.b - b);

            if (distance < lastDistance) {
                index        = j;
                lastDistance = distance;
            }
        }

        var selected = labels[index];

        data[i]     = selected.r;
        data[i + 1] = selected.g;
        data[i + 2] = selected.b;

    }

    //console.log('used labels: ', labels);

    plx.smoothingEnabled(this.ctx, false);
    this.ctx.putImageData(this.imageData, 0, 0); //updates the data in the canvas.
};

/*-----------------------------------------------------------------------------------------------
 Paint Bucket
 ------------------------------------------------------------------------------------------------*/
plx.PaintBucket = function (annotation_layer) {

    //Info of the annotation layer
    this.annotation = annotation_layer;
    this.sizeX      = annotation_layer.canvas.width;
    this.sizeY      = annotation_layer.canvas.height;

    // create a local canvas and context
    this.buffer        = document.createElement("canvas");
    this.buffer.width  = this.sizeX;
    this.buffer.height = this.sizeY;

    this.ctx = this.buffer.getContext("2d");


    this.ctx.clearRect(0, 0, this.sizeX, this.sizeY);

    if (annotation_layer.imageData) {
        plx.smoothingEnabled(this.ctx, false);
        this.ctx.putImageData(annotation_layer.imageData, 0, 0); //copy the annotation data to the local context
    }
};

plx.PaintBucket.prototype.fill = function (x, y, replacement_color) {

    var imdata       = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY),
        bucket       = this,

        width        = this.sizeX,
        height       = this.sizeY,
        startX       = x,
        startY       = y,

        posOri       = (y * width) + x,

        ori          = {
            'r': imdata.data[posOri * 4],
            'g': imdata.data[posOri * 4 + 1],
            'b': imdata.data[posOri * 4 + 2]
        },

        origin_color = plx.rgb2hex(ori.r, ori.g, ori.b),
        rep = plx.hex2rgb(replacement_color),


        maxProcessed = 50000, //hard stop
        countProcessed = 0;

    console.debug('paint bucket. origin color:', origin_color, ' replacement color:', replacement_color);

    /*if (origin_color == replacement_color && plx.CURRENT_OPERATION != plx.OP_DELETE){
     console.debug('same color, nothing to fill here');
     return;
     }*/


    function getColor(x, y) {
        var pos = (y * width) + x;
        return [
            imdata.data[pos * 4],
            imdata.data[pos * 4 + 1],
            imdata.data[pos * 4 + 2]
        ];
    }

    function paint(x, y) {
        var pos = (y * width) + x;
        if (plx.CURRENT_OPERATION != plx.OP_DELETE) {
            imdata.data[pos * 4]     = rep.r;
            imdata.data[pos * 4 + 1] = rep.g;
            imdata.data[pos * 4 + 2] = rep.b;
            imdata.data[pos * 4 + 3] = 255;
        }
        else {
            imdata.data[pos * 4]     = 0;
            imdata.data[pos * 4 + 1] = 0;
            imdata.data[pos * 4 + 2] = 0;
            imdata.data[pos * 4 + 3] = 0;
        }
    };

    function test(x, y) { //check if the color is not any of the labels or zero
        var pos = (y * width) + x;

        var r = imdata.data[pos * 4];
        var g = imdata.data[pos * 4 + 1];
        var b = imdata.data[pos * 4 + 2];

        if ((Math.abs(r-ori.r) +  Math.abs(g-ori.g) +  Math.abs(b -ori.b) ) <= 10) { //tolerance :10
            return true;  //Empty, good to fill
        }
        else {
           return false;
        }
    };

    var queue = [{'xMin': x, 'xMax': x, 'y': y, 'direction': null, 'extendLeft': true, 'extendRight': true}];

    paint(x, y);

    var diagonal = true;

    while (queue.length) {
        var item = queue.pop();

        countProcessed++;
        if (countProcessed == maxProcessed) {
            console.info('processed ' + maxProcessed);
            console.info('stopping now');
            break;
        }

        var down = item.direction === true;
        var up   = item.direction === false;
        var minX = item.xMin;
        var y    = item.y;

        if (item.extendLeft) { // extendLeft
            while (minX >= 0 && test(minX - 1, y)) {
                minX--;
                paint(minX, y);
            }

        }

        var maxX = item.xMax;

        if (item.extendRight) { // extendRight
            while (maxX <= width - 1 && test(maxX + 1, y)) {
                maxX++;
                paint(maxX, y);
            }

        }

        if (diagonal) {             // extend range looked at for next lines
            if (minX >= 0) {
                minX--;
            }
            if (maxX <= width) {
                maxX++;
            }
        }
        else { // extend range ignored from previous line
            item.xMin--;
            item.xMax++;
        }

        function addNextLine(newY, isNext, downwards) {
            var rMinX   = minX;
            var inRange = false;
            for (var x = minX; x <= maxX; x++) {
                // skip testing, if testing previous line within previous range
                var empty = (isNext || (x <= item.xMin || x >= item.xMax)) && test(x, newY);
                var empty = (isNext || (x <= item.xMin || x >= item.xMax)) && test(x, newY);
                if (!inRange && empty) {
                    rMinX   = x;
                    inRange = true;
                }
                else if (inRange && !empty) {

                    queue.push({'xMin': rMinX, 'xMax': x - 1, 'y': newY, 'direction': downwards, 'extendLeft': rMinX == minX, 'extendRight': false});
                    inRange = false;
                }
                if (inRange) {
                    paint(x, newY);
                }
                // skip
                if (!isNext && x == item.xMin) {
                    x = item.xMax;
                }
            }
            if (inRange) {

                queue.push({'xMin': rMinX, 'xMax': x - 1, 'y': newY, 'direction': downwards, 'extendLeft': rMinX == minX, 'extendRight': true});
            }
        }

        if (y < height - 1) {
            addNextLine(y + 1, !up, true);
        }
        if (y > 0) {
            addNextLine(y - 1, !down, false);
        }
    }



    this._updateAnnotation(imdata);
};


plx.PaintBucket.prototype._updateAnnotation = function (imdata) {

    this.ctx.putImageData(imdata, 0, 0);

    //clear layer
    var annotation_ctx = this.annotation.ctx;
    annotation_ctx.clearRect(0, 0, this.annotation.canvas.width, this.annotation.canvas.height);

    var data = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY);
    annotation_ctx.putImageData(data, 0, 0);

    //update annotation
    this.annotation.saveAnnotation();
};

//plx.PaintBucket.prototype._debug = function(imdata){
//    this.ctx.putImageData(imdata, 0, 0);
//    this.updateAnnotationLayer(VIEW);
//    VIEW.render();
//    var x = 0;
//};


/*-----------------------------------------------------------------------------------------------
 Zoom Object
 ------------------------------------------------------------------------------------------------*/
plx.Zoom = function () {

    this.x     = 0;
    this.y     = 0;
    this.scale = 1;

    this.delta       = 0;
    this.scaleFactor = 1.1;
};

plx.Zoom.prototype.setFocus = function (x, y) {
    this.x = x;
    this.y = y;
};

plx.Zoom.prototype.transformPoint = function (x, y) {
    var newX = ((x - this.x) / this.scale) + this.x;
    var newY = ((y - this.y) / this.scale) + this.y;
    return [newX, newY];
};

plx.Zoom.prototype.setScaleTouch = function (scale) {
    if (scale < 1) {
        this.scale = 1
    }
    else if (scale <= 50) {
        this.scale = scale;
    }
};

plx.Zoom.prototype.setScaleMouse = function (delta) {
    if (this.delta + delta < 0 || this.delta + delta > 30) {
        if (this.delta + delta < 0) {
            this.scale = 1;
        }
        return;
    }
    this.delta += delta;
    this.scale = Math.pow(this.scaleFactor, this.delta);
};

plx.Zoom.prototype.apply = function (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); //identitiy
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.x, -this.y);
};


/*-----------------------------------------------------------------------------------------------
 Annotation Set
 ------------------------------------------------------------------------------------------------*/
plx.AnnotationSet = function (dataset_id, user_id, annotation_set_id, labelset_id) {
    this.annotations = {}; //dictionary containing the slice-uri, annotation slice object pairing.
};

/**
 * Returns the set of annotation layers as a list. Useful for set operations
 * @returns {Array}
 */
plx.AnnotationSet.prototype.getKeys = function(){
    return Object.keys(this.annotations).sort();
}

plx.AnnotationSet.load = function (anset_url) {
    //loads an annotationset given the corresponding JSON file URL
    // the JSON file contains:
    //    the location of the dataset
    //    the user identifier
    //    the location of the annotated set
    //    the location of the label set
};

plx.AnnotationSet.prototype.save = function () {
    // Does two things:
    //  1. Saves a set of annotated images png to a writable location
    //  2. Writes the corresponding anset_url (so we can load this later on).
};

plx.AnnotationSet.prototype.getAnnotation = function (slice_id) {

    var aslice = undefined;
    if (!(slice_id in this.annotations)) {
        aslice                      = new plx.AnnotationLayer(slice_id);
        this.annotations[slice_id] = aslice;
    }
    else {
        aslice = this.annotations[slice_id];
    }
    return aslice;
};

plx.AnnotationSet.prototype.hasAnnotation = function (slice_id) {
    return (slice_id in this.annotations);
};

plx.AnnotationSet.prototype.getUsedLabels = function(){

    for (annotation in this.annotations){
        if (this.annotations.hasOwnProperty(annotation)) {
            var labels = annotation.getUsedLabels();
        }
    }
};


/*-----------------------------------------------------------------------------------------------
 Renderer
 ------------------------------------------------------------------------------------------------*/
/**
 * Responsible for rendering the layers in the appropriate order, and reflecting changes
 * when requested by the different layers.
 * @constructor
 */
plx.Renderer = function (view) {
    this.current = undefined;
    this.stacks  = {};
    this.view    = view;
};

plx.Renderer.BACKGROUND_LAYER = 0;
plx.Renderer.ANNOTATION_LAYER = 1;
plx.Renderer.TOOLS_LAYER      = 2;

plx.Renderer.prototype.addLayer = function (key, index, layer) {
    var stack = this.stacks[key];
    if (stack == undefined) {
        stack            = [];
        this.stacks[key] = stack;
    }

    stack.splice(index, 0, layer);
};

plx.Renderer.prototype.removeLayer = function (key, index) {
    var stack = this.stacks[key];
    if (stack == undefined) {
        console.warn('layer was not removed because the stack ' + key + ' does not exist');
        return;
    }
    stack.splice(index, 0);
};

plx.Renderer.prototype.setCurrentStack = function (key) {
    if (!(key in this.stacks)) {
        this.stacks[key] = [];
    }
    this.current = this.stacks[key];

};

plx.Renderer.prototype.update = function () {
    var stack = this.current;
    for (var i = 0; i < stack.length; i += 1) {
        stack[i].updateLayer(this.view);
    }
};


/*-----------------------------------------------------------------------------------------------
 View
 ------------------------------------------------------------------------------------------------*/
plx.View = function (canvas_id) {
    var canvas              = document.getElementById(canvas_id);
    canvas.style.width      = '100%';
    canvas.style.height     = '100%';
    canvas.style.cursor     = 'crosshair';
    canvas.width            = canvas.offsetWidth;
    canvas.height           = canvas.offsetHeight;
    this.canvas             = canvas;
    this.ctx                = canvas.getContext("2d");
    this.dataset            = undefined;
    this.aset               = undefined;
    this.interactor         = new plx.ViewInteractor(this);
    this.renderer           = new plx.Renderer(this);
    this.current_slice      = undefined;
    this.current_annotation = undefined;
};

plx.View.prototype.resizeTo = function (width, height) {
    this.canvas.width  = width;
    this.canvas.height = height;
};

plx.View.prototype.load = function (dataset, callback) {
    this.dataset = dataset;
    dataset.load(callback);
};

plx.View.prototype.render = function () {
    this.renderer.update();
};

plx.View.prototype.showSlice = function (slice) {
    this.current_slice = slice;
    this.getCurrentAnnotationLayer();
    if (slice.stack === undefined) {
        this.renderer.addLayer(slice.url, plx.Renderer.BACKGROUND_LAYER, this.current_slice);
        this.renderer.addLayer(slice.url, plx.Renderer.ANNOTATION_LAYER, this.current_annotation);
        slice.stack = 'built';
    }

    this.resizeTo(slice.image.width, slice.image.height);
    this.renderer.setCurrentStack(slice.url);
    this.renderer.update();
};

/**
 * Index in the dictionary (there could be missing indices if the
 * dataset is loaded with step != 1).
 * @param index
 */
plx.View.prototype.showSliceByIndex = function (index) {

    var slice = this.dataset.getSliceByIndex(index);

    if (slice == undefined) {
        console.error('slice does not exist');
        return;
    }
    this.showSlice(slice);
};

plx.View.prototype.showMiddleSlice = function () {
    var slice = this.dataset.getMiddleSlice();
    this.showSlice(slice);
    return slice.index;
};

plx.View.prototype.showCurrentSlice = function () {
    this.showSlice(this.current_slice);
};

plx.View.prototype.showNextSlice = function () {

    var index       = this.current_slice.index;
    var nextSlice = this.dataset.getNextSlice(index);

    if (nextSlice != undefined) {
        this.showSlice(nextSlice);
        return nextSlice.index;
    }
    return index; //can't move next, return current index
};

plx.View.prototype.showPreviousSlice = function () {

    var index       = this.current_slice.index;
    var previousSlice = this.dataset.getPreviousSlice(index);

    if (previousSlice != undefined) {
        this.showSlice(previousSlice);
        return previousSlice.index;
    }
    return index; //can't move to previous, return current index
};


plx.View.prototype.getCurrentAnnotationLayer = function () {

    /*--------------------------------------------------------------------------------------*/
    if (this.aset == undefined) { //@TODO: review hard code
        this.aset = new plx.AnnotationSet('spine_phantom_1', 'dcantor', '1', 'labels_spine');
    }
    /*--------------------------------------------------------------------------------------*/
    this.current_annotation = this.aset.getAnnotation(this.current_slice.filename); //for now the filename is the id.
    this.current_annotation.setView(this);
    return this.current_annotation;
};

plx.View.prototype.undo = function () {
    var annotation_layer      = this.current_annotation;
    var successFlag = annotation_layer.undo();
    if (successFlag) {
        this.render();
    }
    return successFlag; //false if nothing to undo
};

plx.View.prototype.redo = function () {
    var annotation_layer      = this.current_annotation;
    var successFlag = annotation_layer.redo();
    if (successFlag){
        this.render();
    }
    return successFlag;  //false if nothing to redo
};



/*-----------------------------------------------------------------------------------------------
 View Interactor
 ------------------------------------------------------------------------------------------------*/
plx.ViewInteractor = function (view) {

    this.dragging          = false;
    this.view              = view;
    this.aslice            = undefined;
    this.observers         = {};
    this.zooming           = false;
    this._long_press_timer = null;
    this._ongoing_touches  = [];
    this._distance         = 0;
    this._midpoint         = 0;
    this._scale            = 1;

    plx.zoom = new plx.Zoom();  //this is a good place
};

plx.ViewInteractor.prototype.connectView = function () {
    var view       = this.view;
    var canvas     = this.view.canvas;
    var interactor = this;


    canvas.onmousedown  = function (ev) { interactor.onMouseDown(ev); };
    canvas.onmouseup    = function (ev) { interactor.onMouseUp(ev); };
    canvas.onmousemove  = function (ev) { interactor.onMouseMove(ev); };
    canvas.onmouseleave = function (ev) { interactor.onMouseLeave(ev); };
    canvas.onwheel      = function (ev) { interactor.onWheel(ev);};
    canvas.addEventListener('dblclick', function (ev) { interactor.onDoubleClick(ev); }, false);

    canvas.addEventListener('touchstart', function (ev) { interactor.onTouchStart(ev); }, false);
    canvas.addEventListener('touchmove', function (ev) { interactor.onTouchMove(ev); }, false);
    canvas.addEventListener('touchend', function (ev) { interactor.onTouchEnd(ev); }, false);


    document.onkeyup = function (ev) { interactor.onKeyUp(ev);}

};

plx.ViewInteractor.prototype.addObserver = function (observer, kind) {
    var list = this.observers[kind];
    if (list == undefined) {
        list                 = [];
        this.observers[kind] = list;
    }

    if (list.indexOf(observer) < 0) {
        list.push(observer);
    }
};

plx.ViewInteractor.prototype.notify = function (kind, data) {
    var list = this.observers[kind];

    if (list == undefined) {
        return;
    } //no listeners for this

    for (var i = 0; i < list.length; i += 1) {
        list[i].processNotification(data);
    }
};

plx.ViewInteractor.prototype._getCanvasCoordinates = function (eventX, eventY) {

    var canvas = this.view.canvas;
    var rect   = canvas.getBoundingClientRect();
    var x      = Math.round((eventX - rect.left) / (rect.right - rect.left) * canvas.width);
    var y      = Math.round((eventY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    var zcoords = plx.zoom.transformPoint(x, y);
    x           = zcoords[0];
    y           = zcoords[1];

    return [x, y];
};

plx.ViewInteractor.prototype.action_startAnnotation = function (x, y) {
    var view    = this.view;
    this.aslice = view.getCurrentAnnotationLayer();
    this.aslice.startAnnotation();

};

plx.ViewInteractor.prototype.action_paintBucket = function (x, y) {

    var aslice = this.view.getCurrentAnnotationLayer();

    if (aslice.isEmpty() && plx.CURRENT_OPERATION == plx.OP_DELETE) {
        this.notify('alert-event', {'type': 'alert-info', 'title': 'Eraser', 'message': 'Nothing to erase'});
        return;
    }

    x          = Math.round(x);
    y          = Math.round(y);
    plx.bucket = new plx.PaintBucket(aslice);
    plx.bucket.fill(x, y, plx.BRUSH.getHexColor());
    this.view.render();
};

plx.ViewInteractor.prototype.action_paintBucket_long_press = function (x, y, delay) {
    var interactor = this;
    var px         = x;
    var py         = y;

    function deferred_execution() {
        interactor.action_paintBucket(px, py);
    }

    this._long_press_timer = window.setTimeout(deferred_execution, delay);
}

plx.ViewInteractor.prototype.action_panning = function (x, y) {
    plx.zoom.setFocus(x, y);
    this.view.render();
    message('panning');
};

plx.ViewInteractor.prototype.action_zooming = function (scale, mouseOrTouch) {

    if (mouseOrTouch == 'mouse') {

        plx.zoom.setScaleMouse(scale);
        message('zoom (mouse): ' + plx.zoom.scale.toPrecision(3));
        this.view.render();

    }
    else {
        if (mouseOrTouch == 'touch') {

            plx.zoom.setScaleTouch(scale);
            this.view.render();
            message('zoom (touch): ' + scale.toPrecision(3));

        }
        else {
            message('Error: unknown type of zooming');
        }
    }
}

plx.ViewInteractor.prototype.onKeyUp = function(ev){
    if (ev.keyCode == 17 && plx.CURRENT_OPERATION == plx.OP_PANNING){
        plx.setCurrentOperation(this.last_operation);
        this.notify(plx.EV_OPERATION_CHANGED, {'operation': this.last_operation});
    }
};

plx.ViewInteractor.prototype.onDoubleClick = function (ev) {
    ev.preventDefault();
    var coords = this._getCanvasCoordinates(ev.clientX, ev.clientY);
    this.action_paintBucket(coords[0], coords[1]);
    plx.COORDINATES.X = coords[0];
    plx.COORDINATES.Y = coords[0];
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onMouseDown = function (ev) {
    this.initX = plx.COORDINATES.X;
    this.initY = plx.COORDINATES.Y;

    var coords = this._getCanvasCoordinates(ev.clientX, ev.clientY);


    this.action_paintBucket_long_press(coords[0], coords[1], 1000);

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:

            this.dragging = true;
            this.action_startAnnotation(coords[0], coords[1]);
            break;

        case plx.OP_PAINT_BUCKET:
            this.action_paintBucket(coords[0], coords[1]);
            break;
    }

    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onMouseMove = function (ev) {

    var coords = this._getCanvasCoordinates(ev.clientX, ev.clientY);
    var x      = coords[0];
    var y      = coords[1];

    clearTimeout(this._long_press_timer);
    /*if ((Math.abs(this.initX - x) > 3) && (Math.abs(this.initY - y) > 3)) { //it moved too much

     }*/

    if (ev.ctrlKey){
        if (plx.CURRENT_OPERATION != plx.OP_PANNING){
            this.last_operation = plx.CURRENT_OPERATION;
            console.debug('previous operation: '+this.last_operation);
            plx.setCurrentOperation(plx.OP_PANNING);
        }
        this.action_panning(x,y);
    }

    else {

        switch (plx.CURRENT_OPERATION) {
            case plx.OP_ANNOTATE:
            case plx.OP_DELETE:
                if (this.dragging) {
                    this.aslice = this.view.getCurrentAnnotationLayer();
                    message('annotating/deleting with mouse');
                    this.aslice.updateAnnotation(x, y);
                }
                break;
        }
    }

    plx.COORDINATES.X = x;
    plx.COORDINATES.Y = y;
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onMouseUp = function (ev) {

    clearTimeout(this._long_press_timer);

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:

            if (this.dragging) {
                this.aslice.saveAnnotation();
                message('annotation completed');
                this.dragging = false;

            }
            break;



    }
};

plx.ViewInteractor.prototype.onMouseLeave = function (ev) {

    clearTimeout(this._long_press_timer);

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE || plx.CURRENT_OPERATION == plx.OP_DELETE) {
        if (this.dragging) {
            this.dragging = false;
        }
    }
};

plx.ViewInteractor.prototype.onWheel = function (ev) {
    ev.preventDefault();

    var direction = (ev.deltaY < 0 || ev.wheelDeltaY > 0) ? 1 : -1;

    if (!ev.ctrlKey && plx.CURRENT_OPERATION != plx.OP_ZOOM) {

        var slice = undefined;

        if (direction > 0) {
            slice = this.view.showPreviousSlice();

        }
        else {
            if (direction < 0) {
                slice = this.view.showNextSlice();

            }
        }

        message('slice: ' + slice);
        this.view.render();
        this.notify(plx.EV_SLICE_CHANGED, {'slice': slice}); //updates slider
        return;
    }
    else {
        if (plx.zoom.scale == 1) {
            plx.zoom.setFocus(plx.COORDINATES.X, plx.COORDINATES.Y);
        }
        this.action_zooming(direction, 'mouse');
    }
    this.notify(plx.EV_COORDS_UPDATED);
};

/*-----------------------------------------------------------------------------------------------
 Touch Events
 ------------------------------------------------------------------------------------------------*/
plx.ViewInteractor.prototype.onTouchStart = function (ev) {
    ev.preventDefault();

    message('started touch');

    var touches = ev.changedTouches;

    for (var t = 0; t < touches.length; t++) {
        this._ongoing_touches.push(this._copyTouch(touches[t]));
    }

    touches = this._ongoing_touches;

    if (touches.length == 1 && !this.zooming) {
        this.onSingleTouchStart(touches[0])
    }
    else {
        if (touches.length == 2) {
            this.onDoubleTouchStart(touches);
        }
    }
};

plx.ViewInteractor.prototype.onTouchMove = function (ev) {

    var view   = this.view;
    var canvas = view.canvas;
    var rect   = canvas.getBoundingClientRect();

    var touches         = ev.targetTouches;
    var changed_touches = ev.changedTouches;

    if (touches.length == 1 && changed_touches.length == 1 && !this.zooming) { //annotating
        this.onSingleTouchMove(touches[0]);
    }

    if (touches.length == 2 && (changed_touches.length == 1 || changed_touches.length == 2)) {
        this.onDoubleTouchMove(touches);
        this.zooming = true;
    }

};

plx.ViewInteractor.prototype.onTouchEnd = function (ev) {

    clearTimeout(this._long_press_timer); //avoid redundance in the individual end methods

    var touches = ev.changedTouches;

    // DEBUG CODE
    //console.log('changed touches:', touches.length);
    //for (var i=0; i<touches.length; i++){
    //    console.log(touches[i])
    //}
    //console.log('ongoing touches:', this._ongoing_touches.length);
    //for (var i=0;i<this._ongoing_touches.length; i++){
    //    console.log(this._ongoing_touches[i]);
    //}

    for (var i = 0; i < touches.length; i++) { // remove the touch and see what we are left with
        var idx = this._ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) {
            this._ongoing_touches.splice(idx, 1);
            //console.log(' removing ', idx);
        }
    }
    //console.log('after removing ongoing touch, remaining:',this._ongoing_touches.length);

    if (touches.length == 1 && this._ongoing_touches.length == 0) {
        if (!this.zooming) {
            this.onSingleTouchEnd(touches[0]);
        }
        else {
            //message('zooming ended');
        }
        this.zooming = false;
    }
    else {
        if (touches.length == 1 && this._ongoing_touches.length == 1) {
            this.onOneOfTwoTouchEnd(touches[0], this._ongoing_touches[0]);
            //still zooming until last finger is released
        }
        else {
            if (touches.length == 2 && this._ongoing_touches.length == 0) {
                this.onDoubleTouchEnd(touches);
                this.zooming = false;
            }
        }
    }
};

plx.ViewInteractor.prototype._getMidpoint = function (arr) {
    var coords = {};
    coords.x   = Math.round((arr[0] + arr[2]) / 2);
    coords.y   = Math.round((arr[1] + arr[3]) / 2);
    return coords;
};

plx.ViewInteractor.prototype._copyTouch = function (touch) {
    return {
        identifier: touch.identifier,
        pageX     : touch.pageX,
        pageY     : touch.pageY,
        clientX   : touch.clientX,
        clientY   : touch.clientY
    };
};

plx.ViewInteractor.prototype._ongoingTouchIndexById = function (idToFind) {

    for (var i = 0; i < this._ongoing_touches.length; i++) {
        if (this._ongoing_touches[i].identifier == idToFind) {
            return i;
        }
    }
    return -1;
};

plx.ViewInteractor.prototype.onSingleTouchStart = function (touch) {

    var coords = this._getCanvasCoordinates(touch.clientX, touch.clientY);

    console.log('single coords:' + coords[0] + ', ' + coords[1]);

    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    this.initX = x;
    this.initY = y;

    this.action_paintBucket_long_press(x, y, 1000);

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:
            this.action_startAnnotation(x, y);
            break;

        case plx.OP_PAINT_BUCKET:
            this.action_paintBucket(x, y);
            break;
    }

    plx.setCurrentCoordinates(x, y)
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onSingleTouchMove = function (touch) {

    message('annotating...');

    var coords = this._getCanvasCoordinates(touch.clientX, touch.clientY);

    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    //required because of sensitivity of screen to motion
    if ((Math.abs(this.initY - y) > 5) && (Math.abs(this.initX - x) > 5)) {
        clearTimeout(this._long_press_timer);
    }

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:
            this.aslice.updateAnnotation(x, y);
            break;
        case plx.OP_PANNING:
            this.action_panning(x, y);
            break;
    }

    plx.setCurrentCoordinates(x, y);
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onSingleTouchEnd = function (touchReleased) {

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE || plx.CURRENT_OPERATION == plx.OP_DELETE) {
        this.aslice.saveAnnotation();
        this.view.render();
    }

    message('last touch ended');
};

plx.ViewInteractor.prototype._getDistanceScreen = function (touches) {
    var canvas = this.view.canvas;
    var rect   = canvas.getBoundingClientRect();

    t1 = touches[0];
    t2 = touches[1];

    var t1_x = Math.round((t1.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    var t1_y = Math.round((t1.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    var t2_x = Math.round((t2.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    var t2_y = Math.round((t2.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    var x = Math.pow(t1_x - t2_x, 2);
    var y = Math.pow(t1_y - t2_y, 2);

    return Math.sqrt(x + y);
};

plx.ViewInteractor.prototype.onDoubleTouchStart = function (touches) {

    window.clearTimeout(this._long_press_timer);

    //Distance in screeen coordinates
    this._distance = this._getDistanceScreen(touches);

    //Zooming centre
    var touch1 = touches[0];
    var touch2 = touches[1];

    var tc1 = this._getCanvasCoordinates(touch1.clientX, touch1.clientY);
    var tc2 = this._getCanvasCoordinates(touch2.clientX, touch2.clientY);

    var coords     = [tc1[0], tc1[1], tc2[0], tc2[1]];
    this._midpoint = this._getMidpoint(coords);
    this._scale    = plx.zoom.scale;

    plx.zoom.setFocus(this._midpoint.x, this._midpoint.y);

    //Notifications
    //console.log('>>> INITIAL FOCUS:' + this._midpoint.x + ', ' + this._midpoint.y);

    message('zoom start. scale:' + this._scale.toPrecision(3));
    plx.setCurrentCoordinates(this._midpoint.x, this._midpoint.y);
    this.notify(plx.EV_COORDS_UPDATED);
    this.notify(plx.EV_OPERATION_CHANGED, {'operation': plx.OP_ZOOM});
};

plx.ViewInteractor.prototype.onDoubleTouchMove = function (touches) {

    //Updating scale
    var distance = this._getDistanceScreen(touches);
    var scale    = distance / this._distance * this._scale; //wait until release to update this._scale
    if (scale < 1) { scale = 1;}                            //to avoid 'snowballing'

    var touch1 = touches[0];
    var touch2 = touches[1];

    var tc1 = this._getCanvasCoordinates(touch1.clientX, touch1.clientY);
    var tc2 = this._getCanvasCoordinates(touch2.clientX, touch2.clientY);

    var coords     = [tc1[0], tc1[1], tc2[0], tc2[1]];
    this._midpoint = this._getMidpoint(coords);
    var mp         = this._midpoint;

    this.action_zooming(scale, 'touch');

    plx.setCurrentCoordinates(mp.x, mp.y);
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onOneOfTwoTouchEnd = function (touchReleased, touchPending) {
    message('lifted one of two fingers. zoom:' + plx.zoom.scale.toPrecision(3));
};

plx.ViewInteractor.prototype.onDoubleTouchEnd = function (touchesReleased) {
    message('lifted two fingers. ending zoom :' + plx.zoom.scale.toPrecision(3));
};
