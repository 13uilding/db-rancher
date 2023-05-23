const yaml = require('js-yaml');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyparser = require('body-parser');

const JSON_PATH = './json/';
const YAML_PATH = './yaml-files';
const RANCHER_STARTING_POINT = './yaml-files/rancher-starting-point.yaml';
const CREATE_NAMESPACE = './yaml-files/create-namespace.yaml';

function loadYamlFileConvertToJson(yamlFile, jsonFilename) {
   try {
      const doc = yaml.load(fs.readFileSync(CREATE_NAMESPACE, 'utf8'));
      console.log(Object.keys(doc));
      writeToJson(JSON.stringify(doc), 'create-namespace.json');
   } catch (e) {
      console.log(e);
   }
}
function writeToJson(doc, filename) {
   try {
      fs.writeFileSync(JSON_PATH + filename, doc, 'utf-8');
   } catch (e) {
      console.log(e);
   }
}
function syntaxHighlight(json) {
   if (typeof json != 'string') {
      json = JSON.stringify(json, null, 2);
   }
   json = json.replace(/\\n/g, '\n\t') //.replace(/</g, '&lt;').replace(/>/g, '&gt;');
   return json;
}
const yamlProcess = function (req) {
   try {
      let doc = yaml.load(req.body);
      console.log(doc);
      return doc
   } catch (e) {
      let response = {
         name: e.name,
         reasons: e.reason,
         line: e.mark.line,
         column: e.mark.column,
         snippet: e.mark.snippet
      }
      return response;
   }
}
const requestTime = function (req, res, next) {
   req.requestTime = Date.now()
   next()
}
const applicationTypeProcessor = function (req, res, next) {
   let applicationType = '';
   switch (req.headers['content-type']) {
      case 'application/x-yaml':
         applicationType = 'yaml';
         req.yaml = yamlProcess(req);
         break;
      case 'application/json':
      default:
         applicationType = 'json';
         // req.json = jsonProcess(req);
         res.send('Currently this endpoint only handles requests where HTTP Header has \nContent-Type: application/x-yaml');
   }
   console.log(`Processing ${applicationType} request`);
   next();
}

// Express
app.use(requestTime);
app.use(bodyparser.raw({ type: 'application/x-yaml' }));
app.use(applicationTypeProcessor);

app.get('/', (req, res) => {
   let responseText = 'Hello World!<br>'
   responseText += `<small>Requested at: ${req.requestTime}</small>`
   res.send(responseText)
})
app.post('/writejsonfile/:filename', function (req, res) {
   console.log(req.params.filename);
   // console.log(req.body);
   let jsonResponse = syntaxHighlight(req.yaml);
   res.send(jsonResponse);
})
app.post('/tojson', function (req, res) {
   // console.log(req.body);
   let jsonResponse = syntaxHighlight(req.yaml);
   res.send(jsonResponse);
})

app.listen(3000);

// token-thdng:88dmzfv4dt9f78dz7fxf85g2s554dwfxpd86p6s6ds5dlf8hvfn65g
/*
request url: https://172.22.235.83/v1/namespaces
Content-Encoding: gzip
Content-Type: application/json
*/
// Get document, or throw exception on error