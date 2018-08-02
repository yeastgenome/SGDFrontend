MMTF.fetch(
    "3PQR",
    // onLoad callback
    function( mmtfData ){ console.log( mmtfData ) },
    // onError callback
    function( error ){ console.error( error ) }
);

// `bin` is an Uint8Array containing the MMTF MessagePack
var mmtfData = MMTF.decode( bin );

// create event callback functions
var eventCallbacks = {
    onModel: function( modelData ){ console.log( modelData ) },
    onChain: function( chainData ){ console.log( chainData ) },
    onGroup: function( groupData ){ console.log( groupData ) },
    onAtom: function( atomData ){ console.log( atomData ) },
    onBond: function( bondData ){ console.log( bondData ) }
};

// traverse the structure and listen to the events
MMTF.traverse( mmtfData, eventCallbacks );

// bin is Uint8Array containing the mmtf msgpack
var mmtfData = MMTF.decode( bin );
console.log( mmtfData.numAtoms );




