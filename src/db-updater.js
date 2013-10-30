var XmlStream = require('xml-stream'),
    http = require('http'),
    zipcodeCutoffPoint = 2600,
    maxFeatures = 1000000,
    operations = 0,
    MongoClient = require('mongodb').MongoClient,

    runUpdate = function() {
        function updateBuildingInfos(withBuilding, endCallback) {

            var request = http.get({
                host: 'kartat.espoo.fi',
                path: '/teklaogcweb/wfs.ashx?service=wfs&version=1.1.0&request=GetFeature&typeName=GIS:Rakennukset&maxFeatures=1000000&srsName=EPSG:4326',
                auth: process.env.WFS_BASIC_AUTH
            }).on('response', function(response) {
                response.setEncoding('UTF-8');
                var xml = new XmlStream(response);
                xml.on('data', function(data) {
                    //process.stdout.write(data);
                });
                xml.on('endElement: GIS:Rakennukset', function(building) {
                    withBuilding(building);
                    //console.log(building['GIS:Rakennustunnus'], building['GIS:Kerrossala']);
                });
                xml.on('endElement: ServiceException', function(ServiceException) {
                    console.log(ServiceException);
                });
                xml.on('end', function() {
                    endCallback();
                });
            });
        }

        MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
            if (err) throw err;

            var collection = db.collection('buildings');

            function zipcodeQuery(greaterThan, lessThan) {
                return "<GetFeature service=\"WFS\" version=\"1.1.0\" maxFeatures=\""+maxFeatures+"\">" +
                        "<Query typeName=\"kanta:Rakennus\" srsName=\"EPSG:4326\">"+
                            "<Filter>"+
                                "<And>"+
                                    (greaterThan ? 
                                            "<PropertyIsGreaterThanOrEqualTo><PropertyName>//kanta:osoite/yht:postinumero</PropertyName><Literal>"+greaterThan+"</Literal></PropertyIsGreaterThanOrEqualTo>"
                                        :"")+
                                    (lessThan ? 
                                            "<PropertyIsLessThan><PropertyName>//kanta:osoite/yht:postinumero</PropertyName><Literal>"+lessThan+"</Literal></PropertyIsLessThan>"
                                        :"")+
                                "</And>"+
                            "</Filter>"+
                        "</Query>"+
                    "</GetFeature>";
            };

            function addressToBuildingIds(postdata, buildingcallback, endcallback) {
                var post_request = http.request({
                    host: 'kartat.espoo.fi',
                    path: '/teklaogcweb/wfs.ashx?service=wfs&version=1.1.0&request=GetFeature',
                    auth: process.env.WFS_BASIC_AUTH,
                    method: 'POST',
                    headers: {
                        'Content-Length': postdata.length
                    }
                }).on('response', function(response) {
                    response.setEncoding('UTF-8');
                    console.log("received response");

                    var xml = new XmlStream(response);
                    xml.on('data', function(data) {
                        //process.stdout.write(data);
                    });

                    xml.on('endElement: kanta:Rakennus', function(building) {
                        buildingcallback(building);
                    });
                    xml.on('endElement: ServiceException', function(ServiceException) {
                        console.log(ServiceException);
                    });
                    xml.on('end', function() {
                        endcallback();
                    })
                });
                console.log("requesting", postdata);
                post_request.write(postdata);
                post_request.end();
            }

            function doUpdateBuildingInfos() {
                console.log("running building info update job.");
                updateBuildingInfos(function(building) {
                    var multiGeom = building['GIS:Geometry']['gml:MultiGeometry'],
                        constructed = building['GIS:Valmistunut'],
                        constructionYear,
                        pos;
                    if (constructed) {
                        try {
                            constructionYear = parseInt(constructed.substring(constructed.lastIndexOf(".") + 1), 10);
                        } catch (e) {
                            console.log("error parsing", constructed, e);
                        }
                    }

                    if (multiGeom) {
                        var posText = multiGeom['gml:geometryMember']['gml:Point']['gml:pos'].$text.split(" ");
                        pos = {
                            x: posText[0],
                            y: posText[1]
                        }
                    }
                    
                    collection.findAndModify(
                        {
                            "_id": building['GIS:Rakennustunnus']
                        },
                        [],
                        {
                            "$set": {
                                "floorCount": parseInt(building['GIS:Kerrosluku'], 10),
                                "floorArea" : parseInt(building['GIS:Kerrossala'], 10),
                                "heatingMethod": building['GIS:Lammitystapa'],
                                "fuel": building['GIS:Polttoaine'],
                                "constructionYear": constructionYear,
                                "pos": pos
                            }
                        },
                        {},
                        function(err, doc) {
                            if (err) {
                                console.log("error:", err);
                            }
                        });
                },
                function() {
                    console.log("run complete. closing db.");
                    db.close();
                });
            }

            function createAddressMap(callback) {
                function withBuilding(building) {
                    var road    = building['kanta:osoite']['yht:osoitenimi']['yht:teksti'].$text,
                        addressNode = building['kanta:osoite'],
                        addressNum = (addressNode['yht:osoitenumero2'] || addressNode['yht:osoitenumero']),
                        address = road + (addressNum ? " " + building['kanta:osoite']['yht:osoitenumero2'] : "");

                    collection.save({
                        "_id"     : building['kanta:rakennustunnus'],
                        "address" : address,
                        "road"    : road
                    }, function(err, db) {
                        if (err) {
                            console.log("error:", err);
                        }
                    });
                }

                addressToBuildingIds(
                    zipcodeQuery(null, 2600), 
                    withBuilding,
                    function(buildings) {
                        addressToBuildingIds(
                            zipcodeQuery(2600, 2800), 
                            withBuilding,
                            function(buildings) {
                                addressToBuildingIds(
                                    zipcodeQuery(2800, null), 
                                    withBuilding,
                                    doUpdateBuildingInfos
                                );
                            }
                        );
                    }
                );
            }

            createAddressMap();
            //doUpdateBuildingInfos();
        });

    };

runUpdate();