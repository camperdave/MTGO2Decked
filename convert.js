const MIME_TYPE = 'text/csv';

function handleFileSelect(evt) {	
	var files = evt.target.files; // FileList object
	
	f = files[0];

	var reader = new FileReader();

	reader.onload = (function makeReaderFunction(name) {
		return (function() {
			var prefs = {};
			prefs.csv = reader.result;
			prefs.csvName = name;

			var csv_cards = $.csv.toObjects(prefs.csv);
			var have_cards = {};
			for(i = 0; i < csv_cards.length; i++) {
				var card_line = csv_cards[i];
				if (card_line['Set'] != 'DPA') {
					var card_id = card_line["Card Name"] + "~" + set_trans[card_line["Set"]];
					if (have_cards[card_id] == null) {
						have_cards[card_id] = {};
						have_cards[card_id].foil = 0;
						have_cards[card_id].nonfoil = 0;
					}

					if(card_line['Premium'] == 'Yes') {
						have_cards[card_id].foil += parseInt(card_line["Quantity"]);
					}
					else {
						have_cards[card_id].nonfoil += parseInt(card_line["Quantity"]);
					}
				}
				if(set_trans[card_line["Set"]] === undefined) {
					var bad_card = card_line["Card Name"] + " [" + card_line["Set"] + ']' + " - " + card_line["ID #"];
					console.log(bad_card);
					$("<li>", {
						'text' : bad_card
					}).appendTo("#errorList");
				}
			}

			var csv_out = 'Card Name,Cardset,# Owned,# Foil Owned\n';

			$.each(have_cards, function(key, value) {
				var id = key.split('~');

				if(id[0].indexOf(',') !== -1) {
					id[0] = '"' + id[0] + '"';
				}

				csv_out = csv_out + id[0] + ',' + id[1] + ',' + value.nonfoil + ',' + value.foil + '\n'
			})
			var bb = new Blob([csv_out], {type: MIME_TYPE});

			$('#csvFile').html("Successfully processed CSV File: " + prefs.csvName);
			// $('#csvOut').val(csv_out);
			var a_href = window.URL.createObjectURL(bb);
			var a_download = 'decked_' + prefs.csvName;
			$('<a>',{
				'text' : 'Download CSV File!',
				'href' : a_href,
				'download' : a_download,
				'data-downloadurl' : [MIME_TYPE, a_download, a_href].join(':'),
				'draggable' : true
			}).appendTo('#downloadArea');
		})
	})(f.name);
	
	// Read in the image file as a data URL.
	reader.readAsText(f);
	
}


// Make sure the checkbox checked state gets properly initialized from the
// saved preference.
$(document).ready(function () {
	$('#csvFile').change(handleFileSelect);
});
