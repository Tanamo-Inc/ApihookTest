const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const jokeApi = 'https://api.chucknorris.io/jokes/random';
const wikiApi = 'https://en.wikipedia.org/w/api.php?'; 

app.get('/dummyget', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': 'dummy speech', 'displayText': 'dummy get works!' }));
});

app.post('/webhook', function (req, res) {

    if (req.body.result.parameters['joke']) {
        callJokes()
            .then((output) => {
                let result = toApiAiResponseMessage(output.value, output.value, toTelgramObject(output.value, 'Markdown'));
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(result));
            })
            .catch(errorHandler);
    }
    
    else if (req.body.result.parameters['search']) {
        var searchTerm = req.body.result.parameters['search'];
       callWikiPedia(searchTerm)
            .then((output) => {
                let displayText = `Nothing Found for: ${searchTerm}`;
                let result;
                if (output && output[0]) {
                    displayText = `Here is what I found in Wikipedia about ${output[1][0]}: ${output[2][0]}: ${output[3][0]}`;
                    let telegramText = htmlEntities(`Here is what I found in Wikipedia about *${output[1][0]}*: ${output[2][0]} \n\n Read more at [WikiPedia](${output[3][0]})`);
                    result = toApiAiResponseMessage(displayText, displayText, toTelgramObject(telegramText, 'Markdown'));
                }
                res.setHeader('Content-Type', 'application/json');
                if (result) {
                    res.send(JSON.stringify(result));
                }
                else {
                    res.send(JSON.stringify(displayText));
                }
            });
    }
    
    else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': "No Proper hook found", 'displayText': "No Proper hook found" }));
    }
    
});


function callJokes() {
    return new Promise((resolve, reject) => {
        https.get(jokeApi, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                let jO = JSON.parse(body);
                resolve(jO);
            });

            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

function callWikiPedia(searchTerm, format = "json", action = "opensearch", limit = 3, profile = "fuzzy") {
    return new Promise((resolve, reject) => {
        let url = `${wikiApi}&format=${format}&action=${action}&limit=${limit}&profile=${profile}&search=${searchTerm}`;
        https.get(url, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                let jO = JSON.parse(body);
                resolve(jO);
            });
            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

function toTelgramObject(text, parse_mode) {
    return {
        text: text,
        parse_mode: parse_mode
    }
}

function toApiAiResponseMessage(speech, displayText, telegramObject = null) {
    return {
        speech: speech,
        displayText: displayText,
        data: {
            telegram: telegramObject
        }
    }
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function errorHandler(error) {
    console.log(error);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(toApiAiResponseMessage(error, error, toTelgramObject(error, 'Markdown'))));
}

app.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
