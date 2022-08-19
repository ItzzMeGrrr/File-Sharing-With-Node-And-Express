import express from 'express';
import fs, { readFileSync } from 'fs';
import multer from 'multer';
import path from 'path';
import os from 'os';

const app = express();
const port = 3000;
let filesPath;

if (process.argv.length < 3) {
    filesPath = process.cwd();
}
else {
    filesPath = process.argv[2];
}


const getFileSizeSuffix = (size) => {
    if (size == 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
const getFileInfoFromFolder = (route) => {
    const files = fs.readdirSync(route, 'utf8');
    const response = [];
    for (let file of files) {
        if (!fs.lstatSync(path.join(route, file)).isDirectory()) {
            const fileSizeInBytes = fs.statSync(route + "/" + file).size;
            response.push({ name: file, size: getFileSizeSuffix(fileSizeInBytes), type: 'file' });
        }
    }
    return response;
}
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof args[index] == 'undefined' ? match : args[index];
    });
};

const listToHtml = (list) => {
    let html = '';
    list.forEach((item) => {
        html += `
        <ul class="list-group ">
        <li class='list-group-item mw-100'>📄 <a href='/get/${item.name}'>
        ${item.name}
        </a><span class='float-end'>Size: ${item.size}</span></li>
        </ul>
        `;
    });
    return html;
}
const getNetworkInterfaces = () => {
    const list = [];
    const ilist = [];
    const interfaces = os.networkInterfaces();
    for (let iface in interfaces) {
        for (let i in interfaces[iface]) {
            const f = interfaces[iface][i];
            if (f.internal) {
                ilist.push({ f, iface });
            } else {
                list.push({ f, iface });
            }
        }
    }
    return list.length > 0 ? list : ilist;
}
app.use('/static', express.static('static'));
const upload = multer({ dest: './received' })
app.get('/', (req, res) => {
    let files = getFileInfoFromFolder(filesPath);
    let template = readFileSync('./template.html');
    let html = template.toString().format(listToHtml(files));
    res.send(html);
});
app.get('/get/:file', (req, res) => {
    console.log(`sending ${req.params.file}`);
    let file = req.params.file;
    let data = fs.readFileSync(file);
    res.send(data);
});
app.post('/upload', upload.array('uploaded_file'), (req, res, next) => {
    console.log(`Received ${req.files.length} files`);
    try {
        for (let file of req.files) {
            fs.renameSync(file.path, path.join("./received", file.originalname));
            console.log(`Received ${file.originalname} successfully`);
        }
        res.send(`
        <html><head>
        <title>Transfer Files with Itzzmegrrr</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="./static/bootstrap.min.css">
        </head>
        <body class='container mt-4'>
        <div class="alert alert-success" role="alert">
        Files sent successfully!
        </div>
        <script src="./static/bootstrap.bundle.min.js" type="text/js"></script>
        </body></html>
        `);
    }
    catch (err) {
        res.send(`
        <html><head>
        <title>Transfer Files with Itzzmegrrr</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="./static/bootstrap.min.css">
        </head>
        <body class='container mt-4'>
        <div class="alert alert-danger" role="alert">
        Files not sent!
        ${err}
        </div>
        <script src="./static/bootstrap.bundle.min.js" type="text/js"></script>
        </body></html>
        `);
    }
});
app.listen(port, () => {
    console.log(`App listening at \n+ http://localhost:${port}`);
    for (let iface of getNetworkInterfaces()) {
        console.log(`+ http://${iface.f.address}:${port}`);
    }
});

process.on('SIGINT', () => {
    if (true) {
        console.info('Exiting...');
        process.exit();
    }
});