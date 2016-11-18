# responseinterceptor
This package is **Middleware** for express responses. It allows intercept an express response ( res.send , res.end , res.write, res.render, ... ) 
and update or upgrade response with your logic.

 * [Installation](#installation)
 * [Using responseinterceptor](#using) 
    * [Intercept all routes](#all)
    * [Intercept a group of routes](#group)
        * [Intercept a group of routes with all routes defined in the same file](#allroute)
        * [Intercept a group of routes using express routing defined in different file](#allgroup)         
    * [Intercept single route](#single)    
        * [Intercept a single route](#singlemiddle)  
        * [Intercept a single route using responseinterceptor not as a middleware](#onfly)   
 * [Reference](#reference)  
    * [intercept](#intercept)  
    * [interceptOnFly](#interceptOnFly)   
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

### <a name="all"></a> Intercept all routes
To intercept all routes use it in app.js before all app.use(".....") route functions 
```javascript
var responseinterceptor = require('responseinterceptor');
var routeTwo=require("./routes/routeTwo");
var app=express();
 
app.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
    // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX
    // For Example add Date & Time of response in Body fields
    var NewResponse=body;
    if(bodyContentType==="application/json")  // if body is a Json
         NewResponse.otherInformation=Date.now(); // add response date&time
    callback(NewResponse); // callback function with the new content 
}));  

// All routes defined under the responseinterceptor middleware will intercetate
app.use("exampleRoute_one",function(req,res,next){
    // your logic
}); 
app.use("exampleRoute_Two",routeTwo);  

//.... Other routes ...  
```


### <a name="group"></a> Intercept a group of routes

### <a name="allroute"></a> Intercept a group of routes defined in the same file
To intercept only a group of routes use responseinterceptor middleware after the routes that do not have to be intercepted 
and before all routes to intercept. For example intercept all routes "/intercept/onlythis".
```javascript
var express = require('express');    
var responseinterceptor = require('responseinterceptor');
var app=express();
    
    
// ############ Group of routes to not intercept ############
    app.get("/", function(req,res,next){
        // your logic
    });    
    app.post("/", function(req,res,next){
        // your logic
    });
    app.get("/intercept", function(req,res,next){
        // your logic
    });
    // ..... other routes to not intercept .....
        
// ############ Group of routes to intercept ############
    // responseinterceptor middleware before all routes to intercept
    app.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){
      // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX
      // For Example add Date & Time of response in Body fields
      var NewResponse=body;
          
      if(bodyContentType==="application/json")  // if body is a Json
             NewResponse.otherInformation=Date.now(); // add response date&time
      callback(NewResponse); // callback function with the new content        
    }));  
    app.get("/intercept/onlythis", function(req,res,next){
        // your logic
        res.send({data:"...."}); // responseinterceptor intercept this response
    });
    app.post("/intercept/onlythis", function(req,res,next){
        // your logic
        res.send({data:"...."}); // responseinterceptor intercept this response
    }); 
    // ..... other routes to intercept .....
```

### <a name="allgroup"></a> Intercept a group of routes using express routing
To intercept only a group of routes using express routing use responseinterceptor middleware in a separate express file routing definition.
For example intercept all routes "/intercept". 
Define a router for "/intercept", for example in file routeInt.js
```javascript
var express = require('express');
var router = express.Router();
var responseinterceptor = require('responseinterceptor');

// responseinterceptor before all routes to intercept
router.use(responseinterceptor.intercept(function(body, bodyContentType ,request, callback){   
    // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX       
    // For Example add Date & Time of response in Body fields
    var NewResponse=body;
    if(bodyContentType==="application/json")  // if body is a Json
         NewResponse.otherInformation=Date.now(); // add response date&time
    callback(NewResponse); // callback function with the new content
}));   
// define routes to incerpt
app.get("/", function(req,res,next){
    // your logic
    res.send({data:"...."}); // responseinterceptor intercept this response
});
app.post("/alsothis", function(req,res,next){
    // your logic
    res.send({data:"...."}); // responseinterceptor intercept this response
}); 
// other routes to intercept ...
```

In app.js use the "/intercept" route
```javascript    
   var routeInt = require('../routes/routeInt');
   var app=express();
   app.use('/intercept', routeInt);   
```


### <a name="single"></a> Intercept single routes
To intercept single route response use "responseinterceptor" not like a global level middleware but 
in the single endpoint definition level, as middleware or in the endpoint logic.
You would think that, using the "responseinterceptor" in the single endpoint could having no sense because you would think
to include the interceptor function content directly in the endpoint definition before to send response. 
But this is not always true, there are some real cases where you need to do it. 
For example:
*   If you need to save all response log included all information embedded in the response from the write/end function
    (for example fields etag,content-lenght... are calculated in write/end after res.send call).
*   If you need to intercept the response content after page rendering from a template engine like "jade/pug" to modify 
    or log some contents. intercept response content after res.render().  

#### <a name="singlemiddle"></a> Intercept a single route with responseinterceptor middleware
To intercept a single route use responseinterceptor middleware in the endpoint route definition. 
For example intercept all route "/intercept/"..." in post method but not in get method. 
```javascript
var express = require('express');
var app=express();
var responseinterceptor = require('responseinterceptor');
    
// not interceptable route
app.get("/",function(req,res,next){
    
});
// interceptable route
app.post("/",middlewareInterceptor ,function(req,res,next){
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
// the next route even if defined after "responseinterceptor middleware" is not interceptable 
// because "responseinterceptor middleware" s used not like a global  level middleware but 
// at endpoint definition level.
app.get("/notInterceptable",function(req,res,next){
    // Your Logic   
    res.send({data:"...."}); // responseinterceptor not intercept this response
 });
 
// next a interceptable route 
app.post("/interceptable",middlewareInterceptor,function(req,res,next){
 // Your Logic   
 res.send({data:"...."}); // responseinterceptor intercept also this response
});
```

#### <a name="onfly"></a> Intercept a single route using responseinterceptor not as a middleware
To intercept a single route using responseinterceptor not as middleware but only if a particular condition 
in the endpoint logic is satisfied you should use interceptOnFly function like in the example bellow 
For example intercept a route "/intercept/"..." in get method only if request have a filed "intercept" set to true
```javascript
var express = require('express');
var app=express();
var responseinterceptor = require('responseinterceptor');
    
// not interceptable route
app.get("/",function(req,res,next){
    
});
// intercept route only if request have a filed "intercept" set to true
app.get("/intercept",function(req,res,next){
   // Your Logic   
   if(req.query.intercept==true){
        responseinterceptor.interceptOnFly(req, res, callback){   
            // XXXXXXX ... YOUR LOGIC AFTER RESPONSE INTERCEPT ... XXXXXXX
            // NewResponse=......
            callback(NewResponse); // callback function with the new content   
        }));
   }
   
   // other logic .....
      
   // responseinterceptor intercept this response 
   // only if request have a filed "intercept" true
   res.send({data:"...."});                                        
});
```

## <a name="reference"></a>`Reference`

### <a name="intercept"></a>`intercept(fn)`
responseinterceptor intercept(fn) is a middleware that intercept an express response, so you can use it in the routes that you want intercept.
This function return an express middleware used to intercept response. It accept a function "fn" as a param.
The function "fn" defined as "fn(content,contentType,request,callback)" is the function that should be executed 
and called by responseinterceptor when the response is intercepted.

"fn" function is defined as bellow
fn(content,contentType,request,callback):
*   content     : contains the content of the intercepted response.
*   contentType : a string that describe the contentType in content. For example "application/json" , "text/html" , "text/css" ...
*   request     : An object containing the original "req" express request
*   callback    : The callback function to call when function ends, with the new response content as a parameter.
                  callback function is described as : callback(newContent).
                  newContent: The new content to send to the client. The newContent type could be String, Object, html, text ..... 
            
Here an example of intercept middleware function:
```javascript
var express = require('express');
var app = express.();
var responseinterceptor = require('responseinterceptor');  

// ############ BEGIN of routes to intercept ########################
    app.use(responseinterceptor.intercept(function(content, contentType ,request, callback){
       // Your Logic
       // NewResponse=".... new Content ....";
        callback(NewResponse); // callback function with the new content
    }));
```
### <a name="interceptOnFly"></a>`interceptOnFly(req,res,fn)`
This function don't return an express middleware and must be used internally in the endpoint logic to intercept response
for example if you need to intercept response only if a particular condition in the endpoint logic is satisfied . 
It accept three params req, res, fn.
The function "fn" defined as "fn(content,contentType,request,callback)" is the function that should be executed 
and called by responseinterceptor when the response is intercepted.

"interceptOnFly" function is defined as bellow:
interceptOnFly(req,res,fn):
*   req  : An object containing the original "req" express request
*   res  : An object containing the original "res" express response to intercept
*   fn   : The function "fn" defined as "fn(content,contentType,request,callback)" is the function that should be executed 
           and called by responseinterceptor when the response is intercepted.
           "fn" function is defined as fn(content,contentType,request,callback):             
       *   content     : contains the content of the intercepted response.
       *   contentType : a string that describe the contentType in content. For example "application/json" , "text/html" , "text/css" ...
       *   request     : An object containing the original "req" express request
       *   callback    : The callback function to call when function ends, with the new response content as a parameter.
                             callback function is described as : callback(newContent).
                             newContent: The new content to send to the client. The newContent type could be String, Object, html, text ..... 
      
Here an example of interceptOnFly function:
```javascript
var express = require('express');
var app = express.();
var responseinterceptor = require('responseinterceptor');  

app.get("/resource",function(req,res,next){
    // your logic ...
    var intercept= your_Logic ? true : false;
    if(intercept){
        responseinterceptor.interceptOnFly(req,res,function(content, contentType ,request, callback){
               // Your Logic
               // NewResponse=".... new Content ....";
                callback(NewResponse); // callback function with the new content
            })
    }
    
    res.send("Your Interceptable Content");
});
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


Intercept a group of routes and replace all html tag `<ul>` to `<ol>` 
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
    router.get("/withOLTag", function(req,res,n ext){
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
$ curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X GET http://hostname/intercept/withOLTag
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
