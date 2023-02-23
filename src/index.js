"use strict";
process.on('uncaughtException', function (err) {
    console.error('[uncaughtException]', err);
    // process.exit(0);
});
process.setMaxListeners(0);
require('events').EventEmitter.defaultMaxListeners = 0;

require('dotenv').config({path: '.env'});
const merkle = require("@openzeppelin/merkle-tree");
const fs = require('fs')
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const magenta = function () {
    console.log(chalk.magenta(...arguments))
};
const cyan = function () {
    console.log(chalk.cyan(...arguments))
};
const yellow = function () {
    console.log(chalk.yellow(...arguments))
};
const red = function () {
    console.log(chalk.red(...arguments))
};
const blue = function () {
    console.log(chalk.blue(...arguments))
};
const green = function () {
    console.log(chalk.green(...arguments))
};

const express = require('express')
const app = express()
const cors = require('cors');

// CORS
app.use(cors());
app.set('trust proxy', 1); // trust first proxy
app.set('json spaces', 40);
app.set('view engine', 'ejs');
let MerkleTreeData;
app.get('/proof/:wallet', function(req, res){
    const wallet = req.params.wallet.toLowerCase();
    console.log(`checking wallet ${wallet}`)

    for (const [i, v] of MerkleTreeData.entries()) {
        if (v[0].toLowerCase() === wallet) {
            const proof = MerkleTreeData.getProof(i);
            console.log(i, v[1]);
            return res.json({value: v[1], proof: proof});
        }
    }
    return res.json({});
});

app.listen(process.env.HTTP_PORT, () => {
    console.log(`http://127.0.0.1:${process.env.HTTP_PORT}`);
    const file = "./public_html/airdrop-merkletree.json";
    MerkleTreeData = merkle.StandardMerkleTree.load(JSON.parse(fs.readFileSync(file)));
    console.log(`root: ${MerkleTreeData.root}`);
})
app.use(express.static('./public_html'));
