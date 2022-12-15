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
  fs.readdir(folderName, function (err, files) {
    files
      .filter(function (file) {
        return file.substr(-5) === ".html";
      })
      .forEach(function (file) {
        let htmlFile = path.join(__dirname, `html/${file}`);
        fs.readFile(htmlFile, function (err, data) {
          inspectFile(data, file);
        });
      });
  });
  let writeFile = path.join(__dirname);
  var jsonFile = JSON.stringify(ansObj);
  let jsonParse = JSON.parse(jsonFile);
  fs.writeFile(
    `${writeFile}/search.json`,
    JSON.stringify(jsonParse),
    function (err) {
      if (err) throw err;
      console.log("complete");
    }
  );
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
  console.log(ansObj, "ansobj");
}
