/* data storage object */
var $data = {
	activeTabId: null
};

var $func = {
	doClick: function() {
		/* an example message informing content_script.js we have clicked the button */
		$func.sendMessage('contentscript', '/message/button/clicked', function(response) {
			console.log('button clicked! content script informed! trouble follows! ('+response+')');
		});
		return true;
	},
	doOther: function() {
		/* 
		 * do other thing here 
		 */
		return true;
	},
	doSomething: function() {
		/* 
		 * do something here 
		 */
		return true;
	},
	pageReady: function() {
		/* this function contains whatever we need to do when the page is ready */
		$('button#default').click(function() {
			$func.doClick();
		});
		return true;
	},
	processMessage: function( from, value ) {
		if (from === 'example') {
			switch (value) {
				case '/message/button/clicked':
					$func.receiveClick();
					break;
				case '/message/something':
					$func.doSomething();
					break;
				case '/message/other':
					$func.doOther();
					break;
				default:
					/* no idea what we just got, return false */
					console.log('got weird message from: ['+from+']: ['+value+']');
					return false;
			}
		}
		return true;
	},
	receiveClick: function() {
		/* we just received a click signal from the content script */
		console.log('button clicked in tab!');
		return true;
	},
	sendMessage: function( to, message, callback ) {
		console.log('sending message to: ['+to+']: ['+message+']');
		/* construct our message body */
		var msg = {
			from: 'popup',
			to: to,
			value: message
		};
		chrome.tabs.sendMessage($data.activeTabId, msg, function(response) {
			console.log('OUTBOUND MESSAGE to: ['+to+']: ['+JSON.stringify(msg)+'] with response: ['+JSON.stringify(response)+']');
			/* call the callback with our response data for processing if necessary */
			return typeof(callback) === 'function' && callback((typeof(response) !== 'undefined') ? response : null);
		});
		return false;
	}
};

$(function() {
	console.log('initializing control panel...');
	/* this next line queries chrome to get the tab.id of the currentWindow/active tab */
	chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
		console.log('got tab number: ['+tabs[0].id+']');
		$data.activeTabId = tabs[0].id;
		$func.pageReady();
	});
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		/* listen for messages, and this next line prints ALL rx'ed messages to console for dev purposes */
		/* you will want to get rid of this, because your popup will receive messages from ALL the *
		 * content_script.js instances running in ALL tabs (since that's the way it works)         */
		console.log('message received! msg: ['+JSON.stringify(message)+'] from:['+JSON.stringify(sender)+']');
		/* if the message is malformed in any way, drop it */
		if (!sender || !sender.tab || !sender.tab.id || typeof(sender.tab.id) !== 'number') return false;
		/* if the message sender is not the current tab, drop it */
		/* NOTE: if you want to do things in other tabs, you'll need to change this logic to isolate that tab */
		if (sender.tab.id !== $data.activeTabId) return false; 
		/* if we need to autorespond to the message (for example "acknowledged"), do it using sendResponse() */
		/* these lines respond with error messages because we are the intended recipient BUT message is malformed */
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
		/* otherwise, if we made it here, we can now process the inbound message and autorespond "acknowledged" */
		console.log('INBOUND MESSAGE from: ['+message.from+']: ['+message.value+']. acknowledging...');
		sendResponse({value:'/message/ack'});
		/* now send the message data to our message-processing function */
		$func.processMessage(message.from, message.value);
	});
});

