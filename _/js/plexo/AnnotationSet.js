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