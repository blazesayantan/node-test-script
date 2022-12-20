const yaml = require("js-yaml");
const fs = require("fs");
var path = require("path");
var cheerio = require("cheerio");

let ansObj = [];
let isComplete = false;

function convertToJson(doc, length) {
  doc.map((item) => {
    let obj = { title: `item.level${length}_name`, url: item.link };
    ansObj.push(obj);
    if (item.subpages) {
      convertToJson(item.subpages, length + 1);
    } else {
      return;
    }
  });
}

try {
  var filename = path.join(__dirname, "test.yml");
  const doc = yaml.load(fs.readFileSync(filename, "utf8"));
  let length = 1;
  convertToJson(doc, length);
  console.log(ansObj, "answer object");
  var folderName = path.join(__dirname, "html");
  readFile(folderName, ansObj).then(function (results) {
    console.log(results, "results");
    return writeFile(results);
  });
} catch (e) {
  console.log(e);
}

function inspectFile(data, file) {
  console.log(file, "file");
  const htmlString = Buffer.from(data).toString();
  var $ = cheerio.load(htmlString);
  let headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
  headingTags.map((item) => {
    $(item)
      .contents()
      .map(function () {
        const idValue = $(this).parent(item).attr("id");
        const obj = {
          title: this.type === "text" ? $(this).text() + "" : "",
          url: `/${file}#${idValue}`,
        };
        ansObj.push(obj);
      });
  });
  isComplete = true;
  console.log(ansObj, "ansobj from inspect");
  return ansObj;
}

async function readFileAsyncWay(htmlFile, file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(htmlFile, function (err, data) {
      inspectFile(data, file);
      if (err) reject(err);
      else resolve(ansObj);
    });
  });
}

async function readFiles(files) {
  return new Promise(async function (resolve, reject) {
    const ans = await files
      .filter(function (file) {
        return file.substr(-5) === ".html";
      })
      .map(async (file) => {
        let htmlFile = path.join(__dirname, `html/${file}`);
        readFileAsyncWay(htmlFile, file).then((re) => {
          console.log(re, "re");
          return re;
        });
      });
    if(ans) resolve(ans);
  });
}

async function readFile(folderName, ansObj) {
  return new Promise(function (resolve, reject) {
    fs.readdir(folderName, async function (err, files) {
      const ans = await readFiles(files)
      console.log(ans, "answer")
      if (err) {
        reject(err);
      } else {
        resolve(ans);
        console.log(ansObj, "ansobj from readfile");
      }
    });
  });
}

async function writeFile(results) {
  return new Promise(function (resolve, reject) {
    console.log(ansObj, "ansobj from write");
    let writeFile = path.join(__dirname);
    var jsonFile = JSON.stringify(results);
    let jsonParse = JSON.parse(jsonFile);
    fs.writeFile(
      `${writeFile}/search.json`,
      JSON.stringify(jsonParse),
      function (err) {
        if (err) throw err;
        console.log("complete");
      }
    );
  });
}
