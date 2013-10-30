var MongoClient = require('mongodb').MongoClient,
    fail = function(req, res) { res.end(); },
    buildingInfoMiddleware = function(collection) {
        return function(req, res) {
            var address = req.query.address;
            collection.find({"address": address}).toArray(function(err, docs) {
                res.end(JSON.stringify(docs));
            });

        };
    },
    respond = function(req, res) {
        MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
            if (err) {
                respond = fail;
                console.warn("can't connect", err);
            } else {
                console.log("Connected to", process.env.MONGOLAB_URI);
                respond = buildingInfoMiddleware(db.collection('buildings'));
            }
            respond(req, res);
        });
    }

module.exports = function(req, res) {
    respond(req, res);
};