/* @flow */

import express from 'express';

import config from './webpack.config.js';
const compiler = require('webpack')(config);

let app = express();

app.use(express.static('public'));
app.use('/build', express.static('build'));

app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || '0.0.0.0');

app.get('/api/board', (req, res) => {
  res.sendFile(`${__dirname}/derpy.map`);
});
 
app.listen(app.get('port'), app.get('host'));
