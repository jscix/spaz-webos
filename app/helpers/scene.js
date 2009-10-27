/**
 * helpers for scene assistants in Spaz on Mojo 
 */
var scene_helpers = {};


/**
 * This adds a number of common scene methods to the passed scene assistant
 * @param {object} assistant a scene assistant
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	
	assistant.initAppMenu = function(opts) {

		var default_items = [
			Mojo.Menu.editItem,
			{ label: $L('New Search Card'),	command: 'new-search-card' },
			{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
			{ label: $L('About Spaz'),		command: 'appmenu-about' },
			{ label: $L('Help...'),			command:Mojo.Menu.helpCmd }
		];

		if (!opts) {
			opts = {
				'items':default_items
			};
		} else if (!opts.items) {
			opts.items = default_items;
		}
		
		// the initial app/scene commands set into the class's appMenuModel for the beverage:
		this.appMenuAttr  = {
			omitDefaultItems: true
		};
		
		this.appMenuModel = {
			visible: true,
			items: opts.items
		};

		// good to go, set up the almighty Application Menu:
		this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
	};
	

	/**
	 * opts is an object with key:val pairs, like so
	 * {
	 *	viewMenuLabel:'My Timeline';
	 *	switchMenuLabel:'View';
	 * } 
	 */
	assistant.setupCommonMenus = function(opts) {
		
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		
		/*
			View menu at top of screen
		*/
		if (opts.viewMenuItems) {
			var viewMenuItems = opts.viewMenuItems;
			this.viewMenuModel = {
				label: $L('viewmenu'), 
				items: viewMenuItems
			};
			this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.viewMenuModel);
		}
		

		/*
			Command menu at bottom of screen
		*/
		if (opts.cmdMenuItems) {
			var cmdMenuItems = opts.cmdMenuItems;
			this.cmdMenuModel = {
				visible:true,
				items: cmdMenuItems
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
		}

	};


	assistant.createStage = function(sceneName, sceneArgs, stageName) {
		// "nocache:true" tells sysmanager to not use the card caching strategy on compose cards
		var params = {name: stageName, assistantName:'StageLightweightSearchAssistant'};
		var callback = function(stageController) {
			stageController.pushScene(sceneName, sceneArgs, stageName);
		};
		Mojo.Controller.getAppController().createStageWithCallback(params, callback);
	};

	/**
	 * these are all sceneAssistant-specific calls. More are in Stage and App assistants
	 */
	assistant.handleCommand = function(event){
		
		dump(event);
		dump(event.command);
		
		if (event.type == Mojo.Event.command) {
			switch (event.command) {

				/*
					timeline filtering
				*/
				case 'filter-timeline-all':
				case 'filter-timeline-replies-dm':
				case 'filter-timeline-replies':
				case 'filter-timeline-dms':
					/*
						This is actually only defined in MyTimeline
					*/
					this.filterTimeline(event.command);
					break;
				
				case 'new-search-card':

					sc.app.new_search_card++;
					this.createStage('search-twitter', { 'lightweight':true }, sc.app.search_card_prefix+sc.app.new_search_card);

					break;
					
				case 'update-location':
					this.showLocationPanel();
					break;
					
				/*
					Compose a new message
				*/
				case 'compose':
					this.prepMessage();
					break;

				/*
					Scroll to top
				*/
				case 'scroll-top':
					dump("Scroll to top");
					this.scrollToTop();
					break;
				/*
					Scroll to bottom
				*/
				case 'scroll-bottom':
					dump("Scroll to bottom");
					this.scrollToBottom();
					break;

				/*
					Scroll to first (last in list) new item
				*/
				case 'scroll-new':
					dump("Scroll to new");
					this.scrollToNew();
					break;

				
				/*
					This would refresh the current view
				*/
				case 'refresh':
					this.refresh(); // need to have a "refresh" method defined for each scene asst
					break;

			}
		}
	};
	
	
	/**
	 *  
	 */
	assistant.scrollToTop = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		this.topContainer = this.scroller.down();
		dump('Scrolling to top');
		this.scroller.mojo.revealTop(this.topContainer);
	};
	
	/**
	 *  
	 */
	assistant.scrollToBottom = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		dump('Scrolling to bottom');
		jQuery(this.scroller).scrollTo( jQuery(this.scroller).height(), { axis:'y', duration:0 } );
	};
	
	/**
	 *  
	 */
	assistant.scrollToNew = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		var num_new   = jQuery('.timeline div.timeline-entry.new:visible', this.scroller).length;
		var first_new = jQuery('.timeline div.timeline-entry.new:visible:last', this.scroller).get(0);
		if (first_new) {
			dump('Scrolling to first new item');
			if (num_new == 1) { // if only one new, just scroll to the top
				this.scrollToTop();
			} else {
				jQuery(this.scroller).scrollTo(first_new, { axis:'y', duration:0, offset:{top:-100} });				
			}
		} else {
			dump('No new items to scroll to');
		}
	};


	/**
	 *  
	 */
	assistant.filterTimeline = function(command) {
		
		if (!command) {
			command = this.filterState;
		}
		
		switch (command) {
			case 'filter-timeline-all':
				jQuery('#my-timeline div.timeline-entry').show();
				break;
			case 'filter-timeline-replies-dm':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.reply, #my-timeline div.timeline-entry.dm').show();
				break;
			case 'filter-timeline-replies':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.reply').show();
				break;
			case 'filter-timeline-dms':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.dm').show();
				break;
			default:
				jQuery('#my-timeline div.timeline-entry').show();
		}
		
		this.filterState = command;	
	};
	
	
	
	assistant.setTimelineTextSize = function(tl_id, size) {
		size = size.toLowerCase();
		
		var sizes = ['tall', 'grande', 'venti'];
		
		var tl = jQuery(tl_id);
		
		for (var i=0; i < sizes.length; i++) {
			tl.removeClass(sizes[i]);
		};
		tl.addClass(size);
	};
	
	
	
	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/location-popup',
	          assistant: new LocationDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	

	/**
	 *  
	 */
	assistant.addPostPopup = function(event) {

		alert('DEPRECATED');

		
	};
	
	
	assistant.initTwit = function(event_mode) {
		// var username = sc.app.prefs.get('username');
		// var password = sc.app.prefs.get('password');
		
		var event_mode = event_mode || 'jquery'; // default this to jquery because we have so much using it
		
		var users = new Users(sc.app.prefs);
		
		this.twit = new scTwit(null, null, {
			'event_mode':event_mode,
			'timeout':1000*60
		});
		this.twit.setSource(sc.app.prefs.get('twitter-source'));

		if (sc.app.userid) {
			// alert('setting credentials for '+sc.app.username);
			
			var userobj = users.getUser(sc.app.userid);
			
			if (userobj.type === SPAZCORE_SERVICE_CUSTOM) {
				var api_url = users.getMeta(sc.app.userid, 'api-url');
				this.twit.setBaseURL(api_url);
			} else {
				this.twit.setBaseURLByService(userobj.type);				
			}
			this.twit.setCredentials(userobj.username, userobj.password);
			
		} else {
			// alert('NOT seetting credentials for!');
		}
	};
	


	/**
	 *  
	 */
	assistant.removePostPopup = function(event) {
		
		alert('DEPRECATED');
		
	};


	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/location-popup',
	          assistant: new LocationDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	assistant.showPostPanel = function(opts) {
		
		Mojo.Controller.stageController.pushScene("post", {
			'text'         : opts.text         || '',
			'type'         : opts.type         || null,
			'select_start' : opts.select_start || 0,
			'select_length': opts.select_length|| 0,
			'irt_status'   : opts.irt_status   || null,
			'irt_status_id': opts.irt_status_id|| 0
		});
		
	};
	
	
	/**
	 *  
	 */
	assistant.prepMessage = function() {
		this.showPostPanel({
			'text'         : '',
			'type'         : null,
			'select_start' : 0,
			'select_length': 0
		});
	};

	
	/**
	 *  
	 */
	assistant.prepRetweet = function(entryobj) {
		var text = entryobj.SC_text_raw;
		var screenname = entryobj.user.screen_name;

		var text = 'RT @' + screenname + ': '+text+'';
		
		this.showPostPanel({
			'text'         : text,
			'type'         : null,
			'select_start' : text.length,
			'select_length': text.length
		});


	};

	/**
	 *  
	 */
	assistant.prepDirectMessage = function(username) {
		
		var text = 'd ';
		
	    if (username) {
			text += (username + ' ');
	    }
	
		this.showPostPanel({
			'text'         : text,
			'type'         : null,
			'select_start' : 2,
			'select_length': text.length
		});

	};



	/**
	 *  
	 */
	assistant.prepPhotoPost = function(url) {
	    
		if (!url) {
			return false;
		}
	
		var text = url + ' ';
		
		this.showPostPanel({
			'text'         : text,
			'type'         : null,
			'select_start' : url.length+1,
			'select_length': text.length
		});		
	};



	/**
	 *  
	 */
	assistant.prepReply = function(username, status_id, statusobj) {
		var text = '@';
		
	    if (username) {
			text += username + ' ';
	    }
	
		this.showPostPanel({
			'text'         : text,
			'type'         : null,
			'select_start' : text.length,
			'select_length': text.length,
			'irt_status'   : statusobj,
			'irt_status_id': status_id
		});
	
	};



	/**
	 * 
	 */
	assistant.searchFor = function(terms, scenetype) {

		var lightweight = false;
		if (scenetype === 'lightweight') {
			lightweight = true;
		}
		
		/*
			if username and pass aren't set, use lightweight version
		*/
		if (!(sc.app.username && sc.app.password)) {
			lightweight = true;
		}
			
		Mojo.Controller.stageController.pushScene("search-twitter", {
			'searchterm': terms,
			'lightweight': lightweight
		});
	};



	
	assistant.setupInlineSpinner = function(id) {
		// alert('setup:'+id);
		this.controller.setupWidget(id, {spinnerSize: Mojo.Widget.spinnerSmall}, {});
	};
	
	assistant.showInlineSpinner = function(id, message) {
		// alert('showing!'+"\n"+id+"\n"+message);

		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		$(id).mojo.start();
		
		dump("SPINNER CONTAINER HTML (start):"+jQuery('#'+id+'-container').get(0).outerHTML);
	};
	
	


	/**
	 *  stops, but does not remove, the spinner
	 */
	assistant.stopInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id).get(0).mojo.stop();
	};


	/**
	 *  starts an existing spinner
	 */
	assistant.startInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		jQuery('#'+id).get(0).mojo.start();
	};


	assistant.hideInlineSpinner = function(id) {
		jQuery('#'+id).get(0).mojo.stop();
		jQuery('#'+id+'-container').hide();
	};
	

	/**
	 *  immediately DESTROYS an existing spinner
	 */
	assistant.clearInlineSpinner = function(container) {
		dump("clearing inline spinner");
		jQuery(container).empty();		
	};
	
	
	
	
	assistant.activateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(id);
		buttonWidget.mojo.activate();
	};

	assistant.deactivateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(id);
		buttonWidget.mojo.deactivate();
	};
	
	

	assistant.showBanner = function(text, category) {
		
		var category = category || 'misc';
		
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		var bannerArgs = {
			'messageText':text
		};
		if (sc.app.prefs.get('sound-enabled')) {
			bannerArgs.soundClass = 'alerts';
		}

		var appController = Mojo.Controller.getAppController();
		appController.showBanner(bannerArgs, launchArgs, category);
	};

	
	
	assistant.newMsgBanner = function(count) {
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		var bannerArgs = {
			'messageText':"There are "+count+" new messages"
		};
		if (sc.app.prefs.get('sound-enabled')) {
			bannerArgs.soundClass = 'alerts';
		}
		var category = 'newMessages';
		var appController = Mojo.Controller.getAppController();
		
		appController.showBanner(bannerArgs, launchArgs, category);
		this.showDashboard($L('New Messages'), bannerArgs.messageText, count, this.getStageName());
	};



	assistant.newSearchResultsBanner = function(count, query) {				
		var category = 'newSearchResults_'+query;
		var appController = Mojo.Controller.getAppController();
		var stageController = appController.getActiveStageController();
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		var bannerArgs = {
			'messageText':count+" new results for '"+query+"'"
		};
		if (sc.app.prefs.get('sound-enabled')) {
			bannerArgs.soundClass = 'alerts';
		}
		
		
		appController.showBanner(bannerArgs, launchArgs, category);
		this.showDashboard($L('New Messages'), bannerArgs.messageText, count, this.getStageName());
		
	};
	
	
	
	assistant.showDashboard   = function(title, message, count, fromstage) {
		
		//  Post a banner notification and create or update Dashboard if there are new stories 
		var appController = Mojo.Controller.getAppController(); 
		var dashboardStageController = appController.getStageProxy(SPAZ_DASHBOARD_STAGENAME); 

		if (dashboardStageController) { 
			dashboardStageController.delegateToSceneAssistant("updateDashboard", title, message, count, fromstage); 
		} else {
			var sceneArgs = {'title': title, 'message': message, 'count': count, 'fromstage':fromstage};
			var pushDashboard = function(stageController){
				stageController.pushScene('dashboard', sceneArgs); 
			}; 
			appController.createStageWithCallback({
					'name':SPAZ_DASHBOARD_STAGENAME,
					'lightweight':false
				},
				pushDashboard,
				'dashboard'
			); 
		} 
	};
	
	
	
	assistant.showNotification = function(msg) {
		
	};
	
	
	
	assistant._initSound = function() {

		var makeCue = function(clip) {
			var cue = new Audio();
			if (cue.palm) {
				cue.mojo.audioClass = "media";
			}
			cue.src = clip;
			cue.autoplay = false;
			return cue;
		};
		
		this.audioCues = {
			'newmsg':  makeCue(Mojo.appPath + 'sounds/New.mp3'),
			'send':    makeCue(Mojo.appPath + 'sounds/CSnd.mp3'),
			'receive': makeCue(Mojo.appPath + 'sounds/CRcv.mp3'),
			'startup': makeCue(Mojo.appPath + 'sounds/On.mp3'),
			'shutdown':makeCue(Mojo.appPath + 'sounds/Off.mp3'),
			'wilhelm': makeCue(Mojo.appPath + 'sounds/wilhelm.mp3')
		};


	};
	
	
	
	assistant.playAudioCue = function(clip) {
		
		dump('trying to play '+clip);
		
		if (!this.audioCues) {
			this._initSound();
		};

		try {
			this.audioCues[clip].play();
		} catch (err) {
			this.showDialogBox('error', err);
		}

	};



	assistant.processAjaxError = function(errobj) {		

		var human_msg, twiterr_req, twiterr_msg;
		
		switch(errobj.msg) {
			case 'timeout':
				
				human_msg = $L('The request timed out – server did not respond in time');
				break;
				
			case 'error':
				
				if (errobj.xhr.status == 400) {
					human_msg = $L('Request limit exceeded');
				} else if (errobj.xhr.status == 401) {
					human_msg = $L('You are not authorized to view this content');
				} else if (errobj.xhr.status == 403) {
					human_msg = $L('You are not authorized to view this content');
				} else if (errobj.xhr.status == 404) {
					human_msg = $L('The requested URL doesn\'t exist');
				} else if (errobj.xhr.status == 500) {
					human_msg = $L('There was an error on the server');
				} else if (errobj.xhr.status == 502) {
					human_msg = $L('Servers are down or being upgraded');
				} else if (errobj.xhr.status == 503) {
					human_msg = $L('Servers are overloaded');
				} else {
					human_msg = $L('Unknown error');
				}
				
				try {
					var twiterr = sch.deJSON(errobj.xhr.responseText);
					twiterr_req = twiterr.request;
					twiterr_msg = twiterr.error;
				} catch (e) {
					dump('Tried to decode JSON from responseText, but failed');
					dump(e.name + ":" + e.message);
				}
				
				break;
				
			case 'notmodified':
			
				human_msg = $L('Not modified');
				
				break;
				
			case 'parsererror':
				
				human_msg = $L('Error parsing XML returned by request');
				
				break;
			
			default:
			
				human_msg = $L('Ajax Error');
				break;
		}
		
		if (errobj.xhr && errobj.xhr.readyState > 3) {
			var error_processed = {
				'status':		errobj.xhr.status,
				'statusText':	errobj.xhr.statusText,
				'responseText':	errobj.xhr.responseText,
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			};
		} else {
			var error_processed = {
				'status':		'n/a',
				'statusText':	'n/a',
				'responseText':	'n/a',
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			};
			
		}

		return error_processed;
		
	};
	
	
	
	assistant.checkInternetStatus = function(on_success, on_failure) {
		this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		    method: 'getstatus',
			parameters: {},
		    onSuccess: on_success,
		    onFailure: on_failure
		});
	};

	
	
	
	
	assistant.displayErrorInfo = function(msg, errors, template) {
		
		var error_info;
		var error_html = '';
		
		dump(errors);
		
		if (!sch.isArray(errors)) {
			var err = errors;
			errors = [errors];
		}
		
		dump(errors);
		
		if (!template) {
			template = 'error_info_text';
		} 

		
		if ( errors ) {
			for (var i = 0; i < errors.length; i++) {
				error_info  = this.processAjaxError(errors[i]);
				if (error_html.length>0) {
					error_html += "-------------------\n";
				}
				error_html += sc.app.tpl.parseTemplate(template, error_info);
			}
		}

		var dialog_widget = Mojo.Controller.errorDialog(error_html);

		
		// /*
		// 	We want to be able to pass html into the error dialogs, but escaping is on,
		// 	so we do a little dynamic workaround
		// */
		// var dialog_widget = Mojo.Controller.errorDialog(msg+' {{error_html}}');
		// dialog_widget.innerHTML = dialog_widget.innerHTML.replace('{{error_html}}', error_html);
		
	};


	assistant.clearTimelineCache = function(callback) {
		this.cacheDepot = TempCache.clear();
	};
	
	
	
	
	assistant.bindTimelineEntryTaps = function(tl_selector) {
		jQuery(tl_selector+' div.timeline-entry', this.scroller).live(Mojo.Event.tap, function(e) {
			var jqtarget = jQuery(e.target);

			e.stopImmediatePropagation();

			if (jqtarget.is('div.timeline-entry>.user') || jqtarget.is('div.timeline-entry>.user img')) {
				var userid = jQuery(this).attr('data-user-screen_name');
				Mojo.Controller.stageController.pushScene('user-detail', userid);
				return;

			} else if (jqtarget.is('.username.clickable')) {
				var userid = jqtarget.attr('data-user-screen_name');
				Mojo.Controller.stageController.pushScene('user-detail', userid);
				return;

			} else if (jqtarget.is('.hashtag.clickable')) {
				var hashtag = jqtarget.attr('data-hashtag');
				thisA.searchFor('#'+hashtag);
				return;

			} else if (jqtarget.is('div.timeline-entry .meta')) {
				var status_id = jqtarget.attr('data-status-id');
				var isdm = false;
				var status_obj = null;

				status_obj = thisA.getTweetFromModel(parseInt(status_id, 10));

				if (jqtarget.parent().parent().hasClass('dm')) {
					isdm = true;
				}

				Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
				return;

			} else if (jqtarget.is('div.timeline-entry a[href]')) {
				return;

			} else {
				var status_id = jQuery(this).attr('data-status-id');
				var isdm = false;
				var status_obj = null;

				if (jQuery(this).hasClass('dm')) {
					isdm = true;
				}

				Mojo.Controller.stageController.pushScene('message-detail', {'status_id':status_id, 'isdm':isdm, 'status_obj':status_obj});
				return;
			}
		});
	};
	
	assistant.unbindTimelineEntryTaps = function(tl_selector) {
		jQuery(tl_selector+' div.timeline-entry', this.scroller).die(Mojo.Event.tap);
	};
	
	
	
	/**
	 * This helps us set up listening for the Enter key in a textbox
	 * 
	 * the callback function's 'this' references the assistant 
	 * 
	 * make sure to call stopListeningForEnter when done with the
	 * correct ID so the listener is unbound
	 * 
	 * @param {string} id
	 * @param {function} callback
	 */
	assistant.listenForEnter = function (id, callback){
		Mojo.Event.listen(this.controller.get(id),
			Mojo.Event.propertyChange,
			this._listenerForEnter.bind(this, callback),
			true
		);
	};
	assistant._listenerForEnter = function(callback, event) {
		dump("DUMPING EVENT");
		dump(event);
		dump(event.originalEvent);
		dump("DUMPING CALLBACK");
		dump(callback);
		if (event && Mojo.Char.isEnterKey(event.originalEvent.keyCode)) {
			dump("CALLING CALLBACK");
			callback.call(this);
			return;
		}
	};
	
	/**
	 * removes the listener set up by listenForEnter
	 * 
	 * @param {string} id
	 */
	assistant.stopListeningForEnter = function(id) {
		Mojo.Event.stopListening(this.controller.get(id),
			Mojo.Event.propertyChange,
			this._listenerForEnter
		);
	};
	
	
	/**
	 * A helper to easily display JS alert()-style popups
	 * @param {string} msg  required 
	 * @param {string} title  optional 
	 * @param {function} ok_cb  callback like function(value) where value is value assigned to OK button. Optional
	 */
	assistant.showAlert = function(msg, title, ok_cb, choices) {
		
		var default_choices = [
			{label:$L('Okay'), value:"okay", type:'dismiss'}
		];
		
		var title    = title   || 'Alert';
		var msg      = msg     || '';
		var onChoose = ok_cb   || function(choice) {
			return true;
		};
		var choices  = choices || default_choices;
		
		this.controller.showAlertDialog({
			'onChoose':onChoose,
			'title':   $L(title),
			'message': $L(msg),
			'choices': choices
		});
	};
	
	
	
	assistant.getStageName = function() {
		if (window.name) {
			var stagename = window.name;
		} else {
			var stagename = 'main';
		}
		return stagename;
	};



	assistant.openInBrowser = function(url) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
		  method: "open",
		  parameters:  {
		      id: 'com.palm.app.browser',
		      params: {
		          target: url
		      }
		  }
		});
	};
	
	
	assistant.trackStageActiveState = function() {
		this.isFullScreen = true;
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen.bind(this));
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen.bind(this));
	};

	assistant.stopTrackingStageActiveState = function() {
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen);
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen);
	};

	assistant._setNotFullScreen = function(event) {
		this.isFullScreen = false;//send notifications
	};
	assistant._setFullScreen = function(event) {
		this.isFullScreen = true; //dont send notifications
		Spaz.closeDashboard();
	};
	
	
};








