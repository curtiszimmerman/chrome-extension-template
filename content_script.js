/* we've declared jquery.min.js and content_script.css to also be included as content scripts */

var $func = {
	processMessage: function( from, value ) {
		switch (value) {
			case '/message/button/clicked':
				console.log('message from: ['+from+']: ['+value+']');
				$func.showModal();
				break;
			default:
				console.log('received strange message from ['+from+']: ['+value+']');
				return false;
		}
	},
	sendMessage: function( to, message, callback ) {
		var to = typeof(to) === 'undefined' ? 'popup' : to;
		var msg = {
			from: 'contentscript',
			to: to,
			value: message
		};
		chrome.runtime.sendMessage(msg, function(response) {
			console.log('OUTBOUND MESSAGE to: ['+to+']: ['+JSON.stringify(msg)+']');
			return typeof(callback) === 'function' && callback(response);
		});
	},
	showModal: function() {
		/* attach a bunch of things to the DOM */
		$('body').append('<div class="funModal"></div>');
		$('div.funModal').append('<div>YOU CLICKED THE BUTTON!</div><br>');
		$('div.funModal > div').append('<button id="unclick">DO NOT CLICK ME</button>');
		$('button#unclick').click(function() {
			/* report the button click to popup */
			$func.sendMessage('popup', '/message/button/clicked', function() {
				/* remove the thing we just made */
				$('div.funModal').remove();
			});
		});
		return true;
	}
};

$(function() {
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		console.log('received message: sender: ['+sender+']: ['+JSON.stringify(message)+']')
		if (!sender) return false;
		if (typeof(message) === 'undefined') {
			sendResponse({value:'/message/error/invalid'});
			return false;
		}
		if (typeof(message.from) === 'undefined') {
			sendResponse({value:'/message/error/invalid/from'});
			return false;
		}
		if (typeof(message.value) === 'undefined') {
			sendResponse({value:'/message/error/invalid/value'});
			return false;
		}
		if (message.to === 'contentscript' && message.from === 'popup') {
			console.log('INBOUND MESSAGE from: ['+message.from+']: ['+message.value+']. acknowledging...');
			sendResponse({value:'/message/ack'});
			/* now send the message data to our message-processing function */
			$func.processMessage(message.from, message.value);
		}
	});
});
