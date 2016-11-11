# responseinterceptor
This package is **Middleware** for express responses. It allows intercept an express response ( res.send , res.end , res.write, res.render, ... ) 
and update or upgrade response with your logic.

 * [Installation](#installation)
 * [Using responseinterceptor](#using) 
    * [Intercept all routes](#all)
    * [Intercept a group of routes(all routes in the same file)](#allroute)
    * [Intercept a group of routes( some routes in the same file)](#allgroup) 
    * [Intercept a single route](#single)  
 * [Examples](#examples)
    * [Intercept response and add information to response if Content-Type is "application/json"](#ex1)
    * [Intercept response and add information to response if Content-Type is "text/html"](#ex2)
 
## <a name="installation"></a>Installation
To use **responseinterceptor** install it in your project by typing:

```shell
$ npm install responseinterceptor
```

## <a name="using"></a>Using responseinterceptor

### Include responseinterceptor

Just require it like a simple package:

```javascript
var responseinterceptor = require('responseinterceptor');
```

### responseinterceptor middleware
response interceptor is a middleware that intercept an express response, so you can use it in the routes that you want intercept

#### <a name="all"></a> Intercept all routes
to intercept all routes use it in app.js
```javascript

   var responseinterceptor = require('responseinterceptor');
   
   app.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
      
   // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX
   // For Example add Date & Time of response in Body fields
   var NewResponse=body;
   if(bodyContentType==="application/json")  // if body is a Json
         NewResponse.otherInformation=Date.now(); // add response date&time
   
   callback(NewResponse); // callback function with the new content 
   
   }));    

```
#### <a name="allroute"></a> Intercept a group of routes(all routes in the same file)
to intercept a group of routes use it as a ROUTER middleware. for example intercept all routes "/intercept". 
Define a router for "/intercept", for example in file routeInt.js
```javascript

var express = require('express');
var router = express.Router();
    
var responseinterceptor = require('responseinterceptor');
   
router.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){   
    // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX       
    // For Example add Date & Time of response in Body fields
      
    var NewResponse=body;
    if(bodyContentType==="application/json")  // if body is a Json
         NewResponse.otherInformation=Date.now(); // add response date&time
   
    callback(NewResponse); // callback function with the new content 
   
}));
   
// other routes ...

```

In app.js use the "/intercept" route
```javascript    
   var routeInt = require('../routes/routeInt');
   app.use('/intercept', routeInt);   

```

#### <a name="allgroup"></a> Intercept a group of routes( some routes in the same file)
to intercept a group of routes use it as a ROUTER middleware. for example intercept all routes "/intercept/onlythis". 
Define a router for "/intercept", for example in file routeInt.js
```javascript

    var express = require('express');
    var router = express.Router();
    
    var responseinterceptor = require('responseinterceptor');
    
    // ############ BEGIN of routes to not intercept ############
        router.get("/", function(req,res,next){
            // your logic
        });
        
        router.post("/", function(req,res,next){
            // your logic
        });
        
        // ..... other routes .....
        
      
    // ############ BEGIN of routes to intercept ############
    
        router.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
       
          // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX
          // For Example add Date & Time of response in Body fields
         
          var NewResponse=body;
          if(bodyContentType==="application/json")  // if body is a Json
                 NewResponse.otherInformation=Date.now(); // add response date&time
       
          callback(NewResponse); // callback function with the new content        
        }));    
    
        router.get("/onlythis", function(req,res,next){
            // your logic
            res.send({data:"...."}); // responseinterceptor intercept this response
        });
            
        router.post("/onlythis", function(req,res,next){
            // your logic
            res.send({data:"...."}); // responseinterceptor intercept this response
        });
            
        // ..... other routes to intercept .....
             

```

In app.js use the "/intercept" route
```javascript    
   var routeInt = require('../routes/routeInt');
   app.use('/intercept', routeInt); 
```

#### <a name="single"></a> Intercept a single route
to intercept a single route use it as a route middleware. for example intercept route "/intercept" in post method but not in get. 
Define a router for "/intercept", for example in file routeInt.js
```javascript

    var express = require('express');
    var router = express.Router();
    
    var responseinterceptor = require('responseinterceptor');
    
    // not interceptable route
    router.get("/",function(req,res,next){
    
    });
   
   // interceptable route
   router.get("/",middlewareInterceptor ,function(req,res,next){
       // Your Logic
       
       res.send({data:"...."}); // responseinterceptor intercept this response
   });
   
     
    var middlewareInterceptor= responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
   
   // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX
   // For Example add Date & Time of response in Body fields
   
   var NewResponse=body;
   if(bodyContentType==="application/json")  // if body is a Json
         NewResponse.otherInformation=Date.now(); // add response date&time
   
   callback(NewResponse); // callback function with the new content   
   }));   

```

In app.js use the "/intercept" route
```javascript    
   var routeInt = require('../routes/routeInt');
   app.use('/intercept', routeInt);  
```


## <a name="examples"></a>`Examples`

### <a name="ex1"></a>`Intercept response and add information to response if Content-Type is "application/json"`

Intercept a group of routes and add at the the response the timestamp in a filed called "timestamp" if body Content-Type is "application/json"
```javascript

    var express = require('express');
    var router = express.Router();
    
    var responseinterceptor = require('responseinterceptor');
    
    // ############ BEGIN of routes to not intercept ############
        router.get("/", function(req,res,next){
            res.status(200).send({"content":"myContent"});
        });
                        
        // ..... other routes .....
        
   
    
    
    // ############ BEGIN of routes to intercept ########################
    
        router.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
        
            var NewResponse=body;
            if(bodyContentType==="application/json")  // if body is a Json
                     NewResponse.timestamp=Date.now(); // add response date&time
       
            callback(NewResponse); // callback function with the new content 
       
        }));    
    
        router.get("/withTimestamp", function(req,res,n ext){
            // responseinterceptor intercept this response 
            res.status(200).send({"content":"myContent"});
        });
            
        // ..... other routes to intercept .....
        
      

```

In app.js use the "/intercept" route
```javascript    
   var routeInt = require('../routes/routeInt');
   app.use('/intercept', routeInt);   

```

Call service with curl to print results
```shell
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 23
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

{"content":"myContent"} // content with no timestamp field
$
$
$
$
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept/withTimestamp
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 51
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

{"content":"myContent","timestamp":"1478870174325"} // content with timestamp field

```


### <a name="ex2"></a>`Intercept response and add information to response if Content-Type is "text/html"`


Intercept a group of routes and replace all html tag <ul> to <ol> 
```javascript

    var express = require('express');
    var router = express.Router();
    
    var responseinterceptor = require('responseinterceptor');
    
    
    var htmlContent=`<html>
                        <head> </head>
                        <body contenteditable="false">                    
                            <h2>An ordered HTML list</h2>                    
                            <ul>
                                <li>Coffee</li>
                                <li>Tea</li>
                                <li>Milk</li>
                            </ul>
                        </body>
                    </html>`;
    
    // ############ BEGIN of routes to not intercept ############
        router.get("/", function(req,res,next){
            res.status(200).send(htmlContent);
        });
                        
        // ..... other routes .....
        
    
    // ############ BEGIN of routes to intercept ############
    
        router.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
          
            var NewResponse=body;
            if(bodyContentType==="text/html")  // if body is a html
                     body.replace("<ul>","<ol>");
       
            callback(NewResponse); // callback function with the new html content 
       
        }));    
    
        router.get("/withTimestamp", function(req,res,n ext){
            // responseinterceptor intercept this response 
            res.status(200).send(htmlContent);
        });
            
        // ..... other routes to intercept .....

```

In app.js use the "/intercept" route
```javascript    
   var routeInt = require('../routes/routeInt');
   app.use('/intercept', routeInt);   

```

Call service with curl to print results
```shell
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 316
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

// content with original <ul> tag
<html>
    <head> </head>
        <body contenteditable="false">                    
            <h2>An ordered HTML list</h2>                    
                <ul>
                    <li>Coffee</li>
                    <li>Tea</li>
                    <li>Milk</li>
                </ul>
        </body>
</html>
$
$
$
$
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept/withTimestamp
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 316
ETag: "35-6BXjKyRXlm+rSEU9a23z/g"
Date: Fri, 11 Nov 2016 13:16:44 GMT
Connection: keep-alive

// content with modified <ol> tag
<html>
    <head> </head>
        <body contenteditable="false">                    
            <h2>An ordered HTML list</h2>                    
                <ol>
                    <li>Coffee</li>
                    <li>Tea</li>
                    <li>Milk</li>
                </ol>
        </body>
</html>

```
