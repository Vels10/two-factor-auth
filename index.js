const express = require('express');
const speakeasy = require('speakeasy');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

const app = express();

const db = new JsonDB(new Config('myDatabase', true, false, '/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api', (req, res) => res.json({ message: 'Welcome '}));

app.post('/api/register', (req, res) => {
    const id = uuid.v4();

    try{
        const path = `/user/${id}`;
        const temp_secret = speakeasy.generateSecret();
        db.push(path, {id, temp_secret});
        res.json({ id, secret: temp_secret.base32});
    }
    catch{
        console.log(error);
        res.status(500).json({message: 'Error Generating In The Secret'});
    }
});

app.post('/api/verify', (req,res)=> {
    const { userId, token } = req.body;

    try{
        const path = `/user/${userId}`;
        const user =  db.getData(path);

        const {base32: secret} = user.temp_secret;

        const verified = speakeasy.totp.verify({
            secret,
            encoding : 'base32',
            token
        });

        if(verified) {
            db.push(path, {id: userId, secret: user.temp_secret});
            res.json({verified: true});
        }
        else{
            res.json({verified: false});
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: ' Error In Verification '});
    }
    
});

app.post('/api/validate', (req,res)=> {
    const { userId, token } = req.body;

    try{
        const path = `/user/${userId}`;
        const user =  db.getData(path);

        const {base32: secret} = user.secret;

        const tokenValidate = speakeasy.totp.verify({
            secret,
            encoding : 'base32',
            token,
            window: 1
        });

        if(tokenValidate) {
            res.json({validate: true});
        }
        else{
            res.json({validate: false});
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: ' Error In Validation '});
    }
    
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
