const express = require('express');
const path = require('path');
//const port = process.env.PORT || 8080;
const port = 4000;

const app = express();


    // app.use(express.static(__dirname, 'dist'));
    app.use(express.static(path.join(__dirname, 'dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist/index.html')); 
    });
    app.listen(port);