var MongoClient = require('mongodb').MongoClient,
    http = require('http'),
    queryFromAPI = function(request, response) {
        var req = http.request({
            hostname: 'energiatieto-2-0.herokuapp.com',
            port: 80,
            path: '/building?address=' + encodeURIComponent(request.query.address)
        },
        function(res) {
            var body = "";
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function() {
                response.end(body);
            })
        });
        req.end();
    },
    buildingInfoMiddleware = function(collection) {
        return function(req, res) {
            var address = req.query.address;
            collection.find({"address": address, "floorArea": {$gt: 0}}).toArray(function(err, docs) {
                res.end(JSON.stringify(docs));
            });

        };
    },
    respond = function(req, res) {
        try {
            MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
                if (err) {
                    respond = queryFromAPI;
                    console.warn("can't connect", err);
                } else {
                    console.log("Connected to", process.env.MONGOLAB_URI);
                    respond = buildingInfoMiddleware(db.collection('buildings'));
                }
                respond(req, res);
            });
        } catch (e) {
            respond = queryFromAPI;
        }
    }

module.exports = function(req, res) {
    respond(req, res);
};