import express from 'express';
import fs, { readFileSync } from 'fs';
import path from 'path';

const app = express();
const port = 3000;

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
        //check if file is directory
        if (!fs.lstatSync(path.join(route, file)).isDirectory()) {
            const fileSizeInBytes = fs.statSync(file).size;
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
app.get('/get/:file', (req, res) => {
    let file = req.params.file;
    let data = fs.readFileSync(file);
    res.send(data);
});

app.use('/static', express.static('static'));

app.get('/', (req, res) => {
    let files = getFileInfoFromFolder('.');
    let template = readFileSync('./template.html');
    let html = template.toString().format(listToHtml(files));
    res.send(html);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});