var MongoClient = require('mongodb').MongoClient,
    http = require('http'),
    map = function(list, transform) {
        var ret = [];
        for (var i = 0; i < list.length; i++) {
            ret[i] = transform(list[i]);
        }
        return ret;
    },
    find = function(list, condition) {
        for (var i = 0; i < list.length; i++) {
            if (condition(list[i])) {
                return list[i];
            }
        }
    },
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
    buildingInfoMiddleware = function(db) {
        return function(req, res) {
            var address = req.query.address;
            db.collection('buildings').find({"address": address, "floorArea": {$gt: 0}}).toArray(function(err, buildings) {
                db.collection('solar').find({"_id": { "$in": map(buildings, function(it) { return it._id; }) } }).toArray(function(err, solars) {
                    res.end(JSON.stringify(map(buildings, function(it) {
                        var solarDoc = find(solars, function(sol) { return sol._id == it._id; });
                        if (solarDoc) {
                            it.solar = solarDoc.solar;
                        }
                        return it;
                    })));
                });
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
                    respond = buildingInfoMiddleware(db);
                }
            });
        } catch (e) {
            respond = queryFromAPI;
        } finally {
            respond(req, res);
        }
    }

module.exports = function(req, res) {
    respond(req, res);
};