/*
	Small controller class used for the update location account dialog
*/
var LocationDialogAssistant = Class.create({
	
	initialize: function(sceneAssistant) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
	},
	
	setup : function(widget) {
		this.widget = widget;
		
		/*
			update button
		*/
		this.updateButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.updateButtonModel = {
			buttonLabel : "Update Location",
			buttonClass: 'primary'
		};
		this.controller.setupWidget('update-location-button', this.updateButtonAttributes, this.updateButtonModel);
		


		/*
			get location button
		*/
		this.getLocationButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.getLocationButtonModel = {
			buttonLabel : "Get Location",
			buttonClass: 'secondary'
		};
		this.controller.setupWidget('get-location-button', this.getLocationButtonAttributes, this.getLocationButtonModel);
		
		

		
		/*
			location text field
		*/
		this.locationBoxAttr = {
			"hintText":	      'Enter new location',
			"focusMode":      Mojo.Widget.focusSelectMode,
			"fieldName": 	  'update-location-textfield',
			"changeOnKeyPress": true,
			"maxLength":      30,
			"autoReplace":    false
		};
		this.locationBoxModel = {
			'value':     '',
			'disabled':  false
		};
		this.controller.setupWidget('update-location-textfield', this.locationBoxAttr, this.locationBoxModel);
		
		
	},
	
	activate: function() {
		var thisA = this;
		Mojo.Event.listen($('update-location-button'), Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.listen($('get-location-button'), Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	deactivate: function() {
		var thisA = this;
		Mojo.Event.stopListening($('update-location-button'), Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.stopListening($('get-location-button'), Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	getLocation: function() {
	
		var thisA = this;

		var on_success = function(data) { // onsuccess
			dump(data);
			var lat_str = data.latitude.toPrecision(10).toString();
			var lon_str = data.longitude.toPrecision(10).toString();
			thisA.locationBoxModel.value = lat_str + ',' + lon_str;
			thisA.controller.modelChanged(thisA.locationBoxModel);
			thisA.controller.get('get-location-button').mojo.deactivate();
		};
		var on_error = function(data) { // onerror
			dump(data);
			thisA.controller.get('get-location-button').mojo.deactivate();
			jQuery('#location-popup-error').html($L('Could not get current location. You may need to accept terms and conditions in <strong>Location Services</strong>'));
		};
		
		var loc = new Mojo.Service.Request('palm://com.palm.location', {
				method:"getCurrentPosition",
				parameters:{
					'accuracy':     1,
					'responseTime': 1,
					'maximumAge':  60 // seconds
				},
				'onSuccess':on_success,
				'onFailure':on_error
			}
		);
	},
	
	updateLocation: function() {
		var thisA = this;
		
		jQuery().bind('update_location_succeeded', function() {
			thisA.controller.get('update-location-button').mojo.deactivate();
			jQuery('#location-popup-message').html($L('Location updated on Twitter'));
			thisA.widget.mojo.close();
		});
		jQuery().bind('update_location_failed', function() {
			thisA.controller.get('update-location-button').mojo.deactivate();
			jQuery('#location-popup-error').html($L('Updating location on Twitter failed or timed-out'));
		});
		
		this.sceneAssistant.twit.updateLocation(this.locationBoxModel.value);
	}
	
});