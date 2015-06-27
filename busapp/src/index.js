// Alexa SDK for JavaScript v1.0.00
// Copyright (c) 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. Use is subject to license terms.
// Modified by github.com/dkeitel

/**
 * App ID for the skill, specify this in config.json
 */
var APP_ID = '';

/**
 * Google Maps API Key, specify this in config.json
 */
var GMAPS_KEY = '';

var https = require('https');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to get transit data from Google Maps; specify this URL in config.json
 */
var urlPrefix = '';

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

var fs = require('fs');

var data = fs.readFileSync('./config.json'), config;

try {
	config = JSON.parse(data);
	GMAPS_KEY = config.GMAPS_KEY;
	APP_ID = config.APP_ID;
	urlPrefix = config.urlPrefix;
}
catch (err) {
	console.log('There has been an error parsing your JSON.')
	console.log(err);
}

/**
 * NextBusSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var NextBusSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
NextBusSkill.prototype = Object.create(AlexaSkill.prototype);
NextBusSkill.prototype.constructor = NextBusSkill;

NextBusSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("NextBusSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

NextBusSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("NextBusSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

NextBusSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

NextBusSkill.prototype.intentHandlers = {

    GetFirstEventIntent: function (intent, session, response) {
        handleFirstEventRequest(intent, session, response);
    },

    HelpIntent: function (intent, session, response) {
        var speechOutput = "With Next Bus, you can query Google Maps for the next bus.  " +
            "For example, you could say get me the next bus to school.";
        response.ask(speechOutput);
    },

    FinishIntent: function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "The Next Bus";
    var repromptText = "With Next Bus, you can query Google Maps for the next bus.  " +
            "For example, you could say get me the next bus to school.";
    var speechOutput = "Next bus, what time is the next one?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    response.askWithCard(speechOutput, repromptText, cardTitle, speechOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleFirstEventRequest(intent, session, response) {
    var destinationSlot = intent.slots.destination;
    var repromptText = "With Next Bus, you can query Google Maps for the next bus.  " +
            "For example, you could say get me the next bus to school.";
    var sessionAttributes = {};

    getJsonEventsFromGoogleMaps(function (events) {
        var speechText = events;
        if (events.length == 0) {
            speechText = "There is a problem connecting to Wikipedia at this time. Please try again later.";
            response.tell(speechText);
        } else {
            speechText = speechText;
            response.askWithCard(speechText, repromptText, "Next Bus", speechText);
        }
    });
}

function getJsonEventsFromGoogleMaps(eventCallback) {
    var url = urlPrefix + GMAPS_KEY;

    https.get(url, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
	    var json = JSON.parse(body);
	    var time = json.routes[0].legs[0].steps[1].transit_details.departure_time.text;
	    var line_name = json.routes[0].legs[0].steps[1].transit_details.headsign;
	    var station = json.routes[0].legs[0].steps[1].transit_details.departure_stop.name;
	    var stringResult = 'The next bus with headsign ' + line_name + ' departs at ' + time + ' from ' + station;
	    console.log(stringResult);
            eventCallback(stringResult);
        });
    }).on('error', function (e) {
        console.log("Got error: ", e);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the NextBus Skill.
    var skill = new NextBusSkill();
    skill.execute(event, context);
};

