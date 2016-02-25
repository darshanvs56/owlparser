var obj;
var iriStr = "http://webprotege.stanford.edu/R";
var descriptionStr="http://purl.org/dc/elements/1.1/description";
var mesg="OWL Parsing Complete";
var text = '{"allowedEdges": [' ;
var iriMap = new Object(); 
var parentChild = new Object();
var descriptionMap = new Object(); 
//need to add a label map if required
//check description and label-2 labels seen
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
        myFunction(xhttp);
    }
};
xhttp.open("GET", "root-ontology.owx", true);
xhttp.send();

//need to check for double quotes and replace wherever necessary
function myFunction(xml) {
    var xmlDoc = xml.responseXML;

    
    //xmlDoc.getElementsByTagName('Declaration')[0].children[0].getAttribute('IRI');*/
    //for irimap-will be used later just create it for now
    var length=xmlDoc.getElementsByTagName('Declaration').length;
    var Declaration=xmlDoc.getElementsByTagName('Declaration');
    for (var i = 0; i < length ; i++) {
    	//add check for http standford and check for iRI present since we have des as one of the key sometimes
        //http://hayageek.com/javascript-string-contains/
        var attrVal=''+Declaration[i].children[0].getAttribute('IRI')+'';
        if(contains(attrVal,iriStr)){
    	   iriMap[Declaration[i].children[0].getAttribute('IRI')]='';
        }
    }
    
    var subClasslen=xmlDoc.getElementsByTagName('SubClassOf').length;
    var subClass=xmlDoc.getElementsByTagName('SubClassOf');
    for (var j = 0; j < subClasslen; j++) {
    		//check for cross browser issues needed
    		//case 1 we have only 2 classes top one being parent bottom class being child
    
    	if(subClass[j].children.length==2){
    		if(subClass[j].children[1].getAttribute('IRI')!=null){
    		//	parentChild[subClass[j].children[0].getAttribute('IRI')]=subClass[j].children[1].getAttribute('abbreviatedIRI');
    		//}else{
    			parentChild[subClass[j].children[0].getAttribute('IRI')]=subClass[j].children[1].getAttribute('IRI');	
    		}
            if(subClass[j].children[1].children.length==2){
                //case 2 need to handle object propery 
                //above class subClass[j].children[0].getAttribute('IRI')-above object property
                //subClass[j].children[1].children[0].getAttribute('IRI');-object iri
                //below object child subClass[j].children[1].children[1].getAttribute('IRI')-child of object prop
                if(subClass[j].children[1].children[1].getAttribute('IRI')==null){
                    var src=subClass[j].children[1].children[1].innerHTML.trim();
                    src=src.replace(/(\r\n|\n|\r)/gm,'');
                    src=src.replace(/&quot;/g,'');
                    src=src.replace(/;t/g,'');
                    src=src.replace(/"t"/g,'');
                    src=src.replace(/"/g,'');
                    text+='{"source":"'+src+'","properties": {},';
                }else{
                        var src=subClass[j].children[0].getAttribute('IRI');
                        src=src.replace(/(\r\n|\n|\r)/gm,'');
                        src=src.replace(/"/g,'');  
                        text+='{"source":"'+src+'","properties": {},';
                }
                    if(subClass[j].children[1].children[1].getAttribute('IRI')==null){
                        var target=subClass[j].children[0].getAttribute('IRI');
                        target=target.replace(/(\r\n|\n|\r)/gm,'');
                        target=target.replace(/&quot;/g,'');
                        target=target.replace(/"/g, '');
                    text+='"target": "'+target+'","label": "'+subClass[j].children[1].children[0].getAttribute('IRI')+'" }, '
                }else{
                   var target=subClass[j].children[1].children[1].getAttribute('IRI');
                    target=target.replace(/(\r\n|\n|\r)/gm,'');
                    target=target.replace(/&quot;/g,'');
                    target=target.replace(/"/g, '');
                   text+='"target": "'+target+'","label": "'+subClass[j].children[1].children[0].getAttribute('IRI')+'" }, '
                }

            }
		}
    }

    var annotationlen=xmlDoc.getElementsByTagName('AnnotationAssertion').length;
    var annotation=xmlDoc.getElementsByTagName('AnnotationAssertion');
    for (var k = 0; k < annotationlen; k++) {
    	if(annotation[k].children[0].getAttribute('IRI')==null){
    		//if its null means we have recieved the label value
    		//just ensuring we have the abbrevated uri
    		if(annotation[k].children[0].getAttribute('abbreviatedIRI')!=null){
	    		var iri=annotation[k].children[1].innerHTML.trim();
	    		var value =annotation[k].children[2].innerHTML.trim();
	    		iriMap[iri]=value;
    	}

    	}else{

    		//we have recieved the description value
    		//check if this is the description only
    		//format - check string starts with -http://purl.org/dc/elements/1.1/description
    		var iri=annotation[k].children[0].getAttribute('IRI');
    		if(iri!=null){
    			//need to check for description properly
    		 if(contains(iri,descriptionStr)){
	    		var iri=annotation[k].children[1].innerHTML.trim();
		    	var description =annotation[k].children[2].innerHTML.trim();
				descriptionMap[iri]=description;
			}
		}
    }
   };
	//replace the iri with the actual value and create the json
	//now generate the json and end the function
	//rest of the code involves replace the text from the map 

    generateJson();
    replaceIriWithRealData();

    //finally make it json string by 
    try{
        obj=JSON.parse(text);
        
        document.getElementById('demo').innerHTML=mesg;
        document.getElementById('result').innerHTML=text;
    }catch(err){
        document.getElementById('result').innerHTML='There is an Error with the JSON generated' +'\n'+ text;
 	    document.getElementById('demo').innerHTML=mesg + '\t'+'But there is an error in JSON';

    }
    //and store it in a file if required
    //check if its a valid json in http://jsonlint.com/

	console.log(text);
}

function generateJson(){

for (var key in parentChild) {
  if (parentChild.hasOwnProperty(key)) {
    //text = "'"+text+"'";
        key=key.replace(/"([^"]+(?="))"/g, '$1');
        key=key.replace(/["']/g,"")
        key=key.replace(/(\r\n|\n|\r)/gm,'');
        key=key.replace(/&quot;/g,'');
        key=key.replace(/"/g, '');
        text+='{"source":"'+parentChild[key]+'","properties": {},';
        text+='"target": "'+key+'","label": "is a" }, '

    //console.log(key +  + iriMap[key]);
  }
}
var pos = text.lastIndexOf(',');
text = text.substring(0,pos)+' ], '+text.substring(pos+1);
text+= '"nodeTypes": {';
for (var key in descriptionMap) {
  if (descriptionMap.hasOwnProperty(key)) {
    //text = "'"+text+"'";
    //removing double quotes http://stackoverflow.com/questions/19156148/i-want-to-remove-double-quotes-from-a-string
        var des=descriptionMap[key];
        des=des.replace(/"([^"]+(?="))"/g, '$1');
        des=des.replace(/(\r\n|\n|\r)/gm,'');
        des=des.replace(/&quot;/g,'');
        des=des.replace(/"/g,'');

        text+= '"'+key+'": {"description": {"datatype": "u","validation": null,"description": "'+des+'","default": "","auto": null,"required": false,"slug": "description-1","value": "","display": false},'
        text+='"label": {"datatype": "u","validation": null,"description": "'+key+'","default": "","auto": null,"required": false,"slug": "label-1",'
        text+='"value": "","display": false}},'
  }
}
var pos = text.lastIndexOf(',');
text = text.substring(0,pos)+' } } '+text.substring(pos+1);
}

function replaceIriWithRealData(){
for (var key in iriMap) {
  if (iriMap.hasOwnProperty(key)) {
    var mapval=iriMap[key];
    mapval=mapval.replace(/&quot;/g,'');
    mapval=mapval.replace(/"/g,'');
   
    key=key.replace(/"([^"]+(?="))"/g, '$1');
    key=key.replace(/["']/g,"");
   
    text = text.replaceAll('"'+key+'"', '"'+mapval+'"');
    }
}

}


function contains(r, s) {
  return r.indexOf(s) > -1;
}

String.prototype.replaceAll = function (find, replace) {
    var str = text;
    return text.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};
(function () {

    var textFile = null,
  makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    return textFile;
  };


  var create = document.getElementById('create');
  var textbox = document.getElementById('result');

  create.addEventListener('click', function () {
    var link = document.getElementById('downloadlink');
    link.href = makeTextFile(textbox.value);
    link.style.display = 'block';
  }, false);
})();


