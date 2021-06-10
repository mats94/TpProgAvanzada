const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var jwt = require('jsonwebtoken');
app.use(express.json());
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

// Use connect method to connect to the server
client.connect(function(err) {
  assert.equal(null, err);
  console.log('Connected successfully to server');
  //client.close();
});


app.get('/', function (req, res) {
  let token = getToken('matias')
  res.send(token)

  /* const db = client.db(dbName);
  let collection = db.collection('data');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    console.log(docs);
    let user = new Usuario(docs[0].test, docs[0].test)
    console.log(user)
  }); */
})

app.get('/usuario/puntos', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('data');
    let username = req.headers.username
    let password = req.headers.password
    collection.find({'usuario': username, 'contrasenia': password}).toArray(function(err, docs) {
      console.log(docs);
      res.send(`Puntos: ${docs[0].puntos}` )
    });
})

app.post('/usuario', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('usuarios');
    collection.insertOne(req.body).toArray(function(err, docs) {
        console.log(docs);
        res.send(`Puntos`)
    });
})

app.post('/producto', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('productos');
    collection.insertOne(req.body).toArray(function(err, docs) {
        console.log(docs);
        res.send(`Ok`);
    });
})


app.post('/canjear', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('productos');
    let username = req.headers.username
    let password = req.headers.password
    let productoID = req.body.productoID
    collection.find({'id': productoID}).toArray(function(err, docs) {
      console.log(docs);
      let producto = new Producto(docs[0].id, docs[0].nombre, docs[0].descripcion, docs[0].categoria, docs[0].costo )
      collection = db.collection('usuarios');
      collection.find({'usuario': username, 'contrasenia': password}).toArray(function(err, user) {
        console.log(user)
        let usuario = new Usuario(user[0].nombre, user[0].apellido, user[0].userID, user[0].usuario, user[0].contrasenia, user[0].puntos )
        if(usuario.puntos >= producto.costo){
            res.send("producto canjeado")
            let envio = new Envio(1 , usuario.userID, productoID, 'en autorizacion')
        }else{
            res.send("Puntos insuficientes")
        }
      });
    });
})

app.get('/productos', function (req, res) {
    const db = client.db(dbName);
    let collection = db.collection('productos');
    collection.find({}).toArray(function(err, docs) {
      console.log(docs);
      res.send(`Productos: ${JSON.stringify(docs)}` )
    });
})

async function getToken(usuario){
  await token(usuario)
}


function token(usuario){
  return new Promise(function(resolve, reject){
    jwt.sign({
      data: usuario
    }, 'secret', function (err, token){
      if (err) {
        reject('error')
      }
      console.log("Token: " + token)
      resolve(token)
    })
  })
}


app.listen(3000)