const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
app.use(express.json());
var jwt = require('jsonwebtoken');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'Data';
const client = new MongoClient(url);

class Usuario {
    constructor(nombre, apellido, userID, usuario, contrasenia, puntos) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.userID = userID;
        this.usuario = usuario;
        this.contrasenia = contrasenia;
        this.puntos = puntos;
    }
    /*  get nombre() {
         return this.nombre;
     }
     set nombre(nombre) {
         this.nombre = nombre;
     }
     get apellido() {
         return this.apellido;
     }
     get userID() {
         return this.userID;
     }
     get usuario() {
         return this.usuario;
     }
     get contrasenia() {
         return this.contrasenia;
     }
     get puntos() {
         return this.puntos;
     } */
}

class Envio {
    constructor(id, userID, productoID, estado) {
        this.id = id;
        this.userID = userID;
        this.productoID = productoID;
        this.estado = estado;
    }
}

class Producto {
    constructor(id, nombre, descripcion, categoria, costo) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.costo = costo;
    }
}

/* class Estado {
    constructor(id, userID, productoID, estado) {
      this.id = id;
      this.userID = userID;
      this.productoID = productoID;
      this.estado = estado;
    }
} */

client.connect(function (err) {
    if (err) {
        console.log('ERROR connecting to server');
    }
    else {
        console.log('Connected successfully to server');
    }
    //client.close();
});


app.get('/', async function (req, res) {
    res.send(await token('matias'))
    /* const db = client.db(dbName);
    let collection = db.collection('data');
    // Find some documents
    collection.find({}).toArray(function (err, docs) {
        console.log(docs);
        let user = new Usuario(docs[0].test, docs[0].test)
        console.log(user)
    }); */
})

/* app.get('/usuario/puntos', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('data');
    let username = req.headers.username
    let password = req.headers.password
    if (validarUser(username, password)) {
        res.send(`Error Falta Usuario o Contraseña`)
    }
    else {
        collection.find({ 'usuario': username, 'contrasenia': password }).toArray(function (err, docs) {
            console.log(docs);
            if (docs[0]) {
                res.send(`Puntos: ${docs[0].puntos}`)
            } else {
                res.send('Error al obtener el usuario')
            }
        });
    }
}) */
app.get('/usuario/puntos', async function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('data');
    let username = req.headers.username
    let token = req.headers.token
    if (await validarToken(token) != true && username) {
        res.status(400).send(`Error Falta Usuario o Token`)
    }
    else {
        collection.find({ 'usuario': username}).toArray(function (err, docs) {
            console.log(docs);
            if (docs[0]) {
                res.status(200).send(`Puntos: ${docs[0].puntos}`)
            } else {
                res.status(404).send('Error al obtener el usuario')
            }
        });
    }
})

app.get('/login', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('usuarios');
    let username = req.headers.username
    let password = req.headers.password
    if (validarUser(username, password)) {
        res.status(400).send(`Error Falta Usuario o Contraseña`)
    }
    else {
        collection.find({ 'usuario': username, 'contrasenia': password }).toArray(async function (err, docs) {
            console.log(docs);
            if (docs[0]) {
                res.status(200).send(`Token: ${await token(docs[0].usuario)}`)
            } else {
                res.status(404).send('Error al obtener el usuario')
            }
        });
    }
})

function validarUser(username, password) {
    if (username != undefined && password != undefined) {
        return false
    } else {
        return true
    }
}

app.post('/usuario', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('usuarios');
    collection.insertOne(req.body).toArray(function (err, docs) {
        console.log(docs);
        res.status(200).send(`Puntos`)
    });
})

app.post('/producto', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('productos');
    collection.insertOne(req.body).toArray(function (err, docs) {
        console.log(docs);
        res.status(200).send(`Ok`);
    });
})


app.post('/canjear', async function (req, res) {
    const db = client.db(dbName);
    let collectionp = db.collection('productos');
    let username = req.headers.username
    let password = req.headers.password
    let productoID = req.body.productoID
    let token = req.headers.token
    if(await validarToken(token) != true && validarUser(username, password)){
        res.status(400).send(`Error Falta Token o Usuario/Contraseña`)
    }else{
    collectionp.find({ 'id': productoID }).toArray(function (err, docs) {
        if (err) {
            return res.status(500).send("ERROR INTERNO")
        }
        console.log(docs);
        let producto = new Producto(docs[0].id, docs[0].nombre, docs[0].descripcion, docs[0].categoria, docs[0].costo)
        collection = db.collection('usuarios');
        collection.find({ 'usuario': username, 'contrasenia': password }).toArray(function (err, user) {
            console.log(user)
            let usuario = new Usuario(user[0].nombre, user[0].apellido, user[0].userID, user[0].usuario, user[0].contrasenia, user[0].puntos)
            if (usuario.puntos >= producto.costo) {
                res.status(200).send("producto canjeado")
                let envio = new Envio(1, usuario.userID, productoID, 'en autorizacion')
                puntos = user[0].puntos - producto.costo
                collection.updateOne({ 'userID': user[0].userID }, { $set: { 'puntos': puntos } })
            } else {
                res.status(200).send("Puntos insuficientes")
            }
        });
    });
    }
})

app.get('/productos', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('productos');
    collection.find({}).toArray(function (err, docs) {
        console.log(docs);
        res.status(200).send(`Productos: ${JSON.stringify(docs)}`)
    });
})


function token(usuario) {
    return new Promise(function (resolve, reject) {
        jwt.sign({
            data: usuario
        }, 'secret', function (err, token) {
            if (err) {
                reject('error')
            }
            console.log("Token: " + token)
            resolve(token)
        })
    })
}

function validarToken(token) {
    return new Promise(function (resolve, reject) {
        jwt.verify(token, 'secret', function (err, decoded) {
            if (err) {
                resolve(false)
            }
            console.log("Decoded: " + decoded)
            if (decoded != undefined){
                resolve(true)
            }
            else{
                resolve(false)
            }
        })
    })
}

app.listen(3000)