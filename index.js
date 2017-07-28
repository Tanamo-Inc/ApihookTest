const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const recipepuppyHost = 'http://www.recipepuppy.com/api/?q=';

app.get('/dummyget', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': 'dummy speech', 'displayText': 'dummy get works!' }));
});


app.post('/recipe', function (req, res) {
    console.log(req);
    let recipeitem = '';
    if (req.body.result.parameters['recipeitem']) {
        recipeitem = req.body.result.parameters['recipeitem'];
        console.log('Finding recipe for : ' + recipeitem);
    }

    callRecipePuppy(recipeitem).then((output) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    })
        .catch((error) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
        });
});

function callRecipePuppy(recipeitem) {
    return new Promise((resolve, reject) => {
        http.get(recipepuppyHost + recipeitem, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                let jO = JSON.parse(body);
                let firstItem = jO.results[0];

                let output = firstItem.title + " using " + firstItem.href;
                resolve(output);
            });

            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

app.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});