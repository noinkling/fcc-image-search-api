'use strict';
const express = require("express");
const mongo = require("mongodb").MongoClient;
const https = require("https");
const querystring = require("querystring");

const MONGO_URL = process.env.MONGOLAB_URI ||
                 `mongodb://${process.env.IP || "localhost"}:27017/image-search`;
const SERVICE_REQUEST_BASE_OPTIONS = Object.freeze({
  hostname: "api.datamarket.azure.com",
  path: "/Bing/Search/v1/Image?$format=json&",
  auth: `${process.env.BING_KEY}:${process.env.BING_KEY}`,
  headers: { "Accept": "application/json" }
});

const app = express();
                 
app.set('views', __dirname);
app.set('view engine', 'jade');


mongo.connect(MONGO_URL).then(db => {
  
  const searches = db.collection("searches");
  
  // Make query string case insensitive
  app.use((req, res, next) => {
    for (let key of Object.keys(req.query)) {
      req.query[key.toLowerCase()] = req.query[key];
    }
    next();
  });
  
  
  // Do a search
  app.get("/imagesearch/new/:query", (req, res, next) => {
    
    const query = req.params.query;
    const offset = req.query.offset;
    
    // Make request to external image search API
    makeServiceRequest(query, offset)
    .then(serviceResponse => {
      const data = serviceResponse[0],
            statusCode = serviceResponse[1];
            
      if (statusCode === 403)
        return res.json({ error: "Monthly request limit has been exceeded." });
      
      res.json(transformServiceResponse(data));
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
    
  });
  
  
  // Show latest 10 searches
  app.get("/imagesearch/latest", (req, res, next) => {
    
    const cursor = searches.find()
      .project({_id: 0})
      .sort({when: -1})
      .limit(10);
    cursor.toArray().then(docs => {
      res.json(docs);
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
    
  });
  
  
  // Fallthrough: serve instructions
  app.get("*", (req, res) => {
    res.render("index");
  });
  
  
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`Server listening on port ${server.address().port}`);
  });
  
  
  function makeServiceRequest(query, offset) {
    return new Promise((resolve, reject) => {
      
      const cursor = searches.insertOne({
        query,
        when: new Date()
      })
      .catch(err => {
        console.error(err);
      });
      
      const options = Object.assign({}, SERVICE_REQUEST_BASE_OPTIONS);
      const queryObject = { "Query": `'${query}'` };
      if (offset) queryObject["$skip"] = offset;
      options.path += querystring.stringify(queryObject);
      
      https.get(options, res => {
        
        res.setEncoding("utf8");
        let responseBody = "";
        res.on("data", chunk => responseBody += chunk);
        res.on("end", () => {
          resolve([JSON.parse(responseBody), res.statusCode]);
        });
        
      }).on("error", reject);
      
      console.log(`Made request to https://${options.hostname + options.path}\nSearch query: "${query}", Search offset: ${offset}`);
      
    });
  }
  
  
}).catch(handleError);


function transformServiceResponse(data) {
  return data.d.results.map(result => (
    {
      url: result.MediaUrl,
      thumbnail: (result.Thumbnail && result.Thumbnail.MediaUrl),
      context: result.SourceUrl,
      snippet: result.Title
    }
  ));
}


function handleError(err) {
  process.nextTick(() => { throw err });
}
