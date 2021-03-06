const MIME_TYPE = 'text/csv';
const SKIP_SETS = ['DPA', 'EVENT', 'VAN', ' '];

function processCSV(results, file) {
	var cards = {};
	console.log(results);
	console.log(file);


	// First, parse the CSV list, and build an array of objects that combine foil and non-foil cards.
	// Fuck performance, we're going to burn space and memory like it's 2014 just in case MTGO does something stupid (seems likely someday)
	for (var i = 0; i < results.data.length; i++) 
	{
		var row = results.data[i];
		if (typeof row === "undefined") continue;

		var name = row["Card Name"];
		if (typeof name === "undefined" || name === "") continue;				// Skip blank rows.

		//Check if we need to mangle the card's name for the sake of the coll2 format:		
		// Replace any / in split card names with //
		name = name.replace('/',' // ');		

		// Replace any Æ with AE
		name = name.replace('Æ',"AE");

		var setCode = row["Set"];
		var card_id = name+"~"+setCode;
		var card = cards[card_id];
		
		if (typeof card === "undefined")  {
			card = { 
				name: name, 
				setCode: setCode, 
				nonFoil: 0, 
				foil: 0 
			};
		}
		if (row["Premium"] == "Yes") {
			card.foil += parseInt(row["Quantity"]);
		}
		else {
			card.nonFoil += parseInt(row["Quantity"]);
		}
		cards[card_id] = card;
	}


	// Then, create a JSON array of objects that store the data in a convert_coll compatible format
	var outputJSON = [];
	for (var card_id in cards) {
		var card = cards[card_id];
		outputJSON.push({
			"Card Name"    : card.name,
			"Cardset"      : set_trans[card.setCode],				//see table.js for the giant map of set codes. Surround the code in '' so we can deal with 2ED style codes.
			"# Owned"      : card.nonFoil,
			"# Foil Owned" : card.foil
		});
	}

	// Next, we convert that JSON object back to CSV
	var csv = Papa.unparse(outputJSON);
	console.log(csv);

	// Finally, we need to create a blob and create a download link for the user.
	var blob = new Blob([csv], {type: MIME_TYPE});

	var a_href = window.URL.createObjectURL(blob);
	var a_download = 'decked_' + file.name;
	$('<a>',{
		'text' : 'Download CSV File!',
		'href' : a_href,
		'download' : a_download,
		'data-downloadurl' : [MIME_TYPE, a_download, a_href].join(':'),
		'draggable' : true
	}).appendTo('#downloadArea');

	$('#msgOutput').append("<li>Completed processing the file! Download your CSV file above, and upload it at <a href='http://www.mtgo-stats.com/convert_coll/em'>MTGO-Stats</a> to finish your collection file!</li>");
}


$(document).ready(function () {
	$('#csvFile').change(function() {
		$(this).parse({
			config: {
				header: true,
				complete: processCSV,
				//worker: true,
			},
			before: function(file, inputElem) {
				$("#msgOutput").append("<li>Started processing " + file.name + "!</li>");
			},
			error: function(err, file, inputElem, reason) {
				$('#msgOutput').append("<li>Something error happen. Check Console.Log for now!</li>");
				console.log("Main JQUERY level error handler: ", err, file, inputElem, reason);
			}
		});
	});
	
});
