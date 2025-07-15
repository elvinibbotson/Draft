// GLOBAL VARIABLES
var graphs=[]; // array holds graphs
var graph; // current graph
var index; // index/id of current graph/element
var element; // current HTML/SVG element
var nodes=[]; // array of nodes each with x,y coordinates and graph/element index+n
var elNodes=[]; // array of nodes for selected graph/element
var node=0; // node number (0-9) within selected graph/element
var sets=[];
var name=null;
var size=0; // drawing size default to A4
var aspect='landscape'; // default orientation
var scale=1; // default scale is 1:1
var scaleF=3.78; // default scale factor for mm (1:1 scale)
var gridSize=300; // default grid size is 300mm
var gridSnap=false; // grid snap off by default
var handleR=2; // 2mm handle radius at 1:1 scale - increase for smaller scales (eg. 100 at 1:50)
var boxR=5; // radius for corners of round-cornered boxes
var rad=0; // ditto for current box
var snapD=2*scale; // 2mm snap distance at 1:1 scale - increase for smaller scales (eg. 100 at 1:50)
var snap=false; // flags if snapping to a node
var zoom=1; // start zoomed out to full drawing
var mode=null;
var scr={}; // screen size .w & .h and cursor coordinates .x & .y
var dwg={}; // drawing size .w & .h and offset .x & .y
var x=0;
var y=0;
var x0=0;
var y0=0;
var dx=0;
var dy=0;
var w=0;
var h=0; 
var datum1={'x':0,'y':0,'n':0};
var datum2={'x':0,'y':0,'n':0};
var offset={'x':0,'y':0};
var spinOffset={'x':0,'y':0};
var arc={};
var dim={};
var selectionBox={}; // for box select
var selection=[]; // list of elements in selectionBox
var selectedPoints=[]; // list of selected points in line or shape
var anchor=false; // flags existance of anchor
// var db=null; // indexed database holding SVG elements
var dims=[]; // array of links between elements and dimensions
var layers=[]; // array of layer objects
var layer=0;
var thisLayerOnly=false; // limit select & edit to current layer?
var memory=[]; // holds element states to allow undo
var blueline=null; // bluePolyline
var path=''; // bluePath definition
var set=null; // current set
var setID=null; // id of current set
var lineType='solid'; // default styles
var lineStyle='square';
var lineColor='black';
var pen=0.25; // 0.25mm at 1:1 scale - increase for smaller scales (eg.12.5 at 1:50 scale)
var fillType='solid';
var fillColor='white';
var opacity='1';
var blur=0;
var textSize=5; // default text size
var textFont='sans-serif'; // sans-serif font
var textStyle='fine'; // normal text
var currentDialog=null;
var sizes=['A4','A5','21cm square','15x10cm','18x13cm','20x15cm','25x20cm'];
var widths=[297,210,210,150,180,200,250.210,148,210,100,130,150,200];
var heights=[210,148,210,100,130,150,200,297,210,210,150,180,200,250];
class Point {
    constructor(x,y) {
        this.x=x;
        this.y=y;
    }
}
class StringPoint {
    constructor(string) {
    	var n=string.indexOf(',');
    	this.x=Number(string.substring(0,n));
    	this.y=Number(string.substring(n+1));
    }
}
scr.w=window.innerWidth; // scr.w=screen.width;
scr.h=window.innerHeight; // scr.h=screen.height;
dwg.x=dwg.y=0;
// console.log("screen size "+scr.w+"x"+scr.h);
name=window.localStorage.getItem('name');
size=window.localStorage.getItem('size');
aspect=window.localStorage.getItem('aspect');
scale=window.localStorage.getItem('scale');
gridSize=window.localStorage.getItem('gridSize');
gridSnap=window.localStorage.getItem('gridSnap');
layerData=window.localStorage.getItem('layers');
if(name===null) name='unnamed';
if(size===null) size=0;
if(scale===null) scale=1;
if(!gridSize) gridSize=300;
if(!gridSnap) gridSnap=0;
// console.log('grid checked: '+id('gridSnap').checked);
// console.log('name: '+name+'; aspect: '+aspect+'; scale: '+scale+'; grid: '+gridSize+' '+gridSnap);
if(!layerData) { // initialise layers first time
	layers=[];
	for(var i=0;i<10;i++) {
		layers[i]={};
		layers[i].name='';
		layers[i].show=(i<0)?true:false; // start just showing first drawing layer...
		layers[i].checked=(i<0)?true:false;
	}
	layer=0;
	for(var i=1;i<10;i++) {
		id('layerName'+i).value=layers[i].name;
	}
	var data={};
    data.layers=[];
    for(i=0;i<10;i++) {
    	data.layers[i]={};
    	data.layers[i].name=layers[i].name;
    	data.layers[i].show=layers[i].show;
    }
	var json=JSON.stringify(data);
	// console.log('layers JSON: '+json);
	window.localStorage.setItem('layers',json);
}
else { // use saved layers
	var json=JSON.parse(layerData);
	layers=json.layers;
}
// console.log(layers.length+' layers - layer[0] visible? '+layers[0].show);
for(var i=0;i<10;i++) { // set layers dialog
	id('layer'+i).checked=layers[i].checked;
	if(layers[i].checked) layer=i;
	id('layerName'+i).value=layers[i].name;
	if(!layers[i].name) id('layerName'+i).value='';
	id('layerCheck'+i).checked=layers[i].show;
	id('layer').innerText=layer;
}
if(!aspect) {
    aspect=(scr.w>scr.h)?'landscape':'portrait';
    id('drawingAspect').innerText=aspect;
    showDialog('newDrawingDialog',true);
}
else initialise();
document.addEventListener('contextmenu',event=>event.preventDefault()); // disable annoying pop-up menu
// TOOLS
id('layersButton').addEventListener('click',function() {
	showDialog('layerDialog',true);
});
for(var i=0;i<10;i++) {
	id('layer'+i).addEventListener('change',setLayers);
	id('layerName'+i).addEventListener('change',setLayers);
	id('layerCheck'+i).addEventListener('click',setLayerVisibility);
}
id('thisLayerOnly').addEventListener('change',function() {
	thisLayerOnly=id('thisLayerOnly').checked;
	// console.log('this layer only is '+thisLayerOnly);
});
id('docButton').addEventListener('click',function() {
	id('drawingName').innerHTML=name;
    id('drawingSize').innerHTML=sizes[size];
    id('drawingScale').innerHTML=scale;
    id('drawingAspect').innerHTML=aspect;
    id('gridSnap').checked=(gridSnap>0)?true:false;
    // console.log('grid is '+gridSnap);
    showDialog('docDialog',true);
});
id('gridSnap').addEventListener('change',function() {
   gridSnap=(id('gridSnap').checked)?1:0;
   window.localStorage.setItem('gridSnap',gridSnap);
   // console.log('grid is '+gridSnap);
});
id('gridSize').addEventListener('change',function() {
    gridSize=parseInt(id('gridSize').value);
    window.localStorage.setItem('gridSize',gridSize);
    // console.log('grid is '+gridSize);
});
id('new').addEventListener('click',function() {
    // console.log("show newDrawingDialog - screen size: "+scr.w+'x'+scr.h);
    showDialog('newDrawingDialog',true);
});
id('createNewDrawing').addEventListener('click',function() {
	size=id('sizeSelect').value;
	aspect=id('aspectSelect').value;
    scale=id('scaleSelect').value;
    // console.log('create new drawing - size:'+size+'('+sizes[size]+') aspect:'+aspect+' scale:'+scale);
    var index=parseInt(size);
    if(aspect=='portrait') index+=7;
    dwg.w=widths[index];
    dwg.h=heights[index];
    // console.log('drawing size '+dwg.w+'x'+dwg.h+'(index: '+index+')');
    window.localStorage.setItem('size',size);
    window.localStorage.setItem('aspect',aspect);
    window.localStorage.setItem('scale',scale);
    name='';
    window.localStorage.setItem('name',name);
    index=0;
    // CLEAR DRAWING IN HTML & DATABASE
    id('dwg').innerHTML=''; // clear drawing
    layer=0; // reset layers
	for(var i=0;i<10;i++) {
		id('layer'+i).checked=layers[i].checked=(i==0); // select current layer 0
		id('layerName'+i).value=layers[i].name='';
		id('layerCheck'+i).checked=layers[i].show=(i==0); // start with just layer 0 visible
		id('layer').innerText=layer;
	}
	setLayers();
    id('handles').innerHTML=''; // clear any edit handles
    graphs=[];
    sets=[];
    showDialog('newDrawingDialog',false);
    window.localStorage.setItem('name',name);
    initialise();
});
id('load').addEventListener('click',function() {
    id('drawing').checked=true;
    showDialog('loadDialog',true); 
});
id('confirmLoad').addEventListener('click',async function(){
	var method='drawing';
    if(id('set').checked) method='set';
	var [handle]=await window.showOpenFilePicker();
	// console.log('file handle: '+handle);
	var file=await handle.getFile();
	// console.log('load file '+file+' name: '+file.name+' type '+file.type+' '+file.size+' bytes');
    var loader=new FileReader();
    loader.addEventListener('load',function(evt) {
        	var data=evt.target.result;
        	// console.log('data: '+data.length+' bytes');
      		var json=JSON.parse(data);
      		layers=json.layers;
			var transaction=db.transaction(['graphs','sets'],'readwrite');
			var graphStore=transaction.objectStore('graphs');
			var setStore=transaction.objectStore('sets');
			if(method=='set') { // load selected set(s)
				var sets=json.sets;
				for(var i=0;i<sets.length;i++) {
					var name=sets[i].name;
		    		// console.log("add set "+name);
					var request=setStore.add(sets[i]);
					request.onsuccess=function(e) {
						console.log("set added");
					};
					request.onerror=function(e) {console.log("error adding sets");};
				}
			}
			else { // load drawing
				if(method=='drawing') {
		    	name=file.name;
		   		var n=name.indexOf('.json');
		   		name=name.substr(0,n);
		   		window.localStorage.setItem('name',name);
		   		id('dwg').innerHTML=''; // clear drawing
           		id('handles').innerHTML=''; // clear any edit handles
	    		graphStore.clear();
		    	setStore.clear();
		   		nodes=[];
		   		dims=[];
		   		size=json.size;
				window.localStorage.setItem('size',size);
	    		aspect=json.aspect;
	    		window.localStorage.setItem('aspect',aspect);
		    	scale=json.scale;
		   		window.localStorage.setItem('scale',scale);
		   		// console.log('load drawing - aspect:'+aspect+' scale:'+scale);
		   		initialise();
			}
				// reset();
	  			for(var i=0;i<json.graphs.length;i++) {
		    		// console.log('add graph '+json.graphs[i].type);
	        		var request=graphStore.add(json.graphs[i]);
	        		request.onsuccess=function(e){
	        		// console.log('saved graph');
	        	}
	  			}
	        	for(i=0;i<json.sets.length;i++) {
		       	// console.log('add set '+json.sets[i].name);
		       	request=setStore.add(json.sets[i]);
		   	}
			}
			transaction.oncomplete=function() {
            	if(method=='drawing') load();
            	else if(method=='set') listSets();
            	else listImages();
			}
        });
	loader.addEventListener('error',function(event) {
        	console.log('load failed - '+event);
    	});
    loader.readAsText(file);
    // }
    showDialog('loadDialog',false);
});
id('save').addEventListener('click',function() {
    // name=window.localStorage.getItem('name');
    // if(name) id('saveName').value=name;
    showDialog('saveDialog',true);
});
id('confirmSave').addEventListener('click',async function() {
    if(id('data').checked) {
    	// console.log('save data to json file');
    	var data={};
    	if(name) data.name=name;
    	data.layers=layers;
    	data.size=size;
    	data.aspect=aspect;
    	data.scale=scale;
    	data.graphs=[];
    	data.sets=[];
    	var transaction=db.transaction(['graphs','sets']);
    	var request=transaction.objectStore('graphs').openCursor();
    	request.onsuccess=function(event) {
    		var cursor=event.target.result;
        	if(cursor) {
            	delete cursor.value.id;
            	data.graphs.push(cursor.value);
            	// data.graphs[index]=cursor.value;
            	cursor.continue();
        	}
        	else {
            	// console.log('save '+data.graphs.length+' graphs');
        		request=transaction.objectStore('sets').openCursor();
        		request.onsuccess=function(event) {
                	cursor=event.target.result;
                	if(cursor) {
                    	// console.log('set: '+cursor.value.name);
                    	delete cursor.value.id; // SHOULDN'T NEED THIS
                    	data.sets.push(cursor.value);
                    	cursor.continue();
                	}
                	else {
                    	// console.log('save '+data.sets.length+' sets');
                	}
            	}
        	}
    	}
    	transaction.oncomplete=function() {
    		// console.log('ready to save drawing data to file');
    		var json=JSON.stringify(data);
    		write(name,json,'json');
    	}
    }
    else if(id('print').checked) {
    	// console.log('save drawing as SVG');
    	id('datumSet').style.display='none';
    	var content='<svg xmlns="http://www.w3.org/2000/svg" width="'+dwg.w+'mm" height="'+dwg.h+'mm" viewBox="0 0 '+dwg.w+' '+dwg.h+'">';
    	var elements=id('dwg').children;
    	for(var i=0;i<elements.length;i++) {
    		var el=elements[i];
    		// console.log('element '+el+': '+el.outerHTML+'; style: '+el.getAttribute('style')+'; fillType: '+el.getAttribute('fillType'));
    		if(el.getAttribute('style')===null) content+=el.outerHTML;
    		else if(el.getAttribute('style').indexOf('none')<0) content+=el.outerHTML;
    		if(el.getAttribute('fillType').startsWith('pattern')) {
    			// console.log('PATTERN FILL: pattern'+el.id);
	    		content+=id('pattern'+el.id).outerHTML; // include pattern definition
    		}
    	}
    	content+='</svg>';
    	// console.log('SVG: '+content);
    	write(name,content,'svg');
		id('datumSet').style.display='block';
    }
    else { // save set(s)
    	var selectedSets=[];
    	var request=db.transaction('sets','readonly').objectStore('sets').openCursor();
    	request.onsuccess=function(event) {
    		var cursor=event.target.result;
        	if(cursor) {
				var setName=cursor.value.name;
				if(id('$'+setName).checked) selectedSets.push({name:setName, svg:cursor.value.svg});
            	cursor.continue();
        	}
        	else {
            	// console.log('all sets checked '+selectedSets.length+' selected');
            	var json='{"sets":[';
            	for(var i=0;i<selectedSets.length;i++) {
            		json+='{"name":"'+selectedSets[i].name+'","svg":"'+selectedSets[i].svg+'"}';
            		if(i<selectedSets.length-1) json+=','; // separate sets
            	};
            	json+=']}';
            	// console.log('save sets JSON: '+json);
            	write('',json,'json');
        	}
    	}
		request.onerror=function(e) { console.log('failed to check setst');}
    }
    showDialog('saveDialog',false);
});
id('zoomInButton').addEventListener('click',function() {
    zoom*=2;
    // console.log('zoom in to '+zoom);
    snapD/=2; // avoid making snap too easy
    handleR/=2; // avoid oversizing edit handles
    rezoom();
});
id('zoomOutButton').addEventListener('click',function() {
    zoom/=2;
    // console.log('zoom out to '+zoom);
    snapD*=2;
    handleR*=2;
    rezoom();
});
id('extentsButton').addEventListener('click',function() {
    zoom=1;
    dwg.x=0;
    dwg.y=0;
    rezoom();
});
id('panButton').addEventListener('click',function() {
    mode='pan';
});
// DRAWING TOOLS
id('curveButton').addEventListener('click',function() {
    mode='curve';
    hint('CURVE: drag from start',3);
});
id('lineButton').addEventListener('click',function() {
    mode='line';
    showInfo(true,'LINE',layer,'drag from start');
});
id('boxButton').addEventListener('click',function() {
    mode='box';
    rad=0;
    showInfo(true,'BOX',layer,'drag from corner');
});
id('ovalButton').addEventListener('click',function() { // OVAL/CIRCLE
    mode='oval';
    showInfo(true,'OVAL',layer,'drag from centre');
})
id('arcButton').addEventListener('click', function() {
   mode='arc';
   showInfo(true,'ARC',layer,'drag from start');
});
id('textButton').addEventListener('click',function() {
    mode='text';
    hint('TEXT: tap at start');
});
id('textOKbutton').addEventListener('click',function() {
	var text=id('text').value;
	// console.log('text: '+text);
	if(element) { // change selected text
        element.innerHTML=text;
        updateGraph(element.id,['text',text],true);
    }
    else {
        // console.log('add text '+text+' - '+textFont+','+textStyle+','+textSize);
        var graph={}
	    graph.type='text';
	    graph.text=text;
	    graph.x=x0;
        graph.y=y0;
        graph.spin=0;
        graph.flip=0;
        graph.textSize=textSize;
        graph.textFont=textFont;
        graph.textStyle=textStyle;
        graph.fillType='solid';
	    graph.fill=lineColor;
	    graph.opacity=opacity;
	    graph.layer=layer;
	    var el=addGraph(graph);
    }
    cancel();
})
id('dimButton').addEventListener('click',function() {
   mode='dimStart';
   hint('DIMENSION: tap start node');
});
id('confirmDim').addEventListener('click',function() {
    dim.dir=document.querySelector('input[name="dimDir"]:checked').value;
    // console.log(dim.dir+' selected');
    showDialog('dimDialog',false);
    id('blueDim').setAttribute('x1',dim.x1);
    id('blueDim').setAttribute('y1',dim.y1);
    id('blueDim').setAttribute('x2',(dim.dir=='v')? dim.x1:dim.x2);
    id('blueDim').setAttribute('y2',(dim.dir=='h')? dim.y1:dim.y2);
    id('guides').style.display='block';
    hint('DIMENSION: drag to position');
    mode='dimPlace';
});
id('setButton').addEventListener('click',function() {
    showDialog('setDialog',true);
});
id('setList').addEventListener('change',function() {
    // console.log('choose '+event.target.value);
    setID=event.target.value;
    // console.log('set '+setID+' picked');
	// console.log('place set '+setID);
    var graph={};
	graph.type='set';
	graph.name=setID;
	graph.x=30*scale;
	graph.y=30*scale;
	graph.spin=0;
	graph.flip=0;
	graph.layer=layer;
	addGraph(graph);
    id('setList').value=null; // clear selection for next time
    showDialog('setDialog',false);
});
// EDIT TOOLS
id('addButton').addEventListener('click',function() { // add point after selected point in line/shape
    var t=type(element);
    if((t!='line')&&(t!='shape')) return; // can only add points to lines/shapes
    // console.log('add point');
    var points=id('bluePolyline').points;
    if(points.length>9) {
    	hint('10 node limit');
    	cancel();
    }
    else {
    	hint('ADD POINT: tap on previous point');
    	mode='addPoint';
    }
});
id('deleteButton').addEventListener('click',function() {
	if(selection.length>1) {
		for(var i=0;i<selection.length;i++) // console.log('delete '+selection[i]);
		showDialog('removeDialog',true);
		return;
	}
	var t=graph.type;
    // var t=type(element);
    if((t=='line')||(t=='shape')) {
    	console.log('delete points from graph# '+index+' graph type is '+graph.type);
    	var points=graph.points;
        if(selectedPoints.length>0) {  // remove >1 selected points
            hint('DELETE selected points');
            var pts=[];
            for(var i=0;i<points.length;i++) {
                if(selectedPoints.indexOf(i)>=0) continue;
                var pt={'x':points[i].x,'y':points[i].y};
            }
            graph.points=pts;
            draw();
            cancel();
        }
        else { // remove individual point
            var n=points.length;
            if(((t=='line')&&(n>2))||((t=='shape')&&(n>3))) { // if minimum number of nodes, just remove element
                hint('DELETE: tap circle handle to remove element or a disc handle to remove a node');
                mode='removePoint'; // remove whole element or one point
                return;
            }
        }
    }
    // console.log('element is '+elID);
    showDialog('removeDialog',true);
});
id('confirmRemove').addEventListener('click',function() { // complete deletion
    if(selection.length>0) {
        while(selection.length>0) remove(selection.pop());
    }
    else remove(index); // WAS remove(elID);
    element=index=null;
    id('handles').innerHTML=''; // remove edit handles...
    id('selection').innerHTML=''; // ...selection shading,...
    id('blueBox').setAttribute('width',0); // ...and text outline...
    id('blueBox').setAttribute('height',0);
    showDialog('removeDialog',false);
    cancel();
});
id('backButton').addEventListener('click',function() {
    var previousElement=element.previousSibling;
    if(previousElement===null) {
        hint('already at back');
        return;
    }
    var previousID=previousElement.getAttribute('id');
    id('dwg').insertBefore(element,previousElement); // move back in drawing...
    swopGraphs(previousID,element.id); // ...and in database
    element.id--;
});
id('forwardButton').addEventListener('click',function() {
    var nextElement=element.nextSibling;
    if(nextElement===null) {
        hint('already at front');
        return;
    }
    var nextID=nextElement.getAttribute('id');
    // console.log('bring '+type(element)+'('+element.id+') in front of '+type(nextElement)+'('+nextID+')');
    id('dwg').insertBefore(nextElement,element); // bring forward in drawing.
	swopGraphs(element.id,nextID); // ...and in database
    element.id++;
});
id('moveButton').addEventListener('click',function() {
    // console.log('move '+type(element));
    if(type(element)=='dim') return; // cannot move dimensions
    showDialog('textDialog',false);
    showDialog('moveDialog',true);
});
id('confirmMove').addEventListener('click',function() {
    // read move parameters and adjust element
    var moveX=getValue('moveRight'); //parseInt(id('moveRight').value);
    var moveY=getValue('moveDown'); //parseInt(id('moveDown').value);
    var moveD=getValue('moveDist'); //parseInt(id('moveDist').value);
    var moveA=getValue('moveAngle'); //parseInt(id('moveAngle').value);
    // console.log('move '+moveX+','+moveY+' '+moveD+'@'+moveA);
    if((moveD!=0)&&(moveA!=0)) { // polar coordinates - convert to cartesian
        moveA-=90;
        moveA*=Math.PI/180;
        moveX=moveD*Math.cos(moveA);
        moveY=moveD*Math.sin(moveA);
    }
    if(selection.length<1) selection.push(index);
    re('member'); // remember positions/points/spins/flips for all selected elements
    if(selectedPoints.length>0) { // move all selected points in a line or shape...
        var points=element.points;
        while(selectedPoints.length>0) {
            var n=selectedPoints.pop();
            points[n].x+=moveX;
            points[n].y+=moveY;
        }
        updateGraph(index,['points',element.getAttribute('points')]);
    }
    else
    move(moveX,moveY);
    showDialog('moveDialog',false);
    cancel();
});
id('spinButton').addEventListener('click',function() {
    showDialog('spinDialog',true);
});
id('confirmSpin').addEventListener('click',function() {
    var spin=getValue('spinAngle'); // Number(id('spinAngle').value);
    if(selection.length<1) selection.push(index);
    // console.log('spin '+selection.length+' elements by '+spin+' degrees');
    re('member');
    var axis=null;
    if(anchor) { // spin around an anchor
        axis={};
        axis.x=parseInt(id('anchor').getAttribute('x'));
        axis.y=parseInt(id('anchor').getAttribute('y'));
    }
    else if(selection.length>1) { // spin around mid-point of multiple elements
        var el=id(selection[0]);
        var box=getBounds(el);
        var minX=box.x;
        var maxX=box.x+box.width;
        var minY=box.y;
        var maxY=box.y+box.height;
        console.log('first box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
        for(var i=1;i<selection.length;i++) {
            el=id(selection[i]);
            box=getBounds(el);
            if(box.x<minX) minX=box.x;
            if((box.x+box.width)>maxX) maxX=box.x+box.width;
            if(box.y<minY) minY=box.y;
            if((box.y+box.height)>maxY) maxY=box.y+box.height;
        }
        console.log('overall box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
        axis={};
        axis.x=(minX+maxX)/2;
        axis.y=(minY+maxY)/2;
    }
    // if(axis) console.log('axis: '+axis.x+','+axis.y); else console.log('no axis');
    while(selection.length>0) {
    	index=selection.pop();
        element=id(index);
        graph=graphs[index];
        var ox=0; // element origin
        var ox=0;
        // switch(type(element)) 
        switch(graph.type)
    	{ // elements spin around origin
            case 'line':
            case 'shape':
                ox=graph.points[0].x;
                oy=graph.points[0].y;
                break;
            case 'box':
                ox=graph.x+graph.width/2; // parseInt(element.getAttribute('x'))+parseInt(element.getAttribute('width'))/2;
                oy=graph.y+graph.height/2; // parseInt(element.getAttribute('y'))+parseInt(element.getAttribute('height'))/2;
                break;
            case 'text':
            case 'set':
                ox=graph.x; // parseInt(element.getAttribute('x'));
                oy=graph.y; // parseInt(element.getAttribute('y'));
                break;
            case 'oval':
            case 'arc':
                ox=graph.cx; // parseInt(element.getAttribute('cx'));
                oy=graph.cy; // parseInt(element.getAttribute('cy'));
        }
        var netSpin=parseInt(element.getAttribute('spin'));
        // console.log('change spin from '+netSpin);
        netSpin+=spin;
        // console.log('to '+netSpin);
        
        element.setAttribute('spin',netSpin);
        updateGraph(index,['spin',netSpin]);
        setTransform(element);
        if(axis) { // reposition elements, spinning around axis
            console.log('spin element '+index+' around '+axis.x+','+axis.y);
            dx=ox-axis.x;
            dy=oy-axis.y;
            var d=Math.sqrt(dx*dx+dy*dy);
            var a=Math.atan(dy/dx);
            if(dx<0) spin+=180;
            a+=(spin*Math.PI/180);
            console.log('spin is '+spin+'; a is '+a);
            x=axis.x+d*Math.cos(a);
            y=axis.y+d*Math.sin(a);
            dx=x-ox;
            dy=y-oy;
            console.log('shift '+dx+','+dy);
            move(dx,dy); // move(element,dx,dy);
        }
    }
    showDialog('spinDialog',false);
    draw();
    cancel();
})
id('flipButton').addEventListener('click',function() {
    if(type(element)=='dim') return; // cannot flip dimensions
    // console.log('show flip dialog');
    showDialog('flipDialog',true);
});
id('flipOptions').addEventListener('click',function() {
    var opt=Math.floor((event.clientX-parseInt(id('flipDialog').offsetLeft)+5)/32);
    // console.log('click on '+opt); // 0: horizontal; 1: vertical
    var axis={};
    var elNodes=null;
    var el=id(selection[0]);
    var box=getBounds(el);
    var minX=box.x;
    var maxX=box.x+box.width;
    var minY=box.y;
    var maxY=box.y+box.height;
    // console.log('first box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    for(var i=1;i<selection.length;i++) {
        el=id(selection[i]);
        box=getBounds(el);
        if(box.x<minX) minX=box.x;
        if((box.x+box.width)>maxX) maxX=box.x+box.width;
        if(box.y<minY) minY=box.y;
        if((box.y+box.height)>maxY) maxY=box.y+box.height;
    }
    // console.log('overall box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    if(anchor) { // flip around anchor
        axis.x=parseInt(id('anchor').getAttribute('x'));
        axis.y=parseInt(id('anchor').getAttribute('y'));
    }
    else { // flip in-situ around mid-point
        axis.x=(minX+maxX)/2;
        axis.y=(minY+maxY)/2;
    }
    // console.log('axis: '+axis.x+','+axis.y);
    re('member');
    while(selection.length>0) { // for each selected item...
        index=selection.shift();
        graph=graphs[index];
        element=id(index);
        // console.log('flip '+type(el)+' element '+el.id);
        switch (type(el)) {
            case 'line': // reverse x-coord of each point and each node
            case 'shape':
                var points=graph.points;
                for(i=0;i<points.length;i++) {
                    if(opt<1) {
                        dx=points[i].x-axis.x;
                        points[i].x=axis.x-dx;
                    }
                    else {
                        dy=points[i].y-axis.y;
                        points[i].y=axis.y-dy;
                    }
                }
                break;
            case 'box':
                var spin=graph.spin; // parseInt(el.getAttribute('spin'));
                if(spin!=0) {graph.spin*=-1;}
                break;
            case 'oval':
            	if(opt<1) {
            		var dx=graph.cx-axis.x; // Number(el.getAttribute('cx'))-axis.x;
            		x=axis.x-dx
            		graph.cx=x;
            	}
            	else {
            		var dy=graph.cy-axis.y; // Number(el.getAttribute('cy'))-axis.y;
            		y=axis.y-dy;
            		graph.cy=y;
            	}
                var spin=graph.spin; // parseInt(el.getAttribute('spin'));
                if(spin!=0) {
                    graph.spin*=-1; // spin*=-1;
                }
                break;
            case 'arc':
                if(opt<1) { // flip left-right
                	dx=graph.cx-axis.x;
                    graph.cx=axis.x-dx;
                    dx=graph.x1-axis.x;
                    graph.x1=axis.x-dx;
                    dx=graph.x2-axis.x;
                    graph.x2=axis.x-dx;
                }
                else {
                	dy=graph.cy-axis.y;
                    graph.cy=axis.y-dy;
                    dy=graph.y1-axis.y;
                    graph.y1=axis.y-dy;
                    dy=graph.y2-axis.y;
                    graph.y2=axis.y-dy;
                }
                graph.sweep=(arc.sweep<1)? 1:0; // CHECK THIS
                break;
            case 'text':
                showDialog('textDialog',false);
                var flip=graph.flip; // parseInt(el.getAttribute('flip'));
                if(opt<1) { // flip left-right
                        // console.log('current flip: '+flip);
                        graph.flip^=1; // toggle horizontal flip;
                        dx=graph.x-axis.x; // parseInt(el.getAttribute('x'))-axis.x;
                        graph.x=axis.x-dx; // el.setAttribute('x',(axis.x-dx));
                    }
                else { // flip top-bottom
                        graph.flip^=2; // toggle vertical flip
                        dy=graph.y-axis.y; // parseInt(el.getAttribute('y'))-axis.y;
                        graph.y=axis.y-dy; // el.setAttribute('y',(axis.y-dy));
                    }
                break;
            case 'set':
                var flip=graph.flip; // parseInt(el.getAttribute('flip'));
                if(opt<1) { // flip left-right
                    // console.log('current flip: '+flip);
                    flip^=1; // toggle horizontal flip;
                    dx=graph.ax-axis.x; // parseInt(el.getAttribute('ax'))-axis.x;
                    graph.ax=axis.x-dx; // el.setAttribute('ax',(axis.x-dx));
                }
                else { // flip top-bottom
                    flip^=2; // toggle vertical flip
                    dy=graph.ay-axis.y; // parseInt(el.getAttribute('ay'))-axis.y;
                    graph.ay=axis.y-dy; // el.setAttribute('ay',(axis.y-dy));
                }
                // refreshNodes(el);
                w=graph.x; // parseInt(el.getAttribute('x'));
                h=graph.y; // parseInt(el.getAttribute('y'));
                var hor=flip&1;
                var ver=flip&2;
                var t='translate('+(hor*w)+','+(ver*h/2)+') ';
                t+='scale('+((hor>0)? -1:1)+','+((ver>0)? -1:1)+')';
                graph.flip=flip; // el.setAttribute('flip',flip);
                graph.transform= t; // el.setAttribute('transform',t);
                break;
        }
    }
    draw();
    cancel();
    if(anchor) {
        id('blue').removeChild(id('anchor'));
        anchor=false;
    }
    showDialog('flipDialog',false);
});
id('alignButton').addEventListener('click',function() {
    showDialog('alignDialog',true);
});
id('alignOptions').addEventListener('click',function() {
    x0=parseInt(id('alignDialog').offsetLeft)+parseInt(id('alignOptions').offsetLeft);
    y0=parseInt(id('alignDialog').offsetTop)+parseInt(id('alignOptions').offsetTop);
    // console.log('alignOptions at '+x0+','+y0);
    x=Math.floor((event.clientX-x0+5)/32); // 0-2
    y=Math.floor((event.clientY-y0+5)/32); // 0 or 1
    // console.log('x: '+x+' y: '+y);
    var opt=y*3+x; // 0-5
    // console.log('option '+opt);
    var el=id(selection[0]);
    var box=getBounds(el);
    var minX=box.x;
    var maxX=box.x+box.width;
    var minY=box.y;
    var maxY=box.y+box.height;
    // console.log('first box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    for(var i=1;i<selection.length;i++) {
        el=id(selection[i]);
        box=getBounds(el);
        if(box.x<minX) minX=box.x;
        if((box.x+box.width)>maxX) maxX=box.x+box.width;
        if(box.y<minY) minY=box.y;
        if((box.y+box.height)>maxY) maxY=box.y+box.height;
    }
    var midX=(minX+maxX)/2;
    var midY=(minY+maxY)/2;
    // console.log('overall box '+minX+'-'+maxX+'x'+minY+'-'+maxY);
    re('member');
    for(i=0;i<selection.length;i++) {
    	index=selecton[i];
    	graph=graphs[index];
    	element=id(index);
        // el=id(selection[i]);
        box=getBounds(element);
        // console.log('move '+el.id+'?');
        switch(opt) {
            case 0: // align left
                if(box.x>minX) move((minX-box.x),0);
                break;
            case 1: // align centre left-right
                x=Number(box.x)+Number(box.width)/2;
                if(x!=midX) move((midX-x),0); 
                break;
            case 2: // align right
                x=Number(box.x)+Number(box.width);
                if(x<maxX) move((maxX-x),0);
                break;
            case 3: // align top
                if(box.y>minY) move(0,(minY-box.y));
                break;
            case 4: // align centre top-bottom
                y=Number(box.y)+Number(box.height)/2;
                if(y!=midY) move(0,(midY-y));
                break;
            case 5: // align bottom
                // console.log('align bottom');
                y=Number(box.y)+Number(box.height);
                if(y<maxY) move(0,(maxY-y));
        }
    }
    showDialog('alignDialog',false);
    cancel();
});
id('copyButton').addEventListener('click',function() {
	// console.log('copy '+selection.length+' elements');
	for(var i=0;i<selection.length;i++) {
		index=selection[i];
		graph=graphs[index];
		element=id(index);
		copy(0,0); // copy in place
	}
	draw();
	cancel();
});
id('doubleButton').addEventListener('click',function() {
    // console.log(selection.length+' elements selected: '+elID);
    if(selection.length!=1) return; // can only double single selected...
    var t=type(element); // ...line, shape, box, oval or arc elements
    if((t=='text')||(t=='dim')||(t=='set')||(t=='anchor')) return;
    showDialog('doubleDialog',true);
});
id('confirmDouble').addEventListener('click',function() {
    // console.log('DOUBLE');
    var d=getValue('offset'); // parseInt(id('offset').value);
    // console.log('double offset: '+d+'mm');
    showDialog('doubleDialog',false);
    var g={}; // initiate new element
    g.type=type(element);
    g.layer=layer;
    switch(g.type) {
        case 'line':
            var points=element.points;
            var count=points.length;
            var pts=[count]; // points in new line
            var i=0; // counter
            for(i=0;i<count;i++) {
                pts[i]=new Point();
                // console.log('pt '+i+': '+pts[i].x+','+pts[i].y);
            }
            var p=new Point(); // current point
            var p1=new Point(); // next point
            var a=null; // slope of current and...
            var a0=null; // ...previous segment
            var b=null; // y-offset for current and...
            var b0=null; // ...previous segment
            var n=null; // normal to current line segment
            i=0;
            while(i<count-1) {
                a=b=null;
                p.x=points[i].x;
                p.y=points[i].y;
                p1.x=points[i+1].x;
                p1.y=points[i+1].y;
                // console.log('segment '+i+' '+p.x+','+p.y+' to '+p1.x+','+p1.y);
                if(p.x==p1.x) { // vertical
                	console.log('vertical');
                    a='v';
                    if((p1.y-p.y)>0) pts[i].x=pts[i+1].x=p.x-d;
                    else pts[i].x=pts[i+1].x=p.x+d;
                    if(i<1) pts[0].y=p.y; // start point
                }
                else if(p.y==p1.y) { // horizontal
                	console.log('horizontal');
                    a='h';
                    if((p1.x-p.x)>0) pts[i].y=pts[i+1].y=p.y+d;
                    else pts[i].y=pts[i+1].y=p.y-d;
                    if(i<1) pts[0].x=p.x; // start point
                }
                else { // sloping
                	console.log('sloping');
                    a=((p1.y-p.y)/(p1.x-p.x)); // slope of line (dy/dx)
                    n=Math.atan((p1.x-p.x)/(p1.y-p.y)); // angle of normal to line
                    // console.log('line slope: '+a+'; normal: '+(180*n/Math.PI));
                    if(p1.y>=p.y) {
                        p.x-=d*Math.cos(n);
                        p.y+=d*Math.sin(n);
                    }
                    else {
                        p.x+=d*Math.cos(n);
                        p.y-=d*Math.sin(n);
                    }
                    b=p.y-a*p.x;
                    console.log('new segment function: y='+a+'.x+'+b);
                    if(i<1) {
                        pts[0].x=p.x;
                        pts[0].y=p.y;
                    }
                    else { // fix previous point
                        if(a0=='v') pts[i].y=a*pts[i].x+b; // previous segment was vertical - x already set
                        else if(a0=='h') pts[i].x=(pts[i].y-b)/a; // previous segment was horizontal - y set
                        else { // previous segment was sloping
                            pts[i].x=(b-b0)/(a0-a);
                            pts[i].y=a*pts[i].x+b;
                        }
                    }
                }
                a0=a; // remember function values for segment
                b0=b;
                i++;
            }
            // end point...
            console.log('end point is point '+i+' '+p1.x+','+p1.y);
            if(a0=='h') { // last segment horizontal
                pts[i].x=p1.x;
                if(p1.x>p.x) pts[1].y=p1.y+d;
                else pts[i].y=p1.y-d;
            }
            else if(a0=='v') { // last segment vertical
            	if(p1.y>p.y) pts[1].x=p1.x-d;
                else pts[i].x=p1.x+d;
                pts[i].y=p1.y;
            }
            else { // last segment sloping
                if(p1.y>=p.y) {
                    p1.x-=d*Math.cos(n);
                    p1.y+=d*Math.sin(n);
                }
                else {
                    p1.x+=d*Math.cos(n);
                    p1.y-=d*Math.sin(n);
                }
                pts[i].x=p1.x;
                pts[i].y=p1.y;
            }
            g.points='';
            for(i=0;i<count;i++) {
                // console.log('point '+i+': '+pts[i].x+','+pts[i].y);
                g.points+=pts[i].x+','+pts[i].y+' ';
            }
            g.spin=element.getAttribute('spin');
            break;
        case 'shape':
            var points=element.points;
            var count=points.length; // eg. 3-point shape (triangle) has 3 sides
            var pts=[count]; // points in new line
            var i=0; // counter
            for(i=0;i<count;i++) {
                pts[i]=new Point();
                // console.log('pt '+i+': '+pts[i].x+','+pts[i].y); // JUST CHECKING
            }
            var p=new Point(); // current point
            var p1=new Point(); // next point
            var a=null; // slope of current and...
            var a0=null; // ...previous side
            var b=null; // y-offset for current and...
            var b0=null; // ...previous side
            var n=null; // normal to current line side
            i=0;
            while(i<=count) {
                a=b=null;
                // console.log(' point '+i+' ie: '+i%count);
                p.x=points[i%count].x;
                p.y=points[i%count].y;
                p1.x=points[(i+1)%count].x;
                p1.y=points[(i+1)%count].y;
                // console.log('side '+i+' '+p.x+','+p.y+' to '+p1.x+','+p1.y);
                if(p.x==p1.x) { // vertical
                    a='v';
                    if(p1.y>p.y) pts[i%count].x=pts[(i+1)%count].x=p.x-d;
                    else pts[i%count].x=pts[(i+1)%count].x=p.x+d;
                    if(i>0) {
                        if(a0=='v') pts[i%count].y=p.y; // continues previous segment
                        else if(a0=='h') pts[i%count].y=pts[(i-1)%count].y; // previous side was horizontal
                        else pts[i%count].y=a0*pts[i%count].x+b0; // previous side was sloping
                    }
                }
                else if(p.y==p1.y) { // horizontal
                    a='h';
                    if(p1.x>p.x) pts[i%count].y=pts[(i+1)%count].y=p.y+d;
                    else pts[i%count].y=pts[(i+1)%count].y=p.y-d;
                    if(i>0) {
                        if(a0=='h') pts[i%count].x=p.x; // continues previous segment
                        else if(a0=='v') pts[i%count].x=pts[(i-1)%count].x; // previous segment was vertical
                        else pts[i%count].x=(pts[i%count].y-b0)/a0; // previous side was sloping
                    }
                }
                else { // sloping
                    a=((p1.y-p.y)/(p1.x-p.x)); // slope of line (dy/dx)
                    n=Math.atan((p1.x-p.x)/(p1.y-p.y)); // angle of normal to line
                    // console.log('line slope: '+a+'; normal: '+(180*n/Math.PI));
                    if(p1.y>=p.y) {
                        p.x-=d*Math.cos(n);
                        p.y+=d*Math.sin(n);
                    }
                    else {
                        p.x+=d*Math.cos(n);
                        p.y-=d*Math.sin(n);
                    }
                    b=p.y-a*p.x;
                    // console.log('new segment function: y='+a+'.x+'+b);
                    if(i>0) { // fix previous point
                        // console.log('fix previous point - a0 is '+a0);
                        if(a0=='v') pts[i%count].y=a*pts[i%count].x+b; // previous side was vertical - x already set
                        else if(a0=='h') pts[i%count].x=(pts[i%count].y-b)/a; // previous side was horizontal - y set
                        else if(a0==a) { // continues slope of previous segment
                            pts[i%count].x=p.x;
                            pts[i%count].y=p.y;
                        }
                        else { // previous side was sloping
                            // console.log('fix point '+i+' a:'+a+' a0:'+a0+' b:'+b+' b0:'+b0);
                            pts[i%count].x=(b-b0)/(a0-a);
                            pts[i%count].y=a*pts[i%count].x+b;
                        }
                    }
                }
                a0=a; // remember function values for segment
                b0=b;
                i++;
            }
            g.points='';
            for(i=0;i<count;i++) {
                // console.log('point '+i+': '+pts[i].x+','+pts[i].y);
                g.points+=pts[i].x+','+pts[i].y+' ';
            }
            g.spin=element.getAttribute('spin');
            break;
        case 'box':
            x=graph.x; // Number(element.getAttribute('x'));
            y=graph.y; // Number(element.getAttribute('y'));
            w=graph.width; // Number(element.getAttribute('width'));
            h=graph.height; // Number(element.getAttribute('height'));
            if((d<0)&&((w+2*d<1)||(h+2*d<1))) {
                alert('cannot fit inside');
                return;
            }
            g.x=x-d;
            g.y=y-d;
            g.spin=graph.spin; // element.getAttribute('spin');
            g.width=2*d+w;
            g.height=2*d+h;
            var r=graph.radius; // parseInt(element.getAttribute('rx'));
            // console.log('corner radius: '+r);
            if(r!=0) r+=d;
            if(r<0) r=0;
            g.radius=r;
            g.layer=layer;
            // console.log('double as '+n);
            break;
        case 'oval':
            x=parseInt(element.getAttribute('cx'));
            y=parseInt(element.getAttribute('cy'));
            var rx=parseInt(element.getAttribute('rx'));
            var ry=parseInt(element.getAttribute('ry'));
            if((d<0)&&((rx+d)<1)||((ry+d)<1)) {
                alert('cannot fit inside');
                return;
            }
            g.cx=x;
            g.cy=y;
            g.rx=rx+d;
            g.ry=ry+d;
            g.spin=element.getAttribute('spin');
            break;
        case 'arc':
            console.log('double arc - offset: '+d);
            var r=graph.r+d; // new arc radius
            if(r<0) {
                alert('cannot fit inside');
                return;
            }
            g.r=r;
            r/=graph.r; // ratio of new/old radii
            g.cx=graph.cx; // same centre point
            g.cy=graph.cy;
            dx=graph.x1-graph.cx; // calculate new start point
            dy=graph.y1-graph.cy;
            dx*=r;
            dy*=r;
            g.x1=graph.cx+dx;
            g.y1=graph.cy+dy;
            dx=graph.x2-graph.cx; // calculate new end point
            dy=graph.y2-graph.cy;
            dx*=r;
            dy*=r;
            g.x2=graph.cx+dx;
            g.y2=graph.cy+dy;
            g.major=graph.major;
            g.sweep=graph.sweep;
            g.spin=graph.spin;
    }
    g.stroke=element.getAttribute('stroke');
    g.lineW=element.getAttribute('stroke-width');
    if(element.getAttribute('stroke-linecap')=='round') g.lineStyle='round';
    else g.lineStyle='square';
    g.lineStyle=element.getAttribute('')
    g.lineType=getLineType(element);
    g.fillType=element.getAttribute('fillType');
    g.fill=element.getAttribute('fill');
    n=element.getAttribute('fill-opacity');
    if(n) g.opacity=n;
    addGraph(g);
    cancel();
});
id('repeatButton').addEventListener('click',function() {
    if(type(element)=='dim') return; // cannot move dimensions
    showDialog('textDialog',false);
    showDialog('repeatDialog',true);
});
id('confirmRepeat').addEventListener('click',function() {
    var nH=getValue('countH');
    var nV=getValue('countV');
    var dH=getValue('distH');
    var dV=getValue('distV');
    console.log(nH+' copies across at '+dH+'mm; '+nV+' copies down at '+dV+'mm');
    for(var i=0;i<nH;i++) {
    	for(var j=0;j<nV;j++) {
    		if((i==0)&&(j==0)) continue; // original
    		copy(i*dH,j*dV);
    	}
    }
    showDialog('repeatDialog',false);
    cancel();
});
id('filletButton').addEventListener('click',function() {
    if(type(element!='box')) return; // can only fillet box corners
    id('filletR').value=parseInt(element.getAttribute('rx'));
    showDialog('filletDialog',true);
});
id('confirmFillet').addEventListener('click',function() {
    re('member');
    var r=parseInt(id('filletR').value);
    console.log('set corner radius to '+r);
    graph.radius=r;
    showDialog('filletDialog',false);
    showInfo(false);
    draw();
    cancel();
});
id('anchorButton').addEventListener('click',function() {
    mode='anchor';
    hint('ANCHOR: tap a node');
});
id('joinButton').addEventListener('click',function() {
    id('setName').value='';
    if((selection.length>1)&&anchor) showDialog('joinDialog',true);
    else alert('Please place an anchor for the set');
});
id('confirmJoin').addEventListener('click',function() {
    var name=id('setName').value;
    if(!name) {
        alert('Enter a name for the set');
        return;
    }
    var ax=parseInt(id('anchor').getAttribute('x'));
    var ay=parseInt(id('anchor').getAttribute('y'));
    var json='{"name":"'+name+'","svg":"';
    // sort selected elements in order drawn
    var elements=id('dwg').children;
    // console.log(elements.length+' elements'+elements);
    var set=[];
    for(var i=0;i<elements.length;i++) {
    	if(selection.includes(elements[i].id)) set.push(elements[i]);
    }
    // console.log('set of elements: '+set);
    for(i=0;i<set.length;i++) {
        el=set[i];
        var t=type(el);
        // console.log('add '+t+' element?');
        if((t=='dim')||(t=='set')) continue; // don't include dimensions or sets
        switch(type(el)) {
            case 'line':
                var points=el.points;
                // console.log('line points: '+points);
                var pts='';
                for(var j=0;j<points.length;j++) {
                	var point=points.getItem(j);
                	pts+=(point.x-ax)+','+(point.y-ay)+' ';
                }
                json+="<polyline points=\'"+pts+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'shape':
                var points=el.points;
                var pts='';
                for(var j=0;j<points.length;j++) pts+=(points[i].x-ax)+','+(points[i].y-ay)+' ';
                json+="<polygon points=\'"+pts+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'box':
                json+="<rect x=\'"+(parseInt(el.getAttribute('x'))-ax)+"\' y=\'"+(parseInt(el.getAttribute('y'))-ay)+"\' ";
                json+="width=\'"+el.getAttribute('width')+"\' height=\'"+el.getAttribute('height')+"\' rx=\'"+el.getAttribute('rx')+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'oval':
                json+="<ellipse cx=\'"+(parseInt(el.getAttribute('cx'))-ax)+"\' cy=\'"+(parseInt(el.getAttribute('cy'))-ay)+"\' ";
                json+="rx=\'"+el.getAttribute('rx')+"\' ry=\'"+el.getAttribute('ry')+"\' spin=\'"+el.getAttribute('spin')+"\' ";
                break;
            case 'arc':
                graph.cx-=ax;
                graph.cy-=ay;
                graph.x1-=ax;
                graph.y1-=ay;
                graph.x2-=ax;
                graph.y2-=ay;
                d='M'+graph.cx+','+graph.cy+' M'+graph.x1+','+graph.y1+' A'+graph.r+','+graph.r+' 0 '+graph.major+','+graph.sweep+' '+graph.x2+','+graph.y2;
                json+="<path d=\'"+d+"\' spin=\'"+graph.spin+"\' ";
                break;
            case 'text': // +','+
            	// console.log('x,y is '+el.getAttribute('x')+','+el.getAttribute('y'));
                json+="<text x=\'"+(parseInt(el.getAttribute('x'))-ax)+"\' y=\'"+(parseInt(el.getAttribute('y'))-ay)+"\' ";
                // console.log('json so far '+json);
                json+="spin=\'"+el.getAttribute('spin')+"\' flip=\'"+el.getAttribute('flip')+"\' ";
                json+="stroke=\'"+el.getAttribute('stroke')+"\' fill=\'"+el.getAttribute('fill')+"\' ";
                json+="font-family=\'"+el.getAttribute('font-family')+"\' font-style=\'"+el.getAttribute('font-style')+"\' ";
                json+="font-size=\'"+el.getAttribute('font-size')+"\' font-weight=\'"+el.getAttribute('font-weight')+"\' ";
                json+="text=\'"+el.getAttribute('text')+"\'";
                json+=">"+el.getAttribute('text')+"</text>";
        }
        if(t!='text') { // set style and complete svg
            json+="stroke=\'"+el.getAttribute('stroke')+"\' stroke-width=\'"+el.getAttribute('stroke-width')+"\' ";
            var val=el.getAttribute('stroke-dasharray');
            if(val) json+="stroke-dasharray=\'"+val+"\' ";
            json+="fill=\'"+el.getAttribute('fill')+"\' ";
            val=el.getAttribute('fill-opacity');
            if(val) json+="fill-opacity=\'"+val+"\'";
            json+="/>";
        }
        // console.log('JSON so far: '+json);
    }
    json+='"}';
    // console.log('save set JSON: '+json);
    sets.push(json);
    window.localStorage.setItem('sets',sets);
    listSets();
    // addSet(json);
    showDialog('joinDialog',false);
});
id('returnButton').addEventListener('click',cancel);
// STYLES
id('line').addEventListener('click',function() {
    showDialog('stylesDialog',true);
});
id('lineType').addEventListener('change',function() {
    var type=event.target.value;
    if(selection.length>0) {
    	for (var i=0;i<selection.length;i++) {
    		// console.log('change line width for selected element '+i);
    		var n=selection[i];
    		console.log('set line type for graph '+n+' to '+type);
    		graphs[n].lineType=type;
    	}
    	draw();
    }
    else { // change default line type
        lineType=type;
    }
    id('line').style.borderBottomStyle=type;
});
id('lineStyle').addEventListener('change',function() {
	var style=event.target.value;
	if(selection.length>0) {
		for(var i=0;i<selection.length;i++) {
			var n=selection[i];
			console.log('set graph '+n+' line style to '+style);
			graphs[n].lineStyle=style;
		}
		draw();
	}
	else { // change default line style
		lineStyle=style;
	}
})
id('penSelect').addEventListener('change',function() {
    var val=event.target.value;
    if(selection.length>0) {
		var lineW=val*scale;
    	for(var i=0;i<selection.length;i++) {
    		var n=selection[i];
    		graph=graphs[n].lineW=lineW;
    	}
    	draw();
    }
    else { // change default pen width
        pen=val;
    }
    id('line').style.borderWidth=(pen/scaleF)+'px';
});
id('textSize').addEventListener('change',function() {
    var val=event.target.value;
    // console.log('set text size for '+selection.length+' items');
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var n=selection[i];
    		if(graphs[n].type=='text') graphs[n].textSize=val;
    	}
    	draw();
    }
    textSize=val; // change default text size
});
id('textFont').addEventListener('change',function() {
	var val=event.target.value;
    // console.log('set text font to '+val+' for '+selection.length+' items');
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var n=selection[i];
    		if(graphs[n].type=='text') graphs[n].textFont=val;
    	}
    	draw();
    }
    else textFont=val; // change default text font
    id('textFont').value=val;
});
id('textStyle').addEventListener('change',function() {
    var val=event.target.value;
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var n=selection[i];
    		if(graphs[n].type=='text') graphs[n].textStyle=val;
    	}
    	draw();
    }
    else { // change default text style
        textStyle=val;
    }
});
id('lineColor').addEventListener('click',function() {
    id('colorPicker').mode='line';
    showColorPicker(true,event.clientX-16,event.clientY-16);
});
id('fillType').addEventListener('change',function() {
    var filltype=event.target.value;
    // console.log('fill type: '+filltype);
    if(selection.length>0) {
    	var col=id('fillColor').value;
    	for (var i=0;i<selection.length;i++) {
    		// console.log('change fill type for selected element '+i);
    		var n=selection[i];
    		console.log('graph '+n+' fillType: '+graphs[n].fillType);
    		if(filltype=='pattern') {
    			showDialog('patternMenu',true);
    			return;
    		}
    		else graphs[n].fillType=filltype;
    	}
    	draw();
    }
    else { // change default fillType type
        fillType=type;
    }
    id('fill').style.background=(type=='none')?'none':fillColor;
});
id('fillColor').addEventListener('click',function() {
	// console.log('show colour menu');
	id('colorPicker').style.display='block';
	id('colorPicker').mode='fill';
	var color=showColorPicker(true,event.clientX-16,event.clientY-16);
});
id('opacity').addEventListener('change',function() {
    var val=event.target.value;
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var n=selection[i];
    		graphs[n].opacity=val;
    	}
    	draw();
    }
    else opacity=val; // change default opacity
    id('fill').style.opacity=val;
});
id('blur').addEventListener('change',function() {
    var val=event.target.value;
    // console.log('blur: '+val);
    if(selection.length>0) {
    	for(var i=0;i<selection.length;i++) {
    		var n=selection[i];
    		graphs[n].blur=val;
    	}
    	draw();
    }
    else blur=val; // change default blur
});
id('patternOption').addEventListener('click',function() {
	// console.log('click "pattern" - fill is '+element.getAttribute('fill'));
	if(element && element.getAttribute('fill').startsWith('url')) showDialog('patternMenu',true);
});
id('patternMenu').addEventListener('click',function(event) {
	x=Math.floor((event.clientX-53)/30); // column 0-4
	y=Math.floor((event.clientY-52)/30); // row 0-2
	var n=y*5+x; // 5 per row - n is 0-14
	var fill=element.getAttribute('fill'); // fill colour/pattern
	console.log('set element fill (currently '+fill+') to pattern'+n);
	if(fill.startsWith('url')) { // amend pattern choice
		var p=id('pattern'+element.id);
		var color=pattern.firstChild.getAttribute('fill');
		p.setAttribute('index',n);
		p.setAttribute('width',pattern[n].width);
		p.setAttribute('height',pattern[n].height);
		p.innerHTML=tile[pattern[n].tile];
		p.firstChild.setAttribute('fill',color);
		updateGraph(element.id,['fillType','pattern'+n]);
	}
	else { // set fill to pattern
		console.log('set pattern for element '+element.id);
		console.log(' pattern '+n+' size: '+pattern[n].width+'x'+pattern[n].height);
		var html="<pattern id='pattern"+element.id+"' index='"+n+"' width='"+pattern[n].width+"' height='"+pattern[n].height+"' patternUnits='userSpaceOnUse'";
		if((scale>1)||(pattern[n].spin!=0)) { // set transform
			html+=" patternTransform='";
			if(scale>1) html+="scale("+scale+")";
			if(pattern[n].spin!=0) html+=" rotate("+pattern[n].spin+")";
			html+="'";
		}
		html+="'>"+tile[pattern[n].tile]+'</pattern>';
		console.log('pattern HTML: '+html);
		id('defs').innerHTML+=html;
		var el=id('pattern'+element.id);
		id('pattern'+element.id).firstChild.setAttribute('fill',fill);
		id('pattern'+element.id).lastChild.setAttribute('fill',fill);
		element.setAttribute('fillType','pattern');
		element.setAttribute('fill','url(#pattern'+element.id+')');
		updateGraph(element.id,['fillType','pattern'+n]);
		
	}
});
id('colorPicker').addEventListener('click',function(e) {
	var val=e.target.id;
	showColorPicker(false);
	if(id('colorPicker').mode=='line') { // line colour
        // if(val=='white') val='blue';
        if(selection.length>0) { // change line shade of selected elements
        	for(var i=0;i<selection.length;i++) {
        		var n=selection[i];
    			console.log('change line color for graph/element '+n);
    			if(graphs[n].type=='text') graphs[n].fill=val;
    			else graphs[n].stroke=val;
        	}
        	draw();
        }
        else { // change default line colour
            // console.log('line colour: '+val);
            if(val=='white') val='black'; // cannot have white lines
            lineColor=val;
        }
        id('line').style.borderColor=val;
        id('lineColor').style.backgroundColor=val;
    }
    else { // fill colour
    	if(selection.length>0) { // change line shade of selected elements
    		for (var i=0;i<selection.length;i++) {
    			// console.log('change fill colour for selected element '+i);
    			var n=selection[i];
    			console.log('change fill color for graph/element '+n);
    			if(graphs[n].type=='text') continue; // text fill colour uses line colour
    			var fill=id('fillType').value;
        		if(fill=='pattern') { // change colour of one or two elements in pattern tile
        			id('pattern'+n).firstChild.setAttribute('fill',val);
        			id('pattern'+n).lastChild.setAttribute('fill',val);
        		}
        		// val='"'+val+'"'; // colours are strings
        		graphs[n].fill=val;
    		}
    		draw();
    	}
        else {fillColor=val;} // change default fill shade
        id('fill').style.background=val;
        id('fillColor').style.backgroundColor=val;
    }
});
// POINTER ACTIONS
id('graphic').addEventListener('pointerdown',function(e) {
    console.log('pointer down - mode is '+mode+' '+graphs.length+' graphs');
    re('wind');
    event.preventDefault();
    if(currentDialog) showDialog(currentDialog,false); // clicking drawing removes any dialogs/menus
    id('colorPicker').style.display='none';
    scr.x=Math.round(event.clientX);
    scr.y=Math.round(event.clientY);
    x=x0=Math.round(scr.x*scaleF/zoom+dwg.x);
    y=y0=Math.round(scr.y*scaleF/zoom+dwg.y);
    // ADJUST FOR RESOLUTION AT SCALE - 1mm up to 1:10, 5mm at 1:20, 10mm at 1:50 and 25mm at 1:100
    if(scale>10) { // for scales smaller than 1:10 adjust to nearest 5/10/25mm
    	if(scale==50) res=10;
    	else res=scale/4;
    	x=x0=res*Math.round(x/res);
    	y=y0=res*Math.round(y/res);
    	// console.log('x0,y0 resolved to '+x+','+y);
    }
    var val=event.target.id;
    // console.log('zoom: '+zoom+'; dwg.x: '+dwg.x);
    console.log('tap on '+scr.x+','+scr.y+'px - '+val+' x,y:'+x+','+y+' x0,y0: '+x0+','+y0);
    if(val=='anchor')  { // move selected elements using anchor
        mode='move';
        hint('drag ANCHOR to MOVE selection');
        re('member');
    }
    var holder=event.target.parentNode.id;
    // console.log('holder is '+holder);
    if((holder=='selection')&&(mode!='anchor')) { // click on a blue box to move multiple selectin
        // console.log('move group selection');
        mode='move';
        hint('drag to MOVE selection');
        re('member');
    }
    else if(holder=='handles') { // handle
        // console.log('HANDLE '+val);
        var handle=id(val);
        var bounds=getBounds(id(index));
        // console.log('bounds for element '+element.id+': '+bounds.x+','+bounds.y+' '+bounds.width+'x'+bounds.height);
        id('blueBox').setAttribute('x',bounds.x);
        id('blueBox').setAttribute('y',bounds.y);
        id('blueBox').setAttribute('width',bounds.width);
        id('blueBox').setAttribute('height',bounds.height);
        console.log('box at '+bounds.x+','+bounds.y);
        id('guides').style.display='block';
        re('member');
        if(val.startsWith('mover')) {
        	graph=graphs[index];
            node=parseInt(val.substr(5));
            x=parseFloat(handle.getAttribute('x'));
            y=parseFloat(handle.getAttribute('y'));
            console.log('mover at '+x+','+y);
    		console.log(elNodes.length+' nodes');
            if(mode=='addPoint') { // add point after start-point
            	console.log('add point after point '+node);
                console.log('graph is '+index+' - type: '+graph.type);
                var points=graph.points;
                x=Math.round((points[node].x+points[node+1].x)/2);
                y=Math.round((points[node].y+points[node+1].y)/2);
                var pnt={'x':x,'y':y};
                points.splice(node+1,0,pnt);
                graph.points=points;
                draw();
                cancel();
                return;
            }
            else if(mode=='removePoint') {
                showDialog('removeDialog',true);
                return;
            }
            console.log('move using node '+node);
            mode='move';
            hint('drag to MOVE');
            path=null;
            switch(type(element)) {
            	case 'curve':
                    x0=handle.getAttribute('x');
                    y0=handle.getAttribute('y');
                    console.log('nodes...');
                    for(var i=0;i<elNodes.length;i++) console.log('node '+i+': '+elNodes[i].x+','+elNodes[i].y);
                    path='m '+(elNodes[0].x-x)+' '+(elNodes[0].y-y);
                    for(i=1;i<elNodes.length;i++) {
                    	path+=' l '+(elNodes[i].x-elNodes[i-1].x)+' '+(elNodes[i].y-elNodes[i-1].y);
                    }
                    break;
                case 'line':
                case 'shape':
                    path='m '+(elNodes[0].x-x)+' '+(elNodes[0].y-y);
                    for(var i=1;i<elNodes.length;i++) {
                    	path+=' l '+(elNodes[i].x-elNodes[i-1].x)+' '+(elNodes[i].y-elNodes[i-1].y);
                    }
                    // console.log('line path: '+path);
                    break;
                case 'box':
                 	x0=handle.getAttribute('x');
                    y0=handle.getAttribute('y');
                    path='m '+(elNodes[0].x-x)+' '+(elNodes[0].y-y)+' l '+(elNodes[2].x-elNodes[0].x)+' '+(elNodes[2].y-elNodes[0].y);
                    path+=' l '+(elNodes[8].x-elNodes[2].x)+' '+(elNodes[8].y-elNodes[2].y);
                    path+=' l '+(elNodes[6].x-elNodes[8].x)+' '+(elNodes[6].y-elNodes[8].y);
                    path+=' l '+(elNodes[0].x-elNodes[6].x)+' '+(elNodes[0].y-elNodes[6].y);
                    // console.log('box path: '+path);
                    break;
                case 'oval':
                    x0=parseInt(element.getAttribute('cx'));
                    y0=parseInt(element.getAttribute('cy'));
                    var rx=parseInt(element.getAttribute('rx'));
        			var ry=parseInt(element.getAttribute('ry'));
                    var spin=parseInt(element.getAttribute('spin')); // degrees
                    path='m '+(elNodes[1].x-x)+' '+(elNodes[1].y-y); // move to node 1...
                    path+=' a '+rx+' '+ry+' '+spin+' 1 1 '+(elNodes[4].x-elNodes[1].x)+' '+(elNodes[4].y-elNodes[1].y); // ...and draw half oval clockwise to node 4...
                    path+=' a '+rx+' '+ry+' '+spin+' 1 1 '+(elNodes[1].x-elNodes[4].x)+' '+(elNodes[1].y-elNodes[4].y); // ...then other half back to noded 1
                    // console.log('oval path: '+path);
                    break;
                case 'arc':
                	x0=graph.cx;
                	y0=graph.cy;
                	path='m '+(graph.x1-x)+' '+(graph.y1-y); // move to start of x-arc
                    path+=' a '+graph.r+' '+graph.r+' '+' 0 '+graph.major+' '+graph.sweep+' '+(graph.x2-graph.x1)+' '+(graph.y2-graph.y1);
                    // console.log('arc path: '+path);
                    break;
                case 'text':
                    x0=element.getAttribute('x');
                    y0=element.getAttribute('y');
                    var bounds=element.getBBox();
                    offset.x=offset.y=0;
                    break;
                case 'dim':
                    id('blueBox').setAttribute('width',0);
                    id('blueBox').setAttribute('height',0);
                    mode='dimAdjust';
                    x0=parseInt(element.firstChild.getAttribute('x1'));
                    y0=parseInt(element.firstChild.getAttribute('y1'));
                    dx=parseInt(element.firstChild.getAttribute('x2'))-x0;
                    dy=parseInt(element.firstChild.getAttribute('y2'))-y0;
                    id('blueLine').setAttribute('x1',x0);
                    id('blueLine').setAttribute('y1',y0);
                    id('blueLine').setAttribute('x2',(x0+dx));
                    id('blueLine').setAttribute('y2',(y0+dy));
                    var spin=element.getAttribute('transform');
                    id('blueLine').setAttribute('transform',spin);
                    id('guides').style.display='block';
                    hint('MOVE DIMENSION (UP/DOWN)');
                    break;
                case 'set':
                    x0=element.getAttribute('x');
                    y0=element.getAttribute('y');
            }
            if(!path) {
            	console.log('offsets: '+offset.x+','+offset.y);
            	id('blueBox').setAttribute('x',x+offset.x);
            	id('blueBox').setAttribute('y',y+offset.y);
            }
            id('guides').style.display='block';
            id('graphic').addEventListener('pointermove',drag);
            return;
        }
        else if(val.startsWith('sizer')) {
        	graph=graphs[index];
            node=parseInt(val.substr(5)); // COULD GO AT START OF HANDLES SECTION?
            if(mode=='addPoint') {
                console.log('add point after point '+node);
                console.log('graph is '+index+' - type: '+graph.type);
                var points=graph.points;
                var n=points.length-1;
                if(node==n) { // append point after end-point
                    dx=points[n].x-points[n-1].x;
                    dy=points[n].y-points[n-1].y;
                    x=points[n].x+dx;
                    y=points[n].y+dy;
                    var pnt={'x':x,'y':y};
                    points.push(pnt);
                }
                else { // insert point midway between selected point and next point
                    // console.log('add between points '+node+'('+points[node].x+','+points[node].y+') and '+(node+1));
                    x=Math.round((points[node].x+points[node+1].x)/2);
                    y=Math.round((points[node].y+points[node+1].y)/2);
                    var pnt={'x':x,'y':y};
                    points.splice(node+1,0,pnt);
                }
                graph.points=points;
                draw();
                cancel();
                return;
            }
            else if(mode=='removePoint') {
                // console.log('remove point '+node);
                console.log('graph is '+index+' - type: '+graph.type);
                graph.points.splice(node,1);
                draw();
                cancel();
                return;
            }
            else hint('drag to SIZE');
            // console.log('size using node '+node);
            dx=dy=0;
            switch(graph.type) {
            	case 'curve':
                case 'line':
                case 'shape':
                	// console.log('drag sizer for '+type(element))
                    mode='movePoint'+node;
                    var points='';
                    for(var i in graph.points) {
                    	points+=graph.points[i].x+','+graph.points[i].y+' ';
                    }
                    id('bluePolyline').setAttribute('points',points);
                    id('blueBox').setAttribute('width',0);
                    id('blueBox').setAttribute('height',0);
                    id('guides').style.display='block';
                    break;
                case 'box':
                    mode='boxSize';
                    break;
                case 'oval':
                    mode='ovalSize';
                    break;
                case 'arc':
                	graph={};
                    mode='arcSize';
                    x0=graph.cx;
                    y0=graph.cy;
                    id('blueBox').setAttribute('width',0);
                    id('blueBox').setAttribute('height',0);
                    id('blueOval').setAttribute('cx',x0); // circle for radius
                    id('blueOval').setAttribute('cy',y0);
                    id('blueOval').setAttribute('rx',graph.r);
                    id('blueOval').setAttribute('ry',graph.r);
                    id('blueLine').setAttribute('x1',x0); // prepare radius
                    id('blueLine').setAttribute('y1',y0);
                    id('blueLine').setAttribute('x2',x0);
                    id('blueLine').setAttribute('y2',y0);
                    id('guides').style.display='block';
                	break;
            }
            id('graphic').addEventListener('pointermove',drag);
            return;
        }
    }
    snap=snapCheck(); //  JUST DO if(snapCheck())?
    // console.log('SNAP: '+snap);
    if(snap) { // snap start/centre to snap target
        x0=x;
        y0=y;
    }
    // console.log('mode: '+mode);
    switch(mode) {
    	case 'curve':
            blueline=id('bluePolyline');
            var point=id('svg').createSVGPoint();
            point.x=x;
            point.y=y;
            blueline.points[0]=point;
            id('guides').style.display='block';
            // console.log('start point: '+x+','+y+'; points: '+blueline.points);
            break;
        case 'line':
            blueline=id('bluePolyline');
            var point=id('svg').createSVGPoint();
            point.x=x;
            point.y=y;
            if(blueline.points.length>1) {
                point=blueline.points[blueline.points.length-1];
                x0=point.x;
                y0=point.y;
            }
            else if(blueline.points.length>0) blueline.points[0]=point;
            blueline.points.appendItem(point);
            // refreshNodes(blueline); // set blueline nodes to match new point
            id('guides').style.display='block';
            hint('LINES: drag to next point; tap twice to end lines or on start to close shape');
            break;
        case 'box':
            id('blueBox').setAttribute('x',x0);
            id('blueBox').setAttribute('y',y0);
            id('guides').style.display='block';
            hint('drag to size');
            break;
        case 'oval':
            id('blueOval').setAttribute('cx',x0);
            id('blueOval').setAttribute('cy',y0);
            id('guides').style.display='block';
            hint('drag to size');
            break;
        case 'arc':
            arc.x1=x0;
            arc.y1=y0;
            hint('ARC: drag to centre');
            id('blueLine').setAttribute('x1',arc.x1);
            id('blueLine').setAttribute('y1',arc.y1);
            id('blueLine').setAttribute('x2',arc.x1);
            id('blueLine').setAttribute('y2',arc.y1);
            id('guides').style.display='block';
            console.log('start arc at '+arc.x1+','+arc.y1);
            break;
        case 'text':
            // console.log('show text dialog');
            id('text').value='';
            showDialog('textDialog',true);
            mode='writing';
            break;
        case 'writing':
    		if(e.target!=textDialog) // console.log('MISS');
    		cancel();
    		break;
        case 'set':
            // console.log('place set '+setID+' at '+x0+','+y0);
            var graph={};
	        graph.type='set';
            graph.name=setID;
            graph.x=x0;
            graph.y=y0;
            graph.spin=0;
	        graph.flip=0;
	        addGraph(graph);
	        cancel();
            break;
        case 'select':
        case 'pointEdit':
            id('selectionBox').setAttribute('x',x0);
            id('selectionBox').setAttribute('y',y0);
            id('guides').style.display='block';
            selectionBox.x=x0;
            selectionBox.y=y0;
            selectionBox.w=selectionBox.h=0;
    }
    event.stopPropagation();
    if(mode!='set') id('graphic').addEventListener('pointermove',drag);
    console.log('exit pointer down code - graphs: '+graphs.length);
});
function drag(event) {
	console.log('dragging - mode: '+mode+' - '+graphs.length+' graphs');
    event.preventDefault();
    id('datumSet').style.display='block'; // show datum lines while dragging
    scr.x=Math.round(event.clientX);
    scr.y=Math.round(event.clientY);
    x=Math.round(scr.x*scaleF/zoom+dwg.x);
    y=Math.round(scr.y*scaleF/zoom+dwg.y);
    if((Math.abs(x-x0)<snapD)&&(Math.abs(y-y0)<snapD)) return; // ignore tiny drag
    // ADJUST FOR RESOLUTION AT SCALE - 1mm up to 1:10, 5mm at 1:20, 10mm at 1:50 and 25mm at 1:100
    if(scale>10) { // for scales smaller than 1:10 adjust to nearest 5/10/25mm
    	if(scale==50) res=10;
    	else res=scale/4;
    	x=res*Math.round(x/res);
    	y=res*Math.round(y/res);
    	// console.log('x,y resolved to '+x+','+y);
    }
    if(mode!='arcEnd') {
        snap=snapCheck(); // snap to nearby nodes, datum,...
        if(!snap) {
            if(Math.abs(x-x0)<snapD) x=x0; // ...vertical...
            if(Math.abs(y-y0)<snapD) y=y0; // ...or horizontal
        }
    }
    if(mode.startsWith('movePoint')) {
        var n=parseInt(mode.substr(9));
        // console.log('drag polyline point '+n);
        id('bluePolyline').points[n].x=x;
        id('bluePolyline').points[n].y=y;
    }
    else switch(mode) {
    	case 'curve':
            dx=x-x0;
            dy=y-y0;
            var d=Math.sqrt(dx*dx+dy*dy)*scale;
            if((d>10*scale)&&(blueline.points.length<10)) {
                console.log('add point');
                var point=id('svg').createSVGPoint();
                point.x=x;
                point.y=y;
                blueline.points.appendItem(point);
                x0=x;
                y0=y;
                if(blueline.points.length>9) hint('MAXIMUM 10 NODES');
            }
            break;
        case 'move':
            if(selection.length>1) { // move multiple selection
                dx=x-x0;
                dy=y-y0;
                id('selection').setAttribute('transform','translate('+dx+','+dy+')');
            }
            else { // drag  single element
            	console.log('move '+graph.type); // (element));
            	if(path) { // moving curve, line/shape, box, oval or arc
            		var d='M '+Number(x)+' '+Number(y)+path;
            		console.log('bluePath: '+d);
            		id('bluePath').setAttribute('d',d);
            	}
            	else { // moving text, dimension, set
            		id('blueBox').setAttribute('x',Number(x)+Number(offset.x));
               		id('blueBox').setAttribute('y',Number(y)+Number(offset.y));
            	}
            }
            if(anchor) {
                id('anchor').setAttribute('x',x);
                id('anchor').setAttribute('y',y);
            }
            setSizes('polar',null,x0,y0,x,y);
            break;
        case 'boxSize':
            var aspect=w/h;
            dx=x-x0;
            dy=y-y0;
            if(Math.abs(dx)<(snapD*2)) dx=0; // snap to equal width,...
            else if(Math.abs(dy)<(snapD*2)) dy=0; // ...equal height,... 
            else if((w+dx)/(h+dy)>aspect) dy=dx/aspect; // ...or equal proportion
            else dx=dy*aspect;
            x=parseInt(element.getAttribute('x'));
            y=parseInt(element.getAttribute('y'));
            w=parseInt(element.getAttribute('width'));
            h=parseInt(element.getAttribute('height'));
            w+=dx;
            h+=dy;
            id('blueBox').setAttribute('width',w);
            id('blueBox').setAttribute('height',h);
            setSizes('box',null,w,h);
            break;
        case 'ovalSize':
        	var aspect=w/h;
        	dx=x-x0;
            dy=y-y0;
            if(Math.abs(dx)<(snapD*2)) dx=0; // snap to equal width,...
            else if(Math.abs(dy)<(snapD*2)) dy=0; // ...equal height,... 
            else if((w+dx)/(h+dy)>aspect) dy=dx/aspect; // ...or equal proportion
            else dx=dy*aspect;
            x=parseInt(element.getAttribute('cx')); // centre
            y=parseInt(element.getAttribute('cy'));
            w=parseInt(element.getAttribute('rx'))*2; // overall size
            h=parseInt(element.getAttribute('ry'))*2;
            x-=w/2; // top/left
            y-=h/2;
            x-=dx;
            y-=dy;
            w+=dx*2;
            h+=dy*2;
            id('blueBox').setAttribute('x',x);
            id('blueBox').setAttribute('y',y);
            id('blueBox').setAttribute('width',w);
            id('blueBox').setAttribute('height',h);
            setSizes('oval',null,w,h);
            break;
        case 'arcSize':
            dx=x-x0;
            dy=y-y0;
            var r=Math.sqrt((dx*dx)+(dy*dy));
            if(Math.abs(r-graph.r)<snapD) { // change angle but not radius
                id('blueLine').setAttribute('x2',x);
                id('blueLine').setAttribute('y2',y);
                id('blueOval').setAttribute('rx',graph.r);
                id('blueOval').setAttribute('ry',graph.r);
                var a=Math.atan(dy/dx); // radians
                a=a*180/Math.PI+90; // 'compass' degrees
                if(dx<0) a+=180;
                id('second').value=a; // new angle
            }
            else { // change radius but not angle
                id('blueOval').setAttribute('rx',r);
                id('blueOval').setAttribute('ry',r);
                id('blueLine').setAttribute('x2',x0);
                id('blueLine').setAttribute('y2',y0);
                id('first').value=r; // new radius
            }
            break;
        case 'pan':
            dx=dwg.x-(x-x0);
            dy=dwg.y-(y-y0);
            id('svg').setAttribute('viewBox',dx+' '+dy+' '+(scr.w*scaleF/zoom)+' '+(scr.h*scaleF/zoom));
            id('paper').setAttribute('viewBox',dx+' '+dy+' '+(scr.w*scaleF/zoom)+' '+(scr.h*scaleF/zoom));
            break;
        case 'line':
            if(Math.abs(x-x0)<snapD) x=x0; // snap to vertical
            if(Math.abs(y-y0)<snapD) y=y0; // snap to horizontal
            var n=blueline.points.length;
            var point=blueline.points[n-1];
            point.x=x;
            point.y=y;
            blueline.points[n-1]=point;
            setSizes('polar',null,x0,y0,x,y);
            break;
        case 'box':
            w=Math.abs(x-x0);
            h=Math.abs(y-y0);
            if(Math.abs(w-h)<snapD*2) w=h; // snap to square
            var left=(x<x0)?(x0-w):x0;
            var top=(y<y0)?(y0-h):y0;
            id('blueBox').setAttribute('x',left);
            id('blueBox').setAttribute('y',top);
            id('blueBox').setAttribute('width',w);
            id('blueBox').setAttribute('height',h);
            setSizes('box',null,w,h);
            break;
        case 'oval':
        	w=Math.abs(x-x0);
            h=Math.abs(y-y0);
            if(Math.abs(w-h)<snapD*2) w=h; // snap to circle
            id('blueOval').setAttribute('cx',x0);
            id('blueOval').setAttribute('cy',y0);
            id('blueOval').setAttribute('rx',w/2);
            id('blueOval').setAttribute('ry',h/2);
            setSizes('oval',null,w,h);
            break;
        case 'arc':
        	console.log('drag to arc centre from '+arc.x1+','+arc.y1);
            if(Math.abs(x-x0)<snapD) x=x0; // snap to vertical
            if(Math.abs(y-y0)<snapD) y=y0; // snap to horizontal
            w=x-x0;
            h=y-y0;
            if((Math.abs(w)<2)&&(Math.abs(h)<2)) break; // wait for significant movement
            arc.cx=x;
            arc.cy=y;
            arc.r=Math.round(Math.sqrt(w*w+h*h));
            id('blueLine').setAttribute('x2',arc.cx);
            id('blueLine').setAttribute('y2',arc.cy);
            id('blueOval').setAttribute('cx',x);
            id('blueOval').setAttribute('cy',y);
            id('blueOval').setAttribute('rx',arc.r);
            id('blueOval').setAttribute('ry',arc.r);
            setSizes('polar',null,x0,y0,x,y);
            break;
        case 'arcEnd':
            if((x==x0)&&(y==y0)) break;
            if(arc.sweep==null) {
                if(Math.abs(y-arc.cy)>Math.abs(x-arc.cx)) { // get sweep from horizontal movement
                    console.log('get sweep from x - x0: '+x0+'; x: '+x);
                    if(y<arc.cy) arc.sweep=(x>x0)?1:0; // above...
                    else arc.sweep=(x<x0)?1:0; // ...or below centre of arc
                }
                else {
                    console.log('get sweep from y');
                    if(x<arc.cx) arc.sweep=(y<y0)?1:0; // left or...
                    else arc.sweep=(y>y0)?1:0; // ...right of centre of arc
                }
                console.log('ARC sweep: '+arc.sweep);
            }
            w=x-arc.cx;
            h=y-arc.cy;
            console.log('w:'+w+' h:'+h);
            arc.a2=Math.atan(h/w); // radians clockwise from x-axis ????????????
            if(w<0) arc.a2+=Math.PI; // from -PI/2 to 1.5PI
            arc.a2+=Math.PI/2; // 0 to 2PI
            console.log('cx:'+arc.cx+' r:'+arc.r+'a2:'+arc.a2+'radians');
            arc.x2=Math.round(arc.cx+arc.r*Math.sin(arc.a2));
            console.log('x2:'+arc.x2);
            arc.y2=Math.round(arc.cy-arc.r*Math.cos(arc.a2));
            console.log('y2:'+arc.y2);
            arc.a2*=180/Math.PI; // 0-360 degrees
            x=arc.x2;
            y=arc.y2;
            x0=arc.cx;
            y0=arc.cy;
            setSizes('polar',null,x0,y0,x,y);
            id('blueRadius').setAttribute('x2',arc.x2);
            id('blueRadius').setAttribute('y2',arc.y2);
            break;
        case 'dimPlace':
            if(dim.dir=='v') {
                id('blueDim').setAttribute('x1',x);
                id('blueDim').setAttribute('x2',x);
                dim.offset=Math.round(x-dim.x1);
            }
            else if(dim.dir=='h') {
                id('blueDim').setAttribute('y1',y);
                id('blueDim').setAttribute('y2',y);
                dim.offset=Math.round(y-dim.y1);
            }
            else { // oblique dimension needs some calculation
                dx=dim.x2-dim.x1;
                dy=dim.y2-dim.y1;
                var a=Math.atan(dy/dx); // angle of line between start and end of dimension
                dx=x-x0;
                dy=y-y0;
                o=Math.sqrt(dx*dx+dy*dy);
                if((y<y0)||((y==y0)&&(x<x0))) o=o*-1;
                dim.offset=Math.round(o);
                id('blueDim').setAttribute('x1',dim.x1-o*Math.sin(a));
                id('blueDim').setAttribute('y1',dim.y1+o*Math.cos(a));
                id('blueDim').setAttribute('x2',dim.x2-o*Math.sin(a));
                id('blueDim').setAttribute('y2',dim.y2+o*Math.cos(a));
            }
            break;
        case 'dimAdjust':
            id('blueLine').setAttribute('y1',y);
            id('blueLine').setAttribute('y2',y);
            break;
        case 'select':
        case 'pointEdit':
            var boxX=(x<x0)?x:x0;
            var boxY=(y<y0)?y:y0;
            w=Math.abs(x-x0);
            h=Math.abs(y-y0);
            id('selectionBox').setAttribute('x',boxX);
            id('selectionBox').setAttribute('y',boxY);
            id('selectionBox').setAttribute('width',w);
            id('selectionBox').setAttribute('height',h);
            selectionBox.x=boxX;
            selectionBox.y=boxY;
            selectionBox.w=w;
            selectionBox.h=h;
            setSizes('box',null,w,h);
    }
    event.stopPropagation();
};
id('graphic').addEventListener('pointerup',function(e) {
	console.log('pointer up - '+graphs.length+' graphs');
	scr.x=Math.round(event.clientX);
    scr.y=Math.round(event.clientY);
    console.log('pointer up at '+scr.x+','+scr.y+' ('+x+','+y+') mode: '+mode);
    id('graphic').removeEventListener('pointermove',drag);
    id('bluePath').setAttribute('d','');
    snap=snapCheck();
    console.log('snap - x:'+snap.x+' y:'+snap.y+' n:'+snap.n);
    if(mode.startsWith('movePoint')) { // move polyline/polygon point
        id('handles').innerHTML='';
        graph=graphs[index];
        element=id(index);
        console.log('move point '+node+' on '+graph.type); // type(element));
        var points=id('bluePolyline').points;
    	// console.log('curve has '+points.length+' points');
    	graph.points=[];
    	for(var i=0;i<points.length;i++) {
    		graph.points.push({'x':points[i].x,'y':points[i].y});
    		// console.log('point '+i+': '+points[i].x+','+points[i].y);
    	}
    	console.log('graph has '+graph.points.length+' points');
    	if((Math.abs(x-x0)<snapD)&&(Math.abs(y-y0)<snapD)) { // no drag - swop to mover
            // console.log('TAP - add mover at node '+node); // node becomes new element 'anchor'
        	var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
        	id('handles').innerHTML=html;
        	mode='edit';
        	return;
    	}
    	graphs[index]=graph;
    	console.log('graph updated');
    	cancel();
    	draw();
    }
    else switch(mode) {
        case 'move':
        	console.log('move from '+x0+','+y0+' to '+x+','+y);
            id('handles').innerHTML='';
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            if(selection.length>0) {
                dx=x-x0;
                dy=y-y0;
                if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // click without dragging - deselect this element
                	var n=selection.indexOf(index);
                	// console.log('tap on selection['+n+']');
                	selection.splice(n,1); // remove from selection
                	id('selection').removeChild(id('selection').children[n]);
                	return;
                }
                // console.log('MOVED by '+dx+','+dy+' from '+x0+','+y0+' to '+x+','+y);
            }
            else selection.push(index); // move single element
            // console.log('move '+selection.length+' elements by '+dx+','+dy);
            if(anchor && (selection.length>1)) { // dispose of anchor after use
                id('blue').removeChild(id('anchor'));
                anchor=false;
            }
            console.log('move '+selection.length+' items');
            move(dx,dy);
            draw();
            cancel();
            break;
        case 'boxSize':
            console.log('pointer up - moved: '+dx+'x'+dy);
            if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // node tapped - add mover
                // console.log('TAP - add mover at node '+node);
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            id('handles').innerHTML='';
            x=id('blueBox').getAttribute('x');
            y=id('blueBox').getAttribute('y');
            w=id('blueBox').getAttribute('width');
            h=id('blueBox').getAttribute('height');
            graph=graphs[index];
            graph.width=w;
            graph.height=h;
            draw();
            cancel();
            break;
        case 'ovalSize':
            if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // node tapped - add mover
                // console.log('TAP - add mover at node '+node);
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            id('handles').innerHTML='';
            x=Number(id('blueBox').getAttribute('x'));
            y=Number(id('blueBox').getAttribute('y'));
            w=Number(id('blueBox').getAttribute('width'));
            h=Number(id('blueBox').getAttribute('height'));
            graph=graphs[index];
            graph.cx=x+w/2;
            graph.cy=y+h/2;
            graph.rx=w/2;
            graph.ry=h/2;
            draw();
            cancel();
            break;
        case 'arcSize':
            if((Math.abs(dx)<snapD)&&(Math.abs(dy)<snapD)) { // node tapped - add mover
                // console.log('TAP - add mover at node '+node);
                var html="<use id='mover"+node+"' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('handles').innerHTML=html;
                mode='edit';
                return;
            }
            dx=x-x0;
            dy=y-y0;
            r=Math.sqrt((dx*dx)+(dy*dy));
            // console.log('pointer up - radius: '+r);
            graph=graphs[index];
            if(Math.abs(r-graph.r)<snapD) { // radius unchanged - set angle
            	console.log('radius unchanged');
                var a=Math.atan(dy/dx);
                if(node<2) {
                    graph.x1=x0+graph.r*Math.cos(a);
                    graph.y1=y0+graph.r*Math.sin(a);
                }
                else {
                    graph.x2=x0+graph.r*Math.cos(a);
                    graph.y2=y0+graph.r*Math.sin(a);
                }
            }
            else { // radius changed - adjust arc start...
            console.log('radius changed');
                dx=graph.x1-graph.cx;
                dy=graph.y1-graph.cy;
                dx*=r/graph.r;
                dy*=r/graph.r;
                graph.x1=graph.cx+dx;
                graph.y1=graph.cy+dy; // ...and end points...
                dx=graph.x2-graph.cx;
                dy=graph.y2-graph.cy;
                dx*=r/graph.r;
                dy*=r/graph.r;
                graph.x2=graph.cx+dx;
                graph.y2=graph.cy+dy; // ...and radius 
                graph.r=r;
            }
            draw();
            cancel();
            break;
        case 'pan':
            // console.log('pan ends at '+x+','+y);
            dwg.x-=(x-x0);
            dwg.y-=(y-y0);
            if((Math.abs(x-x0)<snapD)&&(Math.abs(y-y0)<snapD)) mode='select'; // tap to exit pan mode
            break;
        case 'curve':
            // console.log('end curve');
            var points=id('bluePolyline').points;
            console.log(points.length+' blueline points - first: '+points[0].x+','+points[0].y);
            var graph={};
	        graph.type='curve';
	        graph.points=[];
	        for(var i=0;i<points.length;i++) {
	        	console.log('point '+i+': '+points[i].x+','+points[i].y);
	        	graph.points.push({'x':points[i].x,'y':points[i].y});
	        }
	        console.log('graph.points: '+graph.points.length+' - starts at '+graph.points[0].x+','+graph.points[0].y);
	        graph.spin=0;
	        graph.stroke=lineColor;
	        graph.lineW=pen*scale;
	        graph.lineType=lineType;
	        graph.lineStyle=lineStyle;
	        if(lineType=='none') graph.lineStyle='solid'; // cannot have empty stroke
	        graph.fillType='none';
	        graph.fill=fillColor;
	        graph.opacity=opacity;
	        graph.blur=blur;
	        graph.layer=layer;
	        addGraph(graph);
	        blueline.setAttribute('points','0,0');
            cancel();
            break;
        case 'line':
            // console.log('pointer up - blueline is '+blueline.id);
            var n=blueline.points.length;
            if(snap) {  // adjust previous point to snap target
                blueline.points[n-1].x=x;
                blueline.points[n-1].y=y;
            }
            var d=Math.sqrt((x-x0)*(x-x0)+(y-y0)*(y-y0));
            if((d<snapD)||(n>9)) { // click/tap to finish polyline - capped to 10 points
                console.log('END LINE');
                if(d<snapD) hint('shape closed');
                else if(n>9) hint('10 node limit');
                var points=id('bluePolyline').points;
                console.log('points: '+points.length);
                // create polyline element
                graph={};
	            graph.type='line';
	            graph.x=points[0].x;
                graph.y=points[0].y;
                console.log('line.x/y: '+points[0].x+','+points[0].y);
                graph.points=[];
                var pt={'x':graph.x,'y':graph.y};
                graph.points.push(pt);
                for(var i=1;i<points.length;i++) {
                	if((points[i].x==points[i-1].x)&&(points[i].y==points[i-1].y)) continue;
                	else graph.points.push({'x':points[i].x,'y':points[i].y});
                }
	            var len=0;
	            for(var i=0;i<points.length-1;i++) {
	            	console.log('point '+i+': '+points[i].x+','+points[i].y);
	                if(i>0) len+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);
	            }
	            console.log('linelength: '+len);
	            graph.spin=0;
	            graph.stroke=lineColor;
	            graph.lineW=(pen*scale);
	            graph.lineType=lineType;
	        	graph.lineStyle=lineStyle;
	            graph.fillType='none';
	            graph.fill='none';
	            graph.layer=layer;
	            if(len>=scale) addGraph(graph); // avoid zero-size lines
	            blueline.setAttribute('points','0,0');
	            cancel();
            }
            else { // check if close to start point
                point=blueline.points[0]; // start point
                // console.log('at '+x+','+y+' start at '+point.x+','+point.y);
                dx=x-point.x;
                dy=y-point.y;
                var d=Math.sqrt(dx*dx+dy*dy);
                if(d<snapD) { // close to start - create shape
                    // console.log('CLOSE SHAPE');
                    var points=blueline.points;
                    // var points=id('bluePolyline').points;
                    // console.log('points: '+points);
                    graph={}; // create polygon element
                    graph.type='shape';
                    var points=id('bluePolyline').points;
                    graph.x=points[0].x;
                	graph.y=points[0].y;
                	graph.points=[];
                	for(var i=0;i<points.length-1;i++) {
                		graph.points.push({'x':points[i].x,'y':points[i].y});
                	}
                    /*
                    graph.x=blueline.points[0].x;
                    graph.y=blueline.points[0].y;
                    // console.log('line.x/.y: '+graph.x+','+graph.y);
                    graph.points=''; // ***** JUST DO GRAPH.POINTS=BLUELINE.POINTS??? ******
                    var len=0;
	                for(var i=0;i<points.length-1;i++) {
	                    graph.points+=(points[i].x+','+points[i].y+' ');
	                    if(i>0) len+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);
	                }
	                */
	                graph.spin=0;
	                graph.stroke=lineColor;
	                graph.lineW=(pen*scale);
	                graph.lineType=lineType;
	        		graph.lineStyle=lineStyle;
	                graph.fillType=fillType;
	                graph.fill=fillColor;
	                graph.layer=layer;
	                if(len>=scale) addGraph(graph); // avoid zero-size shapes
	                blueline.setAttribute('points','0,0');
	                cancel();
                }
            }
            break;
        case 'shape':
            if(snap) {  // adjust previous point to snap target
                var n=element.points.length;
                var point=element.points[n-1];
                point.x=x;
                point.y=y;
                element.points[n-1]=point;
            }
            point=element.points[0]; // start point
            // console.log('at '+x+','+y+' start at '+point.x+','+point.y);
            dx=x-point.x;
            dy=y-point.y;
            var d=Math.sqrt(dx*dx+dy*dy);
            if((d>snapD)&&(n<11)) break; // check if close to start point - if not, continue but cap at 10 sides
            // console.log('end polyline & create shape');
            var points=id('bluePolyline').points;
            // console.log('points: '+points);
            var graph={}; // create polygon element
            graph.type='shape';
            graph.points=[];
            var len=0;
	        for(var i=0;i<points.length-1;i++) {
	        	graph.points.push({'x':points[i].x,'y':points[i].y});
	            // graph.points+=(points[i].x+','+points[i].y+' ');
	            if(i>0) len+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);
	        }
	        graph.spin=0;
	        graph.stroke=lineColor;
	        if(lineType=='none') graph.stroke='none';
	        graph.lineW=(pen*scale);
	        graph.lineType=lineType;
	        graph.lineStyle=lineStyle;
	        graph.fillType=fillType;
	        graph.fill=fillColor;
	        graph.layer=layer;
	        if(len>=scale) addGraph(graph); // avoid zero-size shapes
	        id('bluePolyline').setAttribute('points','0,0');
	        cancel();
            break;
        case 'box':
            // console.log('finish box');
            var graph={}
	        graph.type='box';
	        graph.x=parseInt(id('blueBox').getAttribute('x'));
	        graph.y=parseInt(id('blueBox').getAttribute('y'));
	        graph.width=w;
	        graph.height=h;
	        graph.radius=rad;
	        graph.spin=0;
	        graph.stroke=lineColor;
	        if(lineType=='none') graph.stroke='none';
	        graph.lineW=pen*scale;
	        graph.lineType=lineType;
	        graph.lineStyle=lineStyle;
	        graph.fillType=fillType;
	        graph.fill=fillColor;
	        graph.opacity=opacity;
	        graph.blur=blur;
	        graph.layer=layer;
	        if((graph.width>=scale)&&(graph.width>=scale)) addGraph(graph); // avoid zero-size boxes
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            cancel();
            break;
        case 'oval':
            var graph={};
	        graph.type='oval';
	        graph.cx=parseInt(id('blueOval').getAttribute('cx'));
	        graph.cy=parseInt(id('blueOval').getAttribute('cy'));
	        graph.rx=w/2;
	        graph.ry=h/2;
	        graph.spin=0;
	        graph.stroke=lineColor
	        graph.lineType=lineType;
	        graph.lineStyle=lineStyle;
	        graph.lineW=pen*scale;
	        graph.fillType=fillType;
	        graph.fill=fillColor;
	        graph.opacity=opacity;
	        graph.layer=layer;
	        if((graph.rx>=scale)&&(graph.ry>=scale)) addGraph(graph); // avoid zero-size ovals
		    id('blueOval').setAttribute('rx',0);
            id('blueOval').setAttribute('ry',0);
            cancel();
            break;
        case 'arc':
            arc.cx=x;
            arc.cy=y;
            console.log('arcCentre: '+arc.cx+','+arc.cy);
            w=arc.x1-arc.cx; // radii
            h=arc.y1-arc.cy;
            arc.r=Math.sqrt(w*w+h*h); // arc radius
            console.log('arc radii: '+w+'x'+h+'='+arc.r);
            arc.a1=Math.atan(h/w); // start angle - radians clockwise from x-axis NO!!
            if(w<0) arc.a1+=Math.PI; // from -PI/2 to +1.5PI
            arc.a1+=Math.PI/2; // 0 to 2PI
            arc.a1*=180/Math.PI; // 0-180 degrees
            console.log('START ANGLE: '+arc.a1+'; radius: '+arc.r);
            arc.sweep=null; // determine sweep when move pointer
            arc.major=0; // always starts with minor arc
            x0=arc.x1;
            y0=arc.y1;
            id('blueRadius').setAttribute('x1',arc.cx); // draw blue arc radius with arrows
            id('blueRadius').setAttribute('y1',arc.cy); 
            id('blueRadius').setAttribute('x2',arc.x1); 
            id('blueRadius').setAttribute('y2',arc.y1);
            mode='arcEnd';
            break;
        case 'arcEnd':
            console.log('END ANGLE: '+arc.a2);
            var a=arc.a2-arc.a1;
            if(a<0) a+=360;
            if(arc.sweep<1) a=360-a;
            arc.major=(Math.abs(a)>180)? 1:0;
            console.log('arc angle: '+a+'deg; major: '+arc.major+'; sweep: '+arc.sweep);
            var graph={};
            graph.type='arc';
	        graph.cx=arc.cx; // centre coordinates
	        graph.cy=arc.cy;
	        graph.x1=arc.x1; // start point
	        graph.y1=arc.y1;
	        graph.x2=arc.x2; // end point
	        graph.y2=arc.y2;
	        graph.r=arc.r; // radius
	        graph.major=arc.major; // major/minor arc - 1/0
	        graph.sweep=arc.sweep; // direction of arc - 1: clockwise, 0: anticlockwise
	        graph.spin=0;
	        graph.stroke=lineColor
	        graph.lineType=lineType;
	        graph.lineStyle=lineStyle;
	        graph.lineW=pen*scale;
	        graph.fillType='none'; // arcs default to no fill
	        graph.opacity=1;
	        graph.layer=layer;
	        if((graph.r>=scale)&&(a!=0)) addGraph(graph); // avoid zero-size arcs
            id('blueOval').setAttribute('rx',0);
            id('blueOval').setAttribute('ry',0);
            id('blueLine').setAttribute('x1',0);
            id('blueLine').setAttribute('y1',0);
            id('blueLine').setAttribute('x2',0);
            id('blueLine').setAttribute('y2',0);
            id('blueRadius').setAttribute('x1',0);
            id('blueRadius').setAttribute('y1',0);
            id('blueRadius').setAttribute('x2',0);
            id('blueRadius').setAttribute('y2',0);
            cancel();
            break;
        case 'dimStart':
            if(snap) {
                // console.log('SNAP - start dimension at '+x+','+y+'; node '+snap.n);
                dim.x1=x;
                dim.y1=y;
                dim.n1=snap.n;
                dim.dir=null;
                mode='dimEnd';
                hint('DIMENSION: tap end node');
            break;
            }
            else hint('DIMENSION: tap start node')
            break;
        case 'dimEnd':
            if(snap) {
                // console.log('SNAP - end dimension at '+x+','+y+'; node '+snap.n);
                dim.x2=x;
                dim.y2=y;
                // dim.el2=snap.el;
                dim.n2=snap.n;
                if(dim.x1==dim.x2) dim.dir='v'; // vertical
                else if(dim.y1==dim.y2) dim.dir='h'; // horizontal
                if(dim.dir) {
                    id('blueDim').setAttribute('x1',dim.x1);
                    id('blueDim').setAttribute('y1',dim.y1);
                    id('blueDim').setAttribute('x2',dim.x2);
                    id('blueDim').setAttribute('y2',dim.y2);
                    id('guides').style.display='block';
                    hint('DIMENSION: drag to position');
                    mode='dimPlace';
                }
                else showDialog('dimDialog',true);
                // console.log('dimension direction: '+dim.dir);
            }
            else hint('Tap on a node at dimension end-point');
            break;
        case 'dimPlace':
            var graph={};
            graph.type='dim';
            if((dim.x1>dim.x2)||(dim.x1==dim.x2)&&(dim.y1>dim.y2)) {
                graph.x1=dim.x2;
                graph.y1=dim.y2;
                graph.x2=dim.x1;
                graph.y2=dim.y1;
                graph.n1=dim.n2;
                graph.n2=dim.n1;
            }
            else {
                graph.x1=dim.x1;
                graph.y1=dim.y1;
                graph.x2=dim.x2;
                graph.y2=dim.y2;
                graph.n1=dim.n1;
                graph.n2=dim.n2;
            }
            graph.dir=dim.dir; // direction: h/v/o (horizontal/vertical/oblique)
            graph.offset=dim.offset;
            graph.layer=layer;
            id('blueDim').setAttribute('x1',0);
            id('blueDim').setAttribute('y1',0);
            id('blueDim').setAttribute('x2',0);
            id('blueDim').setAttribute('y2',0);
            addGraph(graph);
            cancel();
            break;
        case 'dimAdjust':
            var x1=parseInt(id('blueLine').getAttribute('x1'));
            var y1=parseInt(id('blueLine').getAttribute('y1'));
            var x2=parseInt(id('blueLine').getAttribute('x2'));
            var y2=parseInt(id('blueLine').getAttribute('y2'));
            var line=element.firstChild;
            line.setAttribute('x1',x1);
            line.setAttribute('y1',y1);
            line.setAttribute('x2',x2);
            line.setAttribute('y2',y2);
            var text=element.childNodes[1];
            text.setAttribute('x',(x1+x2)/2);
            text.setAttribute('y',(y1-1));
            id('blueLine').setAttribute('x1',0);
            id('blueLine').setAttribute('y1',0);
            id('blueLine').setAttribute('x2',0);
            id('blueLine').setAttribute('y2',0);
            id('blueLine').setAttribute('transform','rotate(0)');
            dy=y1-y0;
            var request=db.transaction('graphs').objectStore('graphs').get(Number(index));
            request.onsuccess=function(event) {
                dim=request.result;
                // console.log('dimension start node: '+dim.x1+','+dim.y1);
                dim.offset+=dy; // dimension moved up/down before rotation
                request=db.transaction('graphs','readwrite').objectStore('graphs').put(dim);
                request.onsuccess=function(event) {
                    // console.log('dimension graph updated - offset is '+dim.offset );
                }
                request.onerror=function(event) {
                    // console.log('error updating dimension');
                }
            }
            request.onerror=function(event) {
                // console.log('get error');
            }
            cancel();
            break;
        case 'anchor':
            if(snap) {
                // console.log('SNAP - place anchor: '+snap);
                var html="<use id='anchor' href='#mover' x='"+x+"' y='"+y+"'/>";
                id('blue').innerHTML+=html; // anchor is pseudo-element - put in <blue> layer
                anchor=true;
                mode='select';
                // console.log('anchor placed');
                setButtons();
            }
            else hint('Tap on a node to place anchor');
            break;
        case 'pointEdit':
            // console.log('SELECT POINTS');
            if((selectionBox.w>20)&&(selectionBox.h>20)) { // significant selection box size
                var left=selectionBox.x;
                var right=selectionBox.x+selectionBox.w;
                var top=selectionBox.y;
                var bottom=selectionBox.y+selectionBox.h;
                // console.log('box: '+left+'-'+right+' x '+top+'-'+bottom);
                var points=element.points;
                // console.log('element has '+points.length+' points');
                selectedPoints=[];
                for(var i=0;i<points.length;i++) {
                    // console.log('point '+i+': '+points[i].x+','+points[i].y);
                    if(points[i].x<left) continue;
                    if(points[i].y<top) continue;
                    if(points[i].x>right) continue;
                    if(points[i].y>bottom) continue;
                    selectedPoints.push(i);
                }
                // console.log(selectedPoints.length+' points selected');
                if(selectedPoints.length>0) id('handles').innerHTML=''; // remove handles
                break;
            }
        case 'select':
            id('blueBox').setAttribute('width',0);
            id('blueBox').setAttribute('height',0);
            id('guides').style.display='none';
            // console.log('box size: '+selectionBox.w+'x'+selectionBox.h);
            if((selectionBox.w>20)&&(selectionBox.h>20)) { // significant selection box size
                // console.log('GROUP SELECTION - box: '+selectionBox.w+'x'+selectionBox.h+' at '+selectionBox.x+','+selectionBox.y);
                var items=id('dwg').childNodes;
                // console.log(items.length+' elements in dwg');
                for(var i=0;i<items.length;i++) { // collect elements entirely within selectionBox
                    // console.log('item '+i+': '+items[i].id);
                    var el=id(items[i].id);
                    if((type(el)=='dim')||!el) continue; // don't include dimensions or 'null' nodes
                    var box=getBounds(items[i]);
                    // console.log('bounds for '+items[i].id+": "+box.x+','+box.y);
                    // console.log('item '+items[i].id+' box: '+box.width+'x'+box.height+' at '+box.x+','+box.y);
                    if(box.x<selectionBox.x) continue;
                    if(box.y<selectionBox.y) continue;
                    if((box.x+box.width)>(selectionBox.x+selectionBox.w)) continue;
                    if((box.y+box.height)>(selectionBox.y+selectionBox.h)) continue;
					// CAN ONLY SELECT BACKGROUND ELEMENTS IF ON LAYER 0
                    if((items[i].getAttribute('layer')>0)||(layer<1)) {
                    	selection.push(items[i].id); // add to selection if passes tests
                    	// console.log('select '+items[i].id);
                    	var html="<rect x='"+box.x+"' y='"+box.y+"' width='"+box.width+"' height='"+box.height+"' ";
                    	html+="stroke='none' fill='blue' fill-opacity='0.25' el='"+items[i].id+"'/>";
                    	id('selection').innerHTML+=html;
                    }
                }
                if(selection.length>0) { // highlight selected elements
                    mode='edit';
                    showEditTools(true);
                    // console.log(selection.length+' elements selected');
                    if(selection.length<2) {
                        // console.log('only one selection');
                        id('selection').innerHTML=''; // no blue box
                        element=id(selection[0]);
                        select(element); // add handles etc
                    }
                    return;
                }
            }
            showInfo(false);
        case 'edit':
            var el=event.target;
            console.log('pointer up on element '+el.id+' parent: '+el.parentNode.id);
            var hit=null;
            if(el.parentNode.id=='graphic') { // drawing background - check 10x10px zone
                // console.log('nowt! - search locality');
                var e=0.5;
                while(e<6 && !hit) {
                	var n=0;
                	while(n<6 && !hit) {
                		el=document.elementFromPoint(scr.x-e,scr.y-n);
                		if((el.id!='svg')&&(!el.id.startsWith('datum'))) hit=el.id;
                		el=document.elementFromPoint(scr.x-e,scr.y+n);
                		if((el.id!='svg')&&(!el.id.startsWith('datum'))) hit=el.id;
                		el=document.elementFromPoint(scr.x+e,scr.y-n);
                		if((el.id!='svg')&&(!el.id.startsWith('datum'))) hit=el.id;
                		el=document.elementFromPoint(scr.x+e,scr.y+n);
                		if((el.id!='svg')&&(!el.id.startsWith('datum'))) hit=el.id;
                		// console.log('e: +/-'+e+' n+/-'+n+' hit: '+hit);
                		n+=0.5;
                	}
                	e+=0.5;
                }
            }
            else while((el.parentNode.id!='dwg')&&(el.parentNode.id!='handles')) {
                el=el.parentNode; // sets have elements within groups in svg container
            }
            // console.log('parent is '+el.parentNode.id);
            if((el.parentNode.id=='dwg')||(el.parentNode.id=='handles')) hit=el.getAttribute('id');
            console.log('hit: '+hit);
            if(hit) { // NEW - CHECK IF ONLY EDITING CURRENT LAYER
            	// console.log('HIT: '+hit+' type: '+type(el)+' layer '+el.getAttribute('layer')+'; this layer only is '+thisLayerOnly);
            	if(thisLayerOnly && el.getAttribute('layer')!=layer) hit=null; // 
            }
            if(hit) {
            	var selectIndex=selection.indexOf(hit);
            	if(selectIndex>=0) { // second hit deselects
            		selection.splice(selectIndex,1); // if already selected, deselect
            		id('handles').innerHTML='';
            		id('blueBox').setAttribute('width',0);
            		id('blueBox').setAttribute('height',0);
            	}
            	else {
            		if(selection.indexOf(hit)<0) {
                    	selection.push(hit);
                    	if(selection.length<2) { // only item selected
                    		// SINGLE ELEMENT SELECTED - IS IT A NODE?
                        	var snap=snapCheck();
                        	index=hit;
                        	graph=graphs[hit];
                        	element=id(hit);
                        	console.log('select single element - index '+index+' type: '+graph.type);
                        	select(hit,false,snap);
                    	}
                    	else { // multiple selection
                        	// console.log('add '+type(el)+' '+el.id+' to multiple selection');
                        	if(selection.length<3) {
                            	// console.log('SECOND SELECTED ITEM');
                            	id('handles').innerHTML='';
                            	select(selection[0],true); // highlight first selected item
                        	}
                        	select(hit,true);
                    	}
                    	// console.log('selected: '+selection.length+' elements - first one: '+selection[0]);
                    	setStyle();
                    	setButtons();
                	} // else ignore clicks on items already selected
                	showEditTools(true);
            	}
            }
            else { // click on background clears selection
                cancel();
            }
    }
    event.stopPropagation();
});
// ADJUST ELEMENT SIZES
id('first').addEventListener('change',function() { // CHANGE OTHERS TO MATCH BOX
	console.log('first dimension changed');
    var val=parseInt(id('first').value);
    re('member');
    console.log('graph '+index);
    // switch(type(element)) {
    switch(graph.type) {
        case 'line':
        case 'shape':
            if(index=='bluePolyline') { // adjust length of latest line segment
                var n=element.points.length;
                var pt0=element.points[n-2];
                var pt1=element.points[n-1];
                w=pt1.x-pt0.x;
                h=pt1.y-pt0.y;
                len=Math.sqrt(w*w+h*h);
                var r=val/len;
                w*=r;
                h*=r;
                x=x0+w;
                y=y0+h;
                pt1.x=x;
                pt1.y=y;
                element.points[n-1]=pt1;
            }
            else { // width of completed (poly)line
                var bounds=element.getBBox();
                w=bounds.width;
                var ratio=val/w;
                var points=element.points;
                // console.log('adjust from node '+node);
                for(i=0;i<points.length;i++) {
                    dx=points[i].x-points[node].x;
                    points[i].x=points[node].x+dx*ratio;
                }
                var pts=[];
	            for(var i=0;i<points.length;i++) {
	                pts.push(points[i].x);
	                pts.push(points[i].y);
	            }
                updateGraph(index,['points',pts]);
                // refreshNodes(element);
            }
            break;
        case 'box':
            console.log('change width of element '+index);
            var x=graph.x; // parseInt(element.getAttribute('x'));
            var y=graph.width; // parseInt(element.getAttribute('width'));
            switch(node) {
            	case 0:
            	case 3:
            	case 6: // size from left - x unchanged
            		break;
            	case 1:
                case 4:
                case 7: // size from centre
                    x+=w/2; // centre x
                    x-=(val/2); // new x
                    break;
                case 2:
                case 5:
                case 8: // size from right
                    x+=w; // right x
                    x-=val; // new x
                    break;
            }
            graph.x=x;
            graph.width=val;
            break;
        case 'oval':
        	graph.rx=val/2;
            // element.setAttribute('rx',val/2);
            // updateGraph(index,['rx',val/2]);
            // var elX=parseInt(element.getAttribute('cx'));
            // refreshNodes(element);
            break;
        case 'arc':
            // console.log('adjust arc radius to '+val);
            graph.r=val;
    }
    graphs[index]=graph;
    id('handles').innerHTML='';
    draw();
    select(index);

});
id('second').addEventListener('change',function() { // CHANGE OTHERS TO MATCH BOX
    var val=parseInt(id('second').value);
    re('member');
    element=id(index);
    switch(type(element)) {
        case 'line':
        case 'shape':
            if(index=='bluePolyline') { // adjust angle of latest line segment
                var n=element.points.length;
                var pt0=element.points[n-2];
                var pt1=element.points[n-1];
                w=pt1.x-pt0.x;
                h=pt1.y-pt0.y;
                var r=Math.round(Math.sqrt(w*w+h*h));
                if(val==0) {
                    w=0;
                    h=-r;
                }
                else if(val==90) {
                    w=r;
                    h=0;
                }
                else if(val==180) {
                    w=0;
                    h=r;
                }
                else if(val==270) {
                    w=-r;
                    h=0;
                }
                else {
                    val-=90;
                    if(val<0) val+=360;
                    val*=(Math.PI/180);
                    w=r*Math.cos(val);
                    h=r*Math.sin(val);
                }
                pt1.x=pt0.x+w;
                pt1.y=pt0.y+h;
                element.points[n-1]=pt1;
            }
            else { // height of completed (poly)line
                var bounds=element.getBBox();
                h=bounds.height;
                var ratio=val/h;
                var points=element.points;
                // console.log('adjust from node '+node);
                for(i=0;i<points.length;i++) {
                    dy=points[i].y-points[node].y;
                    points[i].y=points[node].y+dy*ratio;
                }
                var pts=[];
	            for(var i=0;i<points.length;i++) {
	                pts.push(points[i].x);
	                pts.push(points[i].y);
	            }
	            graph.points=pts;
                // updateGraph(index,['points',pts]);
                // refreshNodes(element);
                // id('handles').innerHTML='';
                // mode='select';
            }
            break;
        case 'box':
            var y=graph.y; // parseInt(element.getAttribute('y'));
            var h=graph.height; // parseInt(element.getAttribute('height'));
            switch(node) {
                case 0:
                case 1:
                case 2: // size from top - y unchanged
                	break;
                case 3:
                case 4:
                case 5: // size from centre
                    y+=h/2; // centre y
                    y-=(val/2); // new y
                    break;
                case 6:
                case 7:
                case 8: // size from bottom
                    y+=h; // bottom y
                    y-=val; // new y
                    break;
            }
            graph.y=y;
            graph.height=val;
            break;
        case 'oval':
        	graph.ry=val/2;
            // element.setAttribute('ry',val/2);
            // updateGraph(index,['ry',val/2]);
            // var elY=parseInt(element.getAttribute('cy'));
            // refreshNodes(element);
            // id('handles').innerHTML='';
            // mode='select';
            break;
        case 'arc':
            // console.log('change arc angle to '+val);
            val*=Math.PI/180; // radians
            graph.a1=Math.atan((graph.y1-graph.cy)/(graph.x1-graph.cx));
            if(graph.sweep>0) graph.a2=graph.a1+val;
            else graph.a2=graph.a1-val;
            graph.x2=graph.cx+graph.r*Math.cos(graph.a2);
            graph.y2=graph.cy+graph.r*Math.sin(graph.a2);
            // console.log('new end point: '+graph.x2+','+graph.y2);
            graph.major=(val>Math.PI)? 1:0;
    }
    graphs[index]=graph;
    id('handles').innerHTML='';
    draw();
    select(index);
});
id('spin').addEventListener('change',function() {
    re('member');
    var val=parseInt(id('spin').value);
    // console.log('set spin to '+val+' degrees');
    element=id(index);
    graph.spin=val;
    draw();
});
id('elementLayer').addEventListener('click',function() {
	// console.log('display layer choice for element '+element.id);
	for(var i=0;i<10;i++) {
		id('choice'+i).addEventListener('click',setLayer);
		// id('choice'+i).checked=(element.getAttribute('layer').indexOf(i)>=0)
		id('choice'+i).checked=(graph.layer==i);
	}
	id('layerChooser').style.display='block';
});
id('undoButton').addEventListener('click',function() {
    re('call'); // recall & reinstate previous positions/points/sizes/spins/flips
});
// FUNCTIONS
function addGraph(graph) {
    // console.log('add '+graph.type+' element - spin: '+graph.spin+' to layer '+graph.layer);
    // console.log('fill: '+graph.fillType+', '+graph.fill);
    graphs.push(graph);
    draw();
}
/*
function addSet(content) {
	// console.log('save set '+content);
	json=JSON.parse(content);
	sets.push(json)
	var name=json.name; // one set per file
	// console.log("add "+name);
	var request=db.transaction('sets','readwrite').objectStore('sets').add(json);
	request.onsuccess=function(e) {
		var n=request.result;
		// console.log("set added to database: "+n);
		listSets();
	};
	request.onerror=function(e) {console.log("error adding sets");};
}
*/
function cancel() { // cancel current operation and return to select mode
    mode='select';
    id('tools').style.display='block';
    element=index=null;
    selection=[];
    selectedPoints=[];
    selectionBox.w=selectionBox.h=0;
    id('selection').innerHTML='';
    id('handles').innerHTML=''; //remove element handles...
    id('selectionBox').setAttribute('width',0);
    id('selectionBox').setAttribute('height',0);
    id('blueBox').setAttribute('width',0);
    id('blueBox').setAttribute('height',0);
    id('blueOval').setAttribute('rx',0);
    id('blueOval').setAttribute('ry',0);
    id('bluePolyline').setAttribute('points','0,0');
    id('guides').style.display='none';
    id('datumSet').style.display='none';
    if(anchor) {
        id('anchor').remove();
        anchor=false;
    }
    showInfo(false);
    showEditTools(false);
    id('textDialog').style.display='none';
    id('layerChooser').style.display='none';
    id('info').style.top='-30px';
    id('info').style.height='30px';
    setStyle(); // set styles to defaults
}
function checkDims(el) {
    // console.log('check linked dimensions for element '+el.id);
    for(var i=0;i<dims.length;i++) {
        if((Math.floor(dims[i].n1/10)==Number(el.id))||(Math.floor(dims[i].n2/10)==Number(el.id))) {
            refreshDim(dims[i]); // adjust and redraw linked dimension
        }
    }
}
function clearDialog(dialog) {
	// console.log('clear '+dialog+' dialog');
	switch(dialog) {
		case 'move':
			id('moveRight').value=null;
			id('moveDown').value=null;
			id('moveDist').value=null;
			id('moveAngle').value=null;
			break;
		case 'spin':
			id('spinAngle').value=null;
			break;
		case 'double':
			id('offset').value=null;
			break;
		case 'repeat':
			id('countH').value=1;
			id('distH').value=null;
			id('countV').value=1;
			id('distV').value=null;
			break;
		case 'fillet':
			id('filletR').value=null;
	}
	
}
function copy(x,y) {
	var g={};
	g.type=graph.type; // type(el);
	console.log('copy '+g.type+' at '+x+','+y);
	g.layer=graph.layer;
	if(g.type!='set') { // sets don't have style
        g.stroke=graph.stroke; // el.getAttribute('stroke');
        g.lineW=graph.lineW; // el.getAttribute('stroke-width');
        g.lineType=graph.lineType; // getLineType(el);
        g.lineStyle=graph.lineStyle;
		g.fill=graph.fill;
        g.fillType=graph.fillType;
        // console.log('copy fillType: '+g.fillType+'; fill: '+g.fill);
        graph.opacity=graph.opacity;
    }
    g.spin=graph.spin; // el.getAttribute('spin');
    switch(g.type) {
    	case 'curve':
    	case 'line':
        	g.points=[]; // array of points
        	for(var j=0;j<graph.points.length;j++) g.points.push({x:graph.points[j].x+x,y:graph.points[j].y+y});
            // console.log('points: '+g.points);
            break;
        case 'box':
            g.x=graph.x+x; // Number(el.getAttribute('x'))+x;
            g.y=graph.y+y; // Number(el.getAttribute('y'))+y;
            g.width=graph.width; // Number(el.getAttribute('width'));
            g.height=graph.height; // Number(el.getAttribute('height'));
            g.radius=graph.radius; // Number(el.getAttribute('rx'));
            console.log('copy '+g.type+' at '+g.x+','+g.y);
            break;
        case 'oval':
            g.cx=graph.cx+x; // Number(el.getAttribute('cx'))+x;
            g.cy=graph.cy+y; // Number(el.getAttribute('cy'))+y;
            g.rx=graph.rx; // Number(el.getAttribute('rx'));
            g.ry=graph.ry; // Number(el.getAttribute('ry'));
            console.log('copy '+g.type+' at '+g.cx+','+g.cy);
            break;
        case 'arc':
            g.cx=graph.cx+x;
            g.cy=graph.cy+y;
            g.x1=graph.x1+x; 
            g.y1=graph.y1+y;
            g.x2=graph.x2+x;
            g.y2=graph.y2+y;
            g.r=graph.r;
            g.major=graph.major;
            g.sweep=graph.sweep;
            // console.log('copy '+g.type+' at '+g.cx+x+','+g.cy+y);
            break;
        case 'text':
            g.x=graph.x+x; // Number(el.getAttribute('x'))+x;
            g.y=graph.y+y; // Number(el.getAttribute('y'))+y;
            g.flip=graph.flip; // Number(el.getAttribute('flip'));
            g.text=graph.text; // el.getAttribute('text');
            g.textSize=graph.textSize; // Number(el.getAttribute('font-size'));
            g.textStyle=graph.textStyle;
            break;
    }
    addGraph(g);
}
function curvePath(pts) {
	// console.log('get path for '+pts.length+' points');
	var d='M '+pts[0].x+','+pts[0].y; // move to point 0
	if(pts.length<3) d+=' L'+pts[1].x+','+pts[1].y; // 2 points - short straight line
	else {
	    var n=7; // vary n to adjust smoothness of curve - 7 seems a good compromise
	    var c1={}; // control points
	    var c2={};
	    dx=pts[2].x-pts[0].x; // position control points parallel to chord of flanking points
	    dy=pts[2].y-pts[0].y; // this is for point 1
	    c2.x=pts[1].x-dx/n; // first control point
	    c2.y=pts[1].y-dy/n;
	    d+=' Q'+c2.x+','+c2.y+' '+pts[1].x+','+pts[1].y; // first segment - quadratic curve
	    console.log('point 1 path: '+d);
	    var i=2;
	    while(i<pts.length-1) { // intermediate segments
	        c1.x=pts[i-1].x+dx/n; // reflect previous control point
	        c1.y=pts[i-1].y+dy/n;
	        dx=pts[i+1].x-pts[i-1].x;
	        dy=pts[i+1].y-pts[i-1].y;
	        c2.x=pts[i].x-dx/n; // next control point
	        c2.y=pts[i].y-dy/n;
	        d+=' C'+c1.x+','+c1.y+' '+c2.x+','+c2.y+' '+pts[i].x+','+pts[i].y; // cubic curves
	        i++
	    }
	    c1.x=pts[i-1].x+dx/n;
	    c1.y=pts[i-1].y+dy/n;
	    d+=' S'+c1.x+','+c1.y+' '+pts[i].x+','+pts[i].y; // final segment - smooth cubic curve
	}
	console.log('curve path: '+d);
	return d;
}
function draw() {
	var el;
	id('dwg').innerHTML='';
	nodes=[];
	graphs.sort(function(a,b) {return a.layer-b.layer}); // sort by layer
	for(var n in graphs) {
		var g=graphs[n];
		console.log('graph '+n+' layer: '+g.layer);
		if(!layers[g.layer].show) continue;
		console.log('draw graph '+n+': '+g.type+'; fill: '+g.fill);
		var ns=id('svg').namespaceURI;
    	switch(g.type) {
    	case 'curve':
            var el=document.createElementNS(ns,'path');
            el.setAttribute('id',n);
            el.setAttribute('points',g.points);
            el.setAttribute('stroke',g.stroke);
            el.setAttribute('stroke-width',g.lineW);
            var dash=setLineType(g);
            if(dash) el.setAttribute('stroke-dasharray',dash);
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            el.setAttribute('spin',g.spin);
            console.log('curve points: '+g.points.length);
            // console.log('path: '+curvePath(pointsArray(g.points)));
            el.setAttribute('d',curvePath(g.points));
            // el.setAttribute('d',curvePath(pointsArray(g.points)));
            if(g.spin!=0) setTransform(el); // apply spin MAY NOT WORK!!!
            var points=g.points;
            console.log('points: '+points.length+' - first point is '+points[0].x+','+points[0].y);
            for(var i=0;i<points.length;i++) {
            	// console.log('node '+i+' at '+points[i].x+','+points[i].y);
            	nodes.push({'x':points[i].x,'y':points[i].y,'n':Number(n*10+i)});
            };
            graphs[n].points=points;
            for(var i=0;i<graphs[n].points.length;i++) console.log('point '+i+': '+graphs[n].points[i].x+','+graphs[n].points[i].y);
            break;
        case 'line':
            var el=document.createElementNS(ns,'polyline');
            el.setAttribute('id',n);
            el.setAttribute('spin',g.spin);
            el.setAttribute('stroke',g.stroke);
            el.setAttribute('stroke-width',g.lineW);
            var dash=setLineType(g);
            if(dash) el.setAttribute('stroke-dasharray',dash);
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            el.setAttribute('fill','none');
            var points=g.points;
            var elPts='';
            console.log('line points: '+points.length);
            for(var i=0;i<points.length;i++) {
            	var point=points[i];
            	elPts+=point.x+','+point.y+' ';
            	// var point=points.getItem(i);
                nodes.push({'x':point.x,'y':point.y,'n':Number(n*10+i)});
                console.log('add node '+i+' at '+point.x+','+point.y);
            } // NB node.n is id*10+[0-9]
            console.log('element points: '+elPts);
            el.setAttribute('points',elPts);
			if(g.spin!=0) setTransform(el); // apply spin MAY NOT WORK!!!
            break;
        case 'shape':
            var el=document.createElementNS(ns,'polygon');
            el.setAttribute('id',n);
            el.setAttribute('points',g.points);
            el.setAttribute('spin',g.spin);
            el.setAttribute('stroke',g.stroke);
            el.setAttribute('stroke-width',g.lineW);
            var dash=setLineType(g);
            if(dash) el.setAttribute('stroke-dasharray',dash);
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            var points=el.points;
            for(var i=0;i<points.length;i++) {
                nodes.push({'x':points[i].x,'y':points[i].y,'n':Number(n*10+i)});
                // console.log('add node '+i+' at '+points[i].x+','+points[i].y);
            }
			if(g.spin!=0) setTransform(el); // apply spin MAY NOT WORK!!!
            break;
        case 'box':
            var el=document.createElementNS(ns,'rect');
            el.setAttribute('id',n);
            el.setAttribute('x',g.x);
            el.setAttribute('y',g.y);
            el.setAttribute('width',g.width);
            el.setAttribute('height',g.height);
            el.setAttribute('rx',g.radius);
            el.setAttribute('spin',g.spin);
            el.setAttribute('stroke',g.stroke);
            el.setAttribute('stroke-width',g.lineW);
            var dash=setLineType(g);
            if(dash) el.setAttribute('stroke-dasharray',dash);
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            nodes.push({'x':g.x,'y':g.y,'n':(n*10)}); // top/left - node 0
            nodes.push({'x':(g.x+g.width/2),'y':g.y,'n':(n*10+1)}); // top/centre - node 1
            nodes.push({'x':(g.x+g.width),'y':g.y,'n':(n*10+2)}); // top/right - node 2
            nodes.push({'x':g.x,'y':(g.y+g.height/2),'n':(n*10+3)}); // centre/left - node 3
            nodes.push({'x':(g.x+g.width/2),'y':(g.y+g.height/2),'n':(n*10+4)}); // centre - node 4
            nodes.push({'x':(g.x+g.width),'y':(g.y+g.height/2),'n':(n*10+5)}); // centre/right - node 5
            nodes.push({'x':g.x,'y':(g.y+g.height),'n':(n*10+6)}); // bottom/left - node 6
            nodes.push({'x':(g.x+g.width/2),'y':(g.y+g.height),'n':(n*10+7)}); // bottom/centre - node 7
            nodes.push({'x':(g.x+g.width),'y':(g.y+g.height),'n':(n*10+8)}); // bottom/right - node 8
            if(g.spin!=0) setTransform(el);
            break;
        case 'oval':
            var el=document.createElementNS(ns,'ellipse');
            el.setAttribute('id',n);
            el.setAttribute('cx',g.cx);
            el.setAttribute('cy',g.cy);
            el.setAttribute('rx',g.rx);
            el.setAttribute('ry',g.ry);
            el.setAttribute('spin',g.spin);
            el.setAttribute('stroke',g.stroke);
            el.setAttribute('stroke-width',g.lineW);
            var dash=setLineType(g);
            if(dash) el.setAttribute('stroke-dasharray',dash);
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            nodes.push({'x':g.cx,'y':g.cy,'n':(n*10)}); // centre - node 0
            nodes.push({'x':g.cx,'y':Number(g.cy-g.ry),'n':Number(n*10+1)}); // ...top/centre - node 1
            nodes.push({'x':Number(g.cx-g.rx),'y':g.cy,'n':Number(n*10+2)}); // centre/left - node 2
            nodes.push({'x':Number(g.cx)+Number(g.rx),'y':g.cy,'n':Number(n*10+3)}); // centre/right - node 3
            nodes.push({'x':g.cx,'y':Number(g.cy+g.ry),'n':Number(n*10+4)}); // bottom/centre - node 4
            if(g.spin!=0) setTransform(el);
            break;
        case 'arc':
            var el=document.createElementNS(ns,'path');
            el.setAttribute('id',n);
            el.setAttribute('cx',g.cx);
            el.setAttribute('cy',g.cy);
            var d='M'+g.cx+','+g.cy+' M'+g.x1+','+g.y1+' A'+g.r+','+g.r+' 0 '+g.major+','+g.sweep+' '+g.x2+','+g.y2;
            el.setAttribute('d',d);
            el.setAttribute('spin',g.spin);
            el.setAttribute('stroke',g.stroke);
            el.setAttribute('stroke-width',g.lineW);
            var dash=setLineType(g);
            if(dash) el.setAttribute('stroke-dasharray',dash);
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            if(g.opacity<1) el.setAttribute('fill-opacity',g.opacity);
            // create nodes for arc start, centre & end points
            nodes.push({'x':g.cx,'y':g.cy,'n':(n*10)}); // centre - node 0
            nodes.push({'x':g.x1,'y':g.y1,'n':Number(n*10+1)}); // start - node 1
            nodes.push({'x':g.x2,'y':g.y2,'n':Number(n*10+2)}); // end - node 2
            if(g.spin!=0) setTransform(el);
            break;
        case 'text':
            var el=document.createElementNS(ns,'text');
            el.setAttribute('id',n);
            el.setAttribute('x',g.x);
            el.setAttribute('y',g.y);
            el.setAttribute('spin',g.spin);
            el.setAttribute('flip',g.flip);
            el.setAttribute('font-family',g.textFont);
            el.setAttribute('font-size',g.textSize*scale);
            if(g.textStyle=='bold') el.setAttribute('font-weight','bold');
            else if(g.textStyle=='italic') el.setAttribute('font-style','italic');
            el.setAttribute('stroke','none');
            el.setAttribute('fillType',g.fillType);
            el.setAttribute('fill',g.fill);
            el.setAttribute('text',g.text);
            var t=document.createTextNode(g.text);
			el.appendChild(t).then
				el.innerHTML=textFormat(g.text,g.x);
            if((g.spin!=0)||(g.flip!=0)) setTransform(el);
            break;
        case 'dim':
            dx=Math.round(g.x2-g.x1);
            dy=Math.round(g.y2-g.y1);
            var d=0; // dimension length
            var a=0; // dimension angle
            if(g.dir=='h') {
                    d=Math.abs(dx);
                    a=0;
                }
            else if(g.dir=='v') {
                    d=Math.abs(dy);
                    a=Math.PI/2;
                }
            else {
                d=Math.round(Math.sqrt(dx*dx+dy*dy));
                a=Math.atan(dy/dx); // oblique dimension - angle in radians
            }
            console.log('dimension length: '+d+'; angle: '+a+' rad; nodes: '+g.n1+' '+g.n2);
            var x1=Number(g.x1); // start point/anchor of dimension line
            var y1=Number(g.y1);
            var o=parseInt(g.offset);
            if(a==0) y1+=Number(o);
            else if(a==Math.PI/2) x1+=o;
            else {
                x1-=o*Math.sin(a);
                y1+=o*Math.cos(a);
            }
            a*=180/Math.PI; // angle in degrees
            console.log('create dimension line from '+x1+','+y1+' length: '+d);
            var el=document.createElementNS(ns,'g');
            el.setAttribute('id',n);
            el.setAttribute('transform','rotate('+a+','+x1+','+y1+')');
            var dim=document.createElementNS(ns,'line');
            dim.setAttribute('x1',x1);
            dim.setAttribute('y1',y1);
            dim.setAttribute('x2',Number(x1)+Number(d));
            dim.setAttribute('y2',y1);
            dim.setAttribute('marker-start','url(#startArrow)');
            dim.setAttribute('marker-end','url(#endArrow)');
            dim.setAttribute('stroke','gray');
            dim.setAttribute('stroke-width',(0.25*scale));
            dim.setAttribute('fill','none');
            el.appendChild(dim);
            dim=document.createElementNS(ns,'text');
            dim.setAttribute('x',Number(x1)+d/2);
            dim.setAttribute('y',(y1-scale));
            dim.setAttribute('text-anchor','middle');
            dim.setAttribute('font-size',(4*scale));
            dim.setAttribute('stroke','none');
            dim.setAttribute('fill','gray');
            t=document.createTextNode(Math.abs(d));
            dim.appendChild(t);
            el.appendChild(dim);
            dim={}; // no nodes for dimensions but add to dims array
            dim.dim=g.id;
            dim.n1=g.n1;
            dim.n2=g.n2;
            console.log('add link - dim. '+dim.dim+' nodes: '+dim.n1+','+dim.n2);
            dims.push(dim);
            console.log('links added for dimension '+g.id);
            // for(var i=0;i<dims.length;i++) // console.log('link '+i+': dim:'+dims[i].dim+' nodes: '+dims[i].n1+','+dims[i].n2);
            break;
        case 'set':
        	console.log('add set');
            var el=document.createElementNS(ns,'use');
            el.setAttribute('id',n);
            el.setAttribute('href','#'+g.name);
            el.setAttribute('x',g.x);
            el.setAttribute('y',g.y);
            el.setAttribute('spin',g.spin);
            el.setAttribute('flip',g.flip);
            nodes.push({'x':g.x,'y':g.y,'n':(n*10)});
            if((g.spin!=0)||(g.flip!=0)) setTransform(el);
    	}
    	el.setAttribute('layer',g.layer); // layers element appears on
    	if((g.type!='text')&&(g.type!='dim')&&(g.type!='set')) { // set style
    		// console.log('set style - fillType is '+g.fillType+'; fill is '+g.fill);
    		el.setAttribute('stroke',g.stroke);
			el.setAttribute('stroke-width',g.lineW);
			if(g.lineStyle=='round') {
				el.setAttribute('stroke-linecap','round');
				el.setAttribute('stroke-linejoin','round');
			}
			else {
				el.setAttribute('stroke-linecap','butt');
				el.setAttribute('stroke-linejoin','miter');
			};
			var dash=setLineType(g);
			if(dash) el.setAttribute('stroke-dasharray',dash);
			if(g.fillType.startsWith('pattern')) {
				var n=Number(g.fillType.substr(7));
				// console.log('fillType is '+g.fillType);
				var html="<pattern id='pattern"+g.id+"' index='"+n+"' width='"+pattern[n].width+"' height='"+pattern[n].height+"' patternUnits='userSpaceOnUse'";
				if(pattern[n].spin>0) html+=" patternTransform='rotate("+pattern[n].spin+")'";
				html+='>'+tile[pattern[n].tile]+'</pattern>';
				// console.log('pattern HTML: '+html);
				id('defs').innerHTML+=html;
				id('pattern'+g.id).firstChild.setAttribute('fill',g.fill);
				id('pattern'+g.id).lastChild.setAttribute('fill',g.fill);
				el.setAttribute('fill','url(#pattern'+g.id+')');
			}
			else el.setAttribute('fill',(g.fillType=='none')?'none':g.fill);
			if(g.opacity<1) {
				el.setAttribute('stroke-opacity',g.opacity);
				el.setAttribute('fill-opacity',g.opacity);
			}
			if(g.blur>0) el.setAttribute('filter','url(#blur'+g.blur+')');
    	}
		id('dwg').appendChild(el);
		if(graphs[n].type=='curve') console.log('first point on curve is '+graphs[n].points[0].x+','+graphs[n].points[0].y);
	}
	save();
}
function getAngle(x0,y0,x1,y1) {
    var dx=x1-x0;
    var dy=y1-y0;
    var a=Math.atan(dy/dx); // range -PI/25 to +PI/2
    a*=180/Math.PI; // -90 to +90 degrees
    a+=90; // 0-180
    if(dx<0) a+=180; // 0-360
    return a;
}
function getBounds(el) {
    var b=el.getBBox();
    return b;
}
function getLineType(el) {
    var lw=parseInt(el.getAttribute('stroke-width'));
    var dash=parseInt(el.getAttribute('stroke-dasharray'));
    if(dash>lw) return 'dashed';
    else if(dash==lw) return'dotted';
    else return 'solid';
}
function getValue(el) {
	var val=parseInt(id(el).value);
	if(!val) val=0;
	return val;
}
function hint(text) {
    // console.log('HINT '+text);
    id('hint').innerHTML=text; //display text for 10 secs
    var t=parseInt(id('info').style.top);
    // console.log('info top: '+t);
    id('info').style.height='50px';
	setTimeout(function(){id('info').style.height='30px';},10000);
}
function id(el) {
	return document.getElementById(el);
}
function initialise() {
    // console.log('set up size '+size+' '+aspect+' 1:'+scale+' scale '+aspect+' drawing');
    scaleF=25.4*scale/96; // 96px/inch
    handleR=2*scale;
    snapD=2*scale;
    // console.log('scaleF: '+scaleF+' handleR=snapD='+snapD);
    var index=parseInt(size);
    if(aspect=='portrait') index+=7;
    dwg.w=widths[index];
    dwg.h=heights[index];
    // console.log('drawing size '+dwg.w+'x'+dwg.h+'(index: '+index+')');
    var gridSizes=id('gridSize').options;
    // console.log('set '+gridSizes.length+' grid size options for scale '+scale);
    gridSizes[0].disabled=(scale>2);
    gridSizes[1].disabled=(scale>5);
    gridSizes[2].disabled=((scale<5)||(scale>10));
    gridSizes[3].disabled=((scale<5)||(scale>20));
    gridSizes[4].disabled=((scale<10)||(scale>50));
    gridSizes[5].disabled=gridSizes[6].disabled=gridSizes[7].disabled=gridSizes[8].disabled=gridSizes[9].disabled=(scale<50);
    var blues=document.getElementsByClassName('blue');
    // console.log(blues.length+' elements in blue class');
    for(var i=0;i<blues.length;i++) blues[i].style.strokeWidth=0.25*scale;
    id('moveCircle').setAttribute('r',handleR);
    id('moveCircle').style.strokeWidth=scale;
    id('sizeDisc').setAttribute('r',handleR);
    id('selectionBox').setAttribute('stroke-dasharray',(scale+' '+scale+' '));
    rezoom(); // zoom starts at 1 
    // console.log('scale is '+scale+' svg at '+id('svg').getAttribute('left'));
    id('datum').setAttribute('transform','scale('+scale+')');
    for(var i=0;i<10;i++) nodes.push({'x':0,'y':0,'n':i}); // 10 nodes for blueline
    id('countH').value=id('countV').value=1;
    cancel(); // set select mode
}
function listSets() {
	// console.log('list sets');
	id('setList').innerHTML="<option onclick='hint(\'select a set\');' value=null>select a set</option>"; // rebuild setLists
    id('setChooser').innerHTML=''; // clear setChooser list
    for(var i in sets) {
    	var name=set.name;
        // console.log('add set '+name);
        var html="<g id='"+name+"'>"+set.svg+"</g>";
        id('sets').innerHTML+=html; // copy set svg into <defs>...
        html="<option value='"+name+"'>"+name+"</option>";
        id('setList').innerHTML+=html; //...and set name into setList...
        html="<li style='float:right'>"+name+"&nbsp;<input type='checkbox' id='$"+name+"' class='setChoice'></li><br>";
        id('setChooser').innerHTML+=html; // ...and setChooser
        // console.log('set added');
    }
}
function load() {
	var data=window.localStorage.getItem('lineaData');
	if(data) {
		var json=JSON.parse(data);
		graphs=json.graphs;
		sets=json.sets;
		// images=json.images;
		console.log(graphs.length+' graphs and '+sets.length+' sets loaded');
	}
	draw();
    setLayers();
    listSets();
}
function move(dx,dy) { // CHANGE OTHER TO MATCH BOX, ETC
	for(var i in selection) {
		index=selection[i];
		graph=graphs[index];
		element=id(index);
		console.log('move graph '+index+' by '+dx+','+dy);
		switch(graph.type) {
    		case 'curve':
        	case 'line':
        	case 'shape':
            	// console.log('move all points by '+dx+','+dy);
            	for(var i in graph.points) {
            		graph.points[i].x+=dx;
            		graph.points[i].y+=dy;
            	}
            	break;
        	case 'box':
        	case 'text':
        	case 'set':
        	case 'oval':
            	console.log('move oval by '+dx+','+dy);
            	graph.cx+=dx;
            	graph.cy+=dy;
            	break;
        	case 'arc':
        		graph.cx+=dx;
        		graph.cy+=dy;
        		graph.x1+=dx;
        		graph.y1+=dy;
        		graph.x2+=dx;
        		graph.y2+=dy;
    	}
	}
    draw();
    cancel();
}
function pointsArray(points) {
	var pts=[];
	var pt={};
	var i=0;
	while(i<points.length) {
		pt=new StringPoint(points.substring(i,points.indexOf(' ',i)));
		// console.log('point: '+pt.x+','+pt.y);
		pts.push(pt);
		i=points.indexOf(' ',i)+1
	}
	// console.log(pts.length+' points');
	return pts;
}
function re(op) {
	// op is 're-member' (memorise and show undo), 're-call' (reinstate and hide undo) or 're-wind' (hide undo)
    // console.log('re'+op+'; '+selection.length+' selected items; '+memory.length+' memory items');
    // console.log('item 1: '+selection[0]);
    if(op=='member') {
        memory=[];
        // console.log('REMEMBER');
        for(var i=0;i<selection.length;i++) {
            index=selection[i];
            // console.log('selected item '+i+': '+elID);
            graph=graphs[index]; // *** NEW
            // var el=id(index);
            var props={};
            props.id=index; // all elements have an index
            // console.log('element '+elID+' - '+type(el));
            switch(graph.type) {
                case 'line':
                case 'shape':
                	props.points=graph.points;
                    break;
                case 'box':
                    // console.log('remember box '+elID);
                    props.x=graph.x;
                    props.y=graph.y;
                    props.width=graph.width;
                    props.height=graph.height;
                    props.rx=graph.rx;
                    break;
                case 'oval':
                	props.cx=graph.cx;
                	props.cy=graph.cy;
                	props.rx=graph.rx;
                	props.ry=graph.ry;
                    break;
                case 'arc':
                	props.cx=graph.cx;
                	props.cy=graph.cy;
                	props.r=graph.r;
                case 'text':
                case 'set':
                	props.x=graph.x;
                	props.y=graph.y;
                	props.flip=graph.flip;
            }
            props.spin=graph.spin;
            memory.push(props);
            // console.log('selection['+i+']: '+props.id);
        }
        id('line').style.display='none';
        id('undoButton').style.display='block';
        return;
    }
    else if(op=='call') for(var i=0;i<memory.length;i++) { // reinstate from memory
        var item=memory[i];
        // console.log('reinstate item '+item.id);
        index=item.id; // *** NEW
        graph=graphs[index];
        element=id(index);
        switch(graph.type) {
            case 'line':
            case 'shape':
                // console.log(item.points.length+' points - from '+item.points[0].x+','+item.points[0].y);
                graph.points=item.points;
                break;
            case 'box':
                // console.log('reinstate box element');
                graph.x=item.x;
                graph.y=item.y;
                graph.width=item.width;
                graph.height=item.height;
                graph.rx=item.rx;
                break;
            case 'text':
            case 'set':
            	graph.x=item.x;
            	graph.y=item.y;
            	graph.flip=item.flip;
                break;
            case 'oval':
            	graph.cx=item.cx;
            	graph.cy=item.cy;
            	graph.rx=item.rx;
            	graph.ry=item.ry;
                break;
            case 'arc':
            	element.setAttribute('d',item.d);
        }
        graph.spin=item.spin;
    }
    id('undoButton').style.display='none';
    id('line').style.display='block';
}
function redrawDim(d) {
    var request=db.transaction('graphs','readwrite').objectStore('graphs').put(d);
    request.onsuccess=function(event) {
        // console.log('dimension '+dim.id+' updated - redraw from '+d.x1+','+d.y1+' to '+d.x2+','+d.y2+' direction: '+d.dir);
        var len=0; // dimension length...
        var a=0; // ...and angle
        if(d.dir=='h') { // horizontal dimension
            len=d.x2-d.x1;
            a=0;
        }
        else if(d.dir=='v') { // vertical dimension
            len=d.y2-d.y1;
            a=Math.PI/2;
        }
        else { // oblique dimension
            w=Math.round(d.x2-d.x1);
            h=Math.round(d.y2-d.y1);
            len=Math.sqrt(w*w+h*h);
            a=Math.atan(h/w); // angle in radians
        }
        len=Math.round(len);
        // console.log('dimension length: '+len+'; angle: '+a+'radians; elements: '+d.el1+' '+d.el2);
        var o=parseInt(d.offset);
        var x1=d.x1; // start point/anchor of dimension line
        var y1=d.y1;
        if(a==0) y1+=o;
        else if(a==Math.PI/2) x1+=o;
        else {
            x1-=o*Math.sin(a);
            y1+=o*Math.cos(a);
        }
        a*=180/Math.PI; // angle in degrees
        var t='rotate('+a+','+x1+','+y1+')';
        id(d.id).setAttribute('transform',t); // adjust dimension rotation
        var line=id(d.id).firstChild;
        line.setAttribute('x1',x1); // adjust dimension end points
        line.setAttribute('y1',y1);
        line.setAttribute('x2',x1+len);
        line.setAttribute('y2',y1);
        t=id(d.id).children[1]; // adjust text location
        t.setAttribute('x',Number(x1+len/2));
        t.setAttribute('y',Number(y1-1));
        t.innerHTML=len; // adjust dimension measurement
        // console.log('dimension '+d.id+' redrawn');
    }
    request.onerror=function(event) {
        console.log('dimension update failed');
    }
}
function refreshDim(d) {
    // console.log('refresh dimension '+d.dim+' from node '+d.n1+' to node '+d.n2);
    var node1=nodes.find(function(node) {
        return (node.n==Number(d.n1));
    });
    // console.log('start node: '+node1);
    var node2=nodes.find(function(node) {
        return (node.n==Number(d.n2));
    });
    // console.log('end node: '+node2);
    var request=db.transaction('graphs').objectStore('graphs').get(Number(d.dim));
    request.onsuccess=function(event) {
        dim=request.result;
        // console.log('got dimension '+dim.id);
        dim.x1=node1.x;
        dim.y1=node1.y;
        dim.x2=node2.x;
        dim.y2=node2.y;
        redrawDim(dim);
    }
    request.onerror=function(event) {
        console.log('get dimension failed');
    }
}
function remove(n,keepNodes) {
    // console.log('remove element '+n);
    var linkedDims=[]; // first check for any linked dimensions
    for(var i=0;i<dims.length;i++) {
        if((Math.floor(dims[i].n1/10)==Number(n))||(Math.floor(dims[i].n2/10)==Number(n))) {
            linkedDims.push(dims[i].dim);
            dims.splice(i,1); // remove dimension link
        }
    }
    var ptn=id('pattern'+n); // remove any associated pattern
    if(ptn) ptn.remove();
    graphs.splice(n,1); // remove graph
    draw();
	while(linkedDims.length>0) remove(linkedDims.pop()); // remove any linked dimensions
}
function rezoom() {
	w=Math.round(scr.w*scaleF/zoom);
    h=Math.round(scr.h*scaleF/zoom);
    // console.log('screen: '+scr.w+'x'+scr.h+' scaleF: '+scaleF+' new viewBox: '+dwg.x+','+dwg.y+' '+w+'x'+h);
    id('svg').setAttribute('viewBox',dwg.x+' '+dwg.y+' '+w+' '+h);
    id('paper').setAttribute('viewBox',dwg.x+' '+dwg.y+' '+w+' '+h);
    id('paperSheet').setAttribute('width',dwg.w*scale);
    id('paperSheet').setAttribute('height',dwg.h*scale);
    id('clipBox').setAttribute('width',dwg.w*scale);
    id('clipBox').setAttribute('height',dwg.h*scale);
}
function save() {
	console.log('save '+graphs.length+' graphs');
	var data={};
	data.graphs=graphs;
	data.sets=sets;
	var json=JSON.stringify(data);
	// console.log('saving...'+json);
	window.localStorage.setItem('lineaData',json);
	console.log(graphs.length+' graphs and '+sets.length+' sets saved');
}
function select(n,multiple,s) {
	if(!multiple) { // single element selected
		console.log('select graph '+n+' of '+graphs.length+' multiple is '+multiple+' s is '+s);
		graph=graphs[n];
		if(s) console.log('place mover on node '+s.n+' at '+s.x+','+s.y);
		var elementLayers=graph.layer;
		console.log('graph layers: '+elementLayers);
		id('layers').innerText=elementLayers;
		for(var l=0;l<elementLayers.length;l++) id('choice'+l).checked=true;
    	id('handles').innerHTML=''; // clear any handles then add handles for selected element 
    	elNodes=nodes.filter(function(node) { // get nodes for selected element
        	return (Math.floor(node.n/10)==n);
    	});
    	console.log(elNodes.length+' nodes');
    	for(i=0;i<elNodes.length;i++) { // draw tiny disc at each node
    		var html="<use href='#node' x='"+elNodes[i].x+"' y='"+elNodes[i].y+"' r='"+scale/2+"'/>";
    		console.log('node at '+elNodes[i].x+','+elNodes[i].y);
    		id('handles').innerHTML+=html;
    	}
    	switch(graph.type) {
    		case 'curve':
    			var points='';
    			for(var i in graph.points) {
    				points+=graph.points[i].x+','+graph.points[i].y+' ';
    			}
    			id('bluePolyline').setAttribute('points',points);
				var html='';
				for(var i=1;i<graph.points.length;i++) html+="<use id='sizer"+i+"' href='#sizer' x='"+graph.points[i].x+"' y='"+graph.points[i].y+"'/>";
				// id('handles').innerHTML+=html; // disc handles move nodes
				if(s) html+="<use id='mover"+s.n%10+"' href='#mover' x='"+s.x+"' y='"+s.y+"'/>"; // mover at node
				else html+="<use id='mover0' href='#mover' x='"+graph.points[0].x+"' y='"+graph.points[0].y+"'/>"; // mover at start
				console.log('html: '+html);
				id('handles').innerHTML+=html; // circle handle moves whole element
				hint('CURVE');
				id('guides').style.display='block';
				node=0; // default anchor node
				mode='pointEdit';
				break;
        	case 'line':
        	case 'shape':
        		var el=id(n);
            	var bounds=el.getBBox();
            	w=bounds.width;
            	h=bounds.height;
            	var points=el.points;
            	var n=points.length;
            	// console.log('bounds: '+w+'x'+h+'mm; '+n+' points');
            	setSizes('box',el.getAttribute('spin'),w,h); // size of bounding box
            	// draw handles
            	var html='';
            	for(var i=1;i<n;i++) {
                	html="<use id='sizer"+i+"' href='#sizer' x='"+points[i].x+"' y='"+points[i].y+"'/>";
                	id('handles').innerHTML+=html; // disc handles move remaining nodes
            	}
            	if(s) html="<use id='mover"+s.n%10+"' href='#mover' x='"+s.x+"' y='"+s.y+"'/>"; // mover at node
            	else html="<use id='mover0' href='#mover' x='"+points[0].x+"' y='"+points[0].y+"'/>"; // mover at start
            	id('handles').innerHTML+=html; // circle handle moves whole element
            	id('bluePolyline').setAttribute('points',el.getAttribute('points'));
            	id('guides').style.display='block';
            	// console.log('type: '+type(el)+'; layer: '+el.getAttribute('layer'));
            	showInfo(true,(type(el)=='shape')?'SHAPE':'LINE',el.getAttribute('layer'));
            	node=0; // default anchor node
            	mode='pointEdit';
            	break;
        	case 'box':
        		x=graph.x;
        		y=graph.y;
        		w=graph.width;
        		h=graph.height;
            	// draw blueBox for sizing
            	id('blueBox').setAttribute('x',x); // SET blueBox TO MATCH BOX (WITHOUT SPIN)
            	id('blueBox').setAttribute('y',y);
            	id('blueBox').setAttribute('width',w);
            	id('blueBox').setAttribute('height',h);
            	id('blueBox').setAttribute('transform','rotate(0)');
            	id('guides').style.display='block';
            	var html="<use id='sizer' href='#sizer' x='"+(x+w)+"' y='"+(y+h)+"'/>"; // sizer at bottom/right
            	if(s) html+="<use id='mover"+s.n%10+"' href='#mover' x='"+s.x+"' y='"+s.y+"'/>"; // mover at a node
            	else html+="<use id='mover0' href='#mover' x='"+x+"' y='"+y+"'/>"; // mover at top/left
            	id('handles').innerHTML+=html;
            	setSizes('box',graph.spin,w,h);
            	showInfo(true,(w==h)?'SQUARE':'BOX',graph.layer);
            	node=0; // default anchor node
            	mode='edit';
            	break;
        	case 'oval':
            	x=graph.cx;
            	y=graph.cy;
            	w=graph.rx*2;
            	h=graph.ry*2;
            	id('blueBox').setAttribute('x',(x-w/2)); // SET blueBox TO MATCH OVAL (WITHOUT SPIN)
            	id('blueBox').setAttribute('y',(y-h/2));
            	id('blueBox').setAttribute('width',w);
            	id('blueBox').setAttribute('height',h);
            	id('blueBox').setAttribute('transform','rotate(0)');
            	id('guides').style.display='block';
            	var html='';
            	if(s) html="<use id='mover"+s.n%10+"' href='#mover' x='"+s.x+"' y='"+s.y+"'/>"; // mover at a node
            	else html="<use id='mover0' href='#mover' x='"+x+"' y='"+y+"'/>"; // mover at centre
            	html+="<use id='sizer' href='#sizer' x='"+(x+w/2)+"' y='"+(y+h/2)+"'/>"; // bottom/right
            	id('handles').innerHTML+=html;
            	setSizes('box',graph.spin,w,h);
            	showInfo(true,(w==h)?'CIRCLE':'OVAL',graph.layer);
            	node=0; // default anchor node
            	mode='edit';
            	break;
        	case 'arc':
            	html="<use id='sizer1' href='#sizer' x='"+graph.x1+"' y='"+graph.y1+"'/>"; // sizers at start...
            	html+="<use id='sizer2' href='#sizer' x='"+graph.x2+"' y='"+graph.y2+"'/>"; // ...and end or arc
            	if(s) html+="<use id='mover"+s.n%10+"' href='#mover' x='"+s.x+"' y='"+s.y+"'/>"; // mover at a node
            	else html+="<use id='mover0' href='#mover' x='"+graph.cx+"' y='"+graph.cy+"'/>"; // mover at centre
            	id('handles').innerHTML+=html;
            	var a1=Math.atan((graph.y1-graph.cy)/(graph.x1-graph.cx));
            	if(graph.x1<graph.cx) a1+=Math.PI;
            	var a=Math.atan((graph.y2-graph.cy)/(graph.x2-graph.cx));
            	// console.log('end angle: '+a);
            	if(graph.x2<graph.cx) a+=Math.PI;
            	x0=graph.cx; // centre
            	y0=graph.cy;
            	x=x0+graph.r*Math.cos(a); // end point
	            y=y0+graph.r*Math.sin(a);
    	        a=Math.abs(a-a1); // swept angle - radians
        	    a*=180/Math.PI; // degrees
            	a=Math.round(a);
	            if(graph.major>0) a=360-a;
    	        setSizes('graph',graph.spin,graph.r,a);
        	    showInfo(true,'ARC',graph.layer);
            	mode='edit';
	            break;
    	    case 'text':
    	    	var el=id(n);
        	    var bounds=el.getBBox();
            	w=Math.round(bounds.width);
	            h=Math.round(bounds.height);
	            // console.log('bounds: '+bounds.x+','+bounds.y+' - '+w+'x'+h+'; layer: '+elementLayers);
        	    var html="<use id='mover0' href='#mover' x='"+bounds.x+"' y='"+bounds.y+"'/>";
	            id('handles').innerHTML+=html; // circle handle moves text
	            var t=element.innerHTML;
	            // console.log('text: '+t);
	            var content='';
	            if(t.startsWith('<')) {
	            	i=0;
	            	while(i<t.length) {
	            		while(t.charAt(i)!='>') i++;
	            		i++;
	            		if(t.charAt(i)=='<') content+='\n';
	            		while((i<t.length)&&(t.charAt(i)!='<')) content+=t.charAt(i++);
	            	}
	            }
	            else content=t;
	            id('text').value=content;
            	setSizes('text',graph.spin,w,h);
            	showInfo(true,'TEXT',elementLayers);
            	showDialog('textDialog',true);
            	node=0; // default anchor node
        	    mode='edit';
            	break;
	        case 'dim':
    	        var line=el.firstChild;
        	    var x1=graph.x1;
            	var y1=graph.y1;
	            var x2=graph.x2;
    	        var y2=graph.y2;
        	    var spin=graph.transform;
            	// console.log('dim from '+x1+','+y1+' to '+x2+','+y2);
    	        var html="<use id='mover0' href='#mover' x='"+((x1+x2)/2)+"' y='"+((y1+y2)/2)+"' "; 
        	    html+="transform='"+spin+"'/>";
            	id('handles').innerHTML+=html;
    	        mode='edit';
        	    break;
	        case 'set':
    	        var bounds=getBounds(el);
        	    x=Number(el.getAttribute('x'));
            	y=Number(el.getAttribute('y'));
	            w=Number(bounds.width);
    	        h=Number(bounds.height);
	            var html="<use id='mover0' href='#mover' x='"+x+"' y='"+y+"'/>";
    	        id('handles').innerHTML=html;
        	    setSizes('box',el.getAttribute('spin'),w,h);
            	showInfo(true,'SET',el.layer);
	            mode='edit';
    	};
	}
	else { // one of multiple selection - highlight in blue
		var el=id(n);
		var box=getBounds(el);
		var html="<rect x='"+box.x+"' y='"+box.y+"' width='"+box.width+"' height='"+box.height+"' ";
		html+="stroke='none' fill='blue' fill-opacity='0.25' el='"+n+"'/>";
		// console.log('box html: '+html);
		id('selection').innerHTML+=html; // blue block for this element
	}
}
function setButtons() {
    var n=selection.length;
    // console.log('set buttons for '+n+' selected elements');
    var active=[3,9,11,13,17,25,29]; // active - remove, move, spin, flip, copy, anchor & return buttons always active
    // childNodes of editTools are... 0:add 1:remove 2:forward 3:back 4:move 5:spin 6:flip 7:align 8:copy 9:double 10:repeat 11:fillet 12: anchor 13:join
    if(n>1) { // multiple selection
        if(anchor) { // join active if anchor available for multiple selection
            active.push(27);
        }
        active.push(15); // align and anchor active for multiple selection
    }
    else { // single element selected
    	active.push(19,21); // double and repeat only for single selection
        var t=type(id(selection[0]));
        if((t=='line')||(t=='shape')) active.push(1); // can add points to selected line/shape
        else if(t=='box') active.push(23); // fillet tool active for a selected box
        if(selectedPoints.length<1) { // unless editing line/shape active tools include...
            active.push(5); // push/pull back/forwards
            active.push(7);
            active.push(11); // spin and flip
            active.push(13);
            active.push(19); // double, repeat and anchor
            active.push(25);
        } 
    }
    if(n>1) id('info').style.height=0;
    var set='';
    for(i=0;i<active.length;i++) set+=active[i]+' ';
    var n=id('editTools').childNodes.length;
    for(var i=0;i<n;i++) {
        var btn=id('editTools').childNodes[i];
        // console.log(i+' '+btn.id+': '+(active.indexOf(i)>=0));
        id('editTools').childNodes[i].disabled=(active.indexOf(i)<0);
    }
}
function setLayer() {
	// console.log('set element layer(s)');
	var elementLayer='';
	for(var i=0;i<10;i++) {
		if(id('choice'+i).checked) elementLayer=i;
	}
	id('layers').innerText=elementLayer;
	graph.layer=elementLayer;
	// element.setAttribute('layer',elementLayers);
	updateGraph(index,['layer',elementLayer]);
	// updateGraph(element.id,['layer',elementLayers]);
}
function setLayers() {
	// console.log('set layers');
	for(var i=0;i<10;i++) {
		// console.log('layer '+i+' name: '+layers[i].name+' chosen: '+layers[i].checked+' show: '+layers[i].show);
		if(id('layer'+i).checked) layer=i;
		layers[i].name=id('layerName'+i).value; // id('layerName'+i).value=layers[i].name=layers[i].name;
		layers[i].show=id('layerCheck'+i).checked;
		id('choiceName'+i).innerText=layers[i].name;
		id('layer').innerText=layer;
	}
	// console.log('layers:'+layers);
	setLayerVisibility();
}
function setLayerVisibility() {
	// console.log('set layer visibilities');
	for(var i=0;i<10;i++) {
		// console.log('layer '+i+' show? '+id('layerCheck'+i).checked);
		layers[i].show=id('layerCheck'+i).checked;
	}
	var children=id('dwg').children;
	for(i=0;i<children.length;i++) {
		var elementLayers=children[i].getAttribute('layer'); // !!!!!!!!!!!!!!!!
		// console.log('child '+i+'; id: '+children[i].id+'; layers: '+elementLayers);
		var show=false;
		for(var n=0;n<elementLayers.length;n++) {
			var l=Number(elementLayers.charAt(n));
			if(layers[l].show) show=true;
		}
		children[i].style.display=(show)?'block':'none';
	}
	var data={};
    data.layers=[];
    for(i=0;i<10;i++) {
    	data.layers[i]={};
    	data.layers[i].name=layers[i].name;
    	data.layers[i].show=layers[i].show;
    	data.layers[i].checked=id('layer'+i).checked;
    }
	var json=JSON.stringify(data);
	// console.log('layers JSON: '+json);
	window.localStorage.setItem('layers',json);
}
function setLineType(g) {
    if(g.lineType=='dashed') return (4*g.lineW)+" "+(4*g.lineW);
    else if(g.lineType=='dotted') return g.lineW+" "+g.lineW;
}
function setSizes(mode,spin,p1,p2,p3,p4) {
    // console.log('setSizes - '+mode+','+p1+','+p2+','+p3+','+p4+' spin '+spin);
    if((mode=='box')||(mode=='oval')) {
        id('first').value=Math.round(p1);
        id('between').innerHTML='x';
        id('second').value=Math.round(p2);
        id('after').innerHTML='mm';
    }
    else if(mode=='polar') { // drawing line or arc
        var h=p3-p1;
        var v=p4-p2;
        var d=Math.round(Math.sqrt(h*h+v*v));
        var a=Math.atan(v/h); // radians
        a=Math.round(a*180/Math.PI); // degrees
        a+=90; // from North
        if(p3<p1) a+=180;
        id('first').value=d;
        id('between').innerHTML='mm';
        id('second').value=a;
        id('after').innerHTML='&deg;';
    }
    else { // arc
        id('first').value=Math.round(p1); // radius
        id('between').innerHTML='mm';
        id('second').value=Math.round(p2); // angle of arc
        id('after').innerHTML='&deg;';
    }
    id('spin').value=spin;
}
function setStyle() {
	// console.log('setStyle: '+selection.length+' items selected');
	// default style settings
    id('lineType').value=lineType;
    id('line').style.borderBottomStyle=lineType;
    id('line').style.borderWidth=pen+'mm';
    id('lineStyle').value=lineStyle;
    id('penSelect').value=pen;
    id('lineColor').style.backgroundColor=lineColor;
    id('line').style.borderColor=lineColor;
    // console.log('default text: '+textFont+','+textStyle+','+textSize+','+lineColor);
    id('textFont').value=textFont;
    id('textStyle').value=textStyle;
    id('textSize').value=textSize;
    id('fillType').value=fillType;
    id('fillColor').style.backgroundColor=fillColor;
    if(fillType=='solid') id('fill').style.backgroundColor=fillColor;
    id('fill').style.opacity=opacity;
    id('patternOption').disabled=true;
    id('opacity').value=opacity;
    // set styles to suit selected element?
    var el=(selection.length==1)?id(selection[0]):null;
    if(!el) return; // no selection or multiple selection
    var t=type(el);
    if((t=='set')||(t=='dim')) return; 
    // console.log('set style for element '+el.id);
    val=getLineType(el);
    id('lineType').value=val;
    id('line').style.borderBottomStyle=val;
    val=el.getAttribute('stroke-linecap');
    // console.log('element lineStyle '+val+'; current lineStyle: '+id('lineStyle').value);
    if(val) {
    	if(val=='butt') id('lineStyle').value='square';
    	else id('lineStyle').value='round';
    }
    val=el.getAttribute('stroke-width');
    // console.log('pen: '+val);
    if(val) {
        id('line').style.borderWidth=(val/scaleF)+'px';
        val=Math.floor(val/10);
        if(val>3) val=3;
        // console.log('select option '+val);
        id('penSelect').options[val].selected=true;
    }
    val=el.getAttribute('stroke');
    if(val) {
        id('lineColor').style.backgroundColor=val;
        id('line').style.borderColor=val;
    }
    id('patternOption').disabled=false;
    val=el.getAttribute('fillType');
    // console.log('fillType: '+val);
    if(val.startsWith('pattern')) {
    	id('fillType').value='pattern';
    	id('fillColor').style.backgroundColor=id('pattern'+el.id).firstChild.getAttribute('fill');
    }
    else if(val=='none') {
    	id('fill').style.background='#00000000';
    	id('fillType').value='none';
    }
    else {
    	id('fillType').value='solid';
    	val=el.getAttribute('fill');
    	// console.log('fill color: '+val);
        if(type(el)=='text') {
            id('lineColor').style.backgroundColor=val;
        }
        else {
            id('fillColor').style.backgroundColor=val;
            id('fill').style.background=val;
        }
    }
    val=el.getAttribute('fill-opacity');
    if(val) {
    	id('opacity').value=val;
        id('fill').style.opacity=val;
    }
    if(type(el)=='text') {
        val=el.getAttribute('font-family');
        // console.log('text font: '+val);
      	if(!val || val=='undefined') val=textFont;
       	if(val) id('textFont').value=val;
        val=el.getAttribute('font-size')/scale;
        // console.log('text size: '+val);
        id('textSize').value=val;
        id('textStyle').value='fine';
        val=el.getAttribute('font-style');
        if(val=='italic') id('textStyle').value='italic';
        val=el.getAttribute('font-weight');
        if(val=='bold') id('textStyle').value='bold';
        id('patternOption').disabled=true;
        id('patternOption').disabled=true;
    } 
}
function setTransform(el) {
    // console.log('set transform for element '+el.id);
    var spin=parseInt(el.getAttribute('spin'));
    var flip=el.getAttribute('flip');
    // console.log('set spin to '+spin+' degrees and flip to '+flip+' for '+type(el));
    switch(type(el)) {
        case 'line':
        case 'shape':
            x=parseInt(el.points[0].x);
            y=parseInt(el.points[0].y);
            break;
        case 'box':
            x=parseInt(el.getAttribute('x')); // +parseInt(el.getAttribute('width'))/2;
            y=parseInt(el.getAttribute('y')); // +parseInt(el.getAttribute('height'))/2;
            break;
        case 'text':
        case 'set':
            x=parseInt(el.getAttribute('x'));
            y=parseInt(el.getAttribute('y'));
            break;
        case 'oval':
        case 'arc':
            x=parseInt(el.getAttribute('cx'));
            y=parseInt(el.getAttribute('cy'));
    }
    // console.log('x,y: '+x+','+y);
    var t='';
    if(flip) {
        var hor=flip&1;
        var ver=flip&2;
        t='translate('+(hor*x*2)+','+(ver*y)+') ';
        t+='scale('+((hor>0)? -1:1)+','+((ver>0)? -1:1)+')';
    }
    if(spin!=0) t+='rotate('+spin+','+x+','+y+')';
    el.setAttribute('transform',t);
    refreshNodes(el);
}
function showDialog(dialog,visible) {
    // console.log('show dialog '+dialog);
    if(currentDialog) id(currentDialog).style.display='none'; // hide any currentDialog
    id('colorPicker').style.display='none';
    id(dialog).style.display=(visible)?'block':'none'; // show/hide dialog
    currentDialog=(visible)?dialog:null; // update currentDialog
}
function showColorPicker(visible,x,y) {
    // console.log('show colorPicker');
    if(x) {
        id('colorPicker').style.left=x+'px';
        id('colorPicker').style.top=y+'px';
    }
    id('colorPicker').style.display=(visible)?'block':'none';
}
function showEditTools(visible) {
    if(visible) {
        id('tools').style.display='none';
        id('editTools').style.display='block';
    }
    else {
        id('editTools').style.display='none';
        id('tools').style.display='block';
    }
}
function showInfo(visible,type,layer,hint) {
	// console.log((visible)?'show info':'hide info');
	if(!visible) {
		id('info').style.top='-30px';
		return;
	}
	// console.log(type+'; '+layer+'; '+hint);
	id('type').innerText=type;
	id('layers').innerText=layer;
	id('info').style.top='0px';
	if(!hint) id('info').style.height='30px';
	else {
		id('info').style.height='50px';
		id('hint').innerText=hint;
		setTimeout(function(){id('info').style.height='30px';},10000);
	}
}
function snapCheck() {
    var near=nodes.filter(function(node) {
        return (Math.abs(node.x-x)<snapD)&&(Math.abs(node.y-y)<snapD);
    });
    if(near.length) { // snap to nearest node...
        var min=snapD*2;
        for(var i=0;i<near.length;i++) {
            var d=Math.abs(near[i].x-x)+Math.abs(near[i].y-y);
            if(d<min) {
                min=d;
                snap={'x':near[i].x,'y':near[i].y,'n':near[i].n};
            }
        }
        // console.log('SNAP x: '+snap.x+' y: '+snap.y+' n: '+snap.n);
        if(snap.n!=datum2.n) {
            datum1.x=datum2.x;
            datum1.y=datum2.y;
            datum1.n=datum2.n;
            id('datum1').setAttribute('x',datum1.x);
            id('datum1').setAttribute('y',datum1.y);
            // console.log('DATUM1: '+datum1.n+' at '+datum1.x+','+datum1.y);
            datum2.x=snap.x;
            datum2.y=snap.y;
            datum2.n=snap.n;
            id('datum2').setAttribute('x',datum2.x);
            id('datum2').setAttribute('y',datum2.y);
            // console.log('DATUM2: '+datum2.n+' at '+datum2.x+','+datum2.y);
        }
        x=snap.x;
        y=snap.y;
        return snap;
    }
    else { // if no nearby nodes...
        if(Math.abs(x-datum.x1)<snapD) x=datum.x1;
        else if(Math.abs(x-datum.x2)<snapD) x=datum.x2;
        else if(gridSnap>0) x=Math.round(x/gridSize)*gridSize;
        if(Math.abs(y-datum.y1)<snapD) y=datum.y1;
        else if(Math.abs(y-datum.y2)<snapD) y=datum.y2;
        else if(gridSnap>0) y=Math.round(y/gridSize)*gridSize;
        return false;
    }
}
function swopGraphs(g1,g2) {
    // console.log('swop graphs '+g1+' and '+g2);
    g1=Number(g1);
    g2=Number(g2);
    var graph1={};
    var graph2={};
    var transaction=db.transaction('graphs','readwrite');
    var graphs=transaction.objectStore('graphs');
    var request=graphs.get(g1);
    request.onsuccess=function(event) {
        graph1=request.result;
        // console.log('got graph: '+graph1.id);
        request=graphs.get(g2);
        request.onsuccess=function(event) {
            graph2=request.result;
            // console.log('got graph: '+graph2.id);
            var tempID=graph1.id;
            graph1.id=graph2.id;
            graph2.id=tempID;
            // console.log('IDs swopped');
            request=graphs.put(graph1);
            request.onsuccess=function(event) {
                // console.log('g1 saved');
                request=graphs.put(graph2);
                request.onsuccess=function(event) {
                    console.log('g2 saved');
                }
            }
        }
        request.onerror=function(event) {
            console.log('error getting graph2 to swop');
        }
    }
    request.onerror=function(event) {
        console.log('error getting graph1 to swop');
    }
    transaction.oncomplete=function(event) {
        console.log('swop complete');
    }
}
function textFormat(text,across) {
	var chars=text.length;
	// console.log('text: '+text+' - '+chars+' characters');
	var content='';
	var rows=[];
	var row=0;
	var i=0;
	// console.log('across: '+across);
	while(i<chars) {
		rows[row]="<tspan x='"+across+"' dy='1.2em'>"
		while((i<chars)&&(text.charAt(i)!='\n')) {
			rows[row]+=text.charAt(i);
			i++;
		}
		rows[row]+="</tspan>";
		// console.log('row '+row+': '+rows[row]);
		content+=rows[row];
		row++;
		i++;
	}
	// console.log('text content: '+content);
	return content;
}
function type(el) {
	if(el instanceof(SVGPathElement)) {
		var d=el.getAttribute('d');
		// console.log('d:'+d);
		if(d.indexOf('Q')>0) return 'curve';
		else return 'arc';
	}
    else if(el instanceof SVGPolylineElement) {
        return 'line';
    }
    else if(el instanceof SVGPolygonElement) {
        return'shape';
    }
    else if(el instanceof SVGRectElement) {
        return 'box';
    }
    else if(el instanceof SVGEllipseElement) {
        return 'oval';
    }
    else if(el instanceof SVGTextElement) {
        return 'text';
    }
    else if(el instanceof SVGGElement) {
        return 'dim';
    }
    else if(el instanceof SVGSVGElement) {
        return 'set';
    }
    else if(el instanceof SVGCircleElement) {
        return 'anchor';
    }
    else if(el instanceof SVGUseElement) {
        return 'set';
    }
    // else if(el instanceof SVGImageElement) {return 'image';}
}
function updateGraph(n,parameters,text) {
	console.log('update graph '+n+'... '+parameters);
	graph=graphs[n];
	while(parameters.length>0) {
	    var attribute=parameters.shift();
	    var val=parameters.shift();
	    // console.log('set '+attribute+' to '+val);
	    eval('graph.'+attribute+'='+val);
	}
	graphs[n]=graph;
	if(graph.type=='text') {
		document.getElementById(n).innerHTML=textFormat(graph.text,graph.x);
	}
	save();
	draw();
}
async function write(fileName,data,type) {
	var handle;
	if(!fileName) fileName='untitled';
	if(fileName.indexOf(type)<0) fileName+='.'+type;
	if(type=='svg') opts={suggestedName: fileName, types:[{description:'svg file',accept:{'image/svg+xml':['.svg']}}]};
	else opts={suggestedName: fileName};
	handle=await window.showSaveFilePicker(opts);
	// console.log('file handle: '+handle);
	if(!name) { // save drawing name at first save
		name=handle.name;
		if(name.indexOf('.')>0) name=name.substring(0,name.indexOf('.'));
		window.localStorage.setItem('name',name);
	}
	var writable=await handle.createWritable();
    await writable.write(data);
    await writable.close();
}
// START-UP CODE
load();
// SERVICE WORKER
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
}
else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js').then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}
var pattern=[];
var tile=[];
pattern[0]={'width':4, 'height':2, 'spin':0, 'tile':0};
pattern[1]={'width':4, 'height':2, 'spin':90, 'tile':0};
pattern[2]={'width':4, 'height':2, 'spin':0, 'tile':1};
pattern[3]={'width':4, 'height':2, 'spin':90, 'tile':1};
pattern[4]={'width':2, 'height':2, 'spin':0, 'tile':2};
pattern[5]={'width':4, 'height':2, 'spin':-45, 'tile':0};
pattern[6]={'width':4, 'height':2, 'spin':45, 'tile':0};
pattern[7]={'width':4, 'height':2, 'spin':-45, 'tile':1};
pattern[8]={'width':4, 'height':2, 'spin':45, 'tile':1};
pattern[9]={'width':2, 'height':2, 'spin':45, 'tile':2};
pattern[10]={'width':1, 'height':1, 'spin':0, 'tile':3};
pattern[11]={'width':4, 'height':4, 'spin':0, 'tile':4};
pattern[12]={'width':1, 'height':1, 'spin':0, 'tile':5};
pattern[13]={'width':2, 'height':2, 'spin':0, 'tile':6};
pattern[14]={'width':1, 'height':1, 'spin':45, 'tile':6};

tile[0]='<rect x="0" y="1" width="4" height="0.5" stroke="none"/>';
tile[1]='<rect x="0" y="1" width="4" height="1" stroke="none"/>';
tile[2]='<rect x="0" y="1" width="2" height="0.5" stroke="none"/><rect x="1" y="0" width="0.5" height="2" stroke="none"/>';
tile[3]='<rect x="0" y="0" width="0.5" height="0.5" stroke="none"/><rect x="0.5" y="0.5" width="0.5" height="0.5" stroke="none"/>'
tile[4]='<rect x="0" y="0" width="2" height="2" stroke="none"/><rect x="2" y="2" width="2" height="2" stroke="none"/>';
tile[5]='<circle cx="0.5" cy="0.5" r="0.25" stroke="none"/>';
tile[6]='<circle cx="1" cy="1" r="0.5" stroke="none"/>';
