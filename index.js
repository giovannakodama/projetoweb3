const express = require("express")
const fs = require("fs")
const app = express()
const port = 80

const expressJwt = require("express-jwt")
const jwt = require("jsonwebtoken")
const jwtSecret = "he2Y39072y3n90ye790E79H"

const cookieSession = require("cookie-session")
const multer = require("multer")
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e5)
    cb(null, uniqueFilename)
  },
  destination: "uploads/",
})
const upload = multer({ storage })

fs.rmdirSync("uploads/", { recursive: true, force: true })
fs.mkdirSync("uploads/")

const database = {
  usuarios: [],
  posts: [],
}

app.use(
  cookieSession({
    name: "session",
    keys: ["views"],
  })
)

app.use(
  express.urlencoded({
    extended: true,
  })
)

app.use(express.json())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-Width, Content-Type, Accept, Authorization"
  )
  next()
})

app.post("/login", (req, res) => {
  const foundUser = database.usuarios.find(
    (user) => user.email === req.body.email
  )
  if (!foundUser) res.status(404).send("Usuário não encontrado!")
  else if (foundUser.senha === req.body.senha) {
    const token = jwt.sign(
      {
        email: foundUser.email,
      },
      jwtSecret
    )
    req.session.token = token
    res.send({
      token,
    })
  } else {
    res.status(401).send("Senha incorreta!")
  }
})

app.post("/register", (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha)
    res.status(400).send("Os campos de email e senha devem ser preenchidos!")
  else {
    const foundEmail = database.usuarios.find((user) => user.email === email)
    if (!!foundEmail) res.status(400).send("Email em uso!")
    else {
      database.usuarios.push({
        email,
        senha,
      })
      res.sendStatus(200)
    }
  }
})

app.post(
  "/newPost",
  upload.array("files", 10),
  expressJwt({ secret: jwtSecret, algorithms: ["HS256"] }),
  (req, res) => {
    const { titulo, descricao } = req.body
    if (!titulo || !descricao) {
      req.files.forEach((file) => {
        fs.rmSync(file.destination + file.filename)
      })
      return res
        .status(400)
        .send("É necessário que uma publicação possua título e descrição!")
    }
    const newPost = {
      email: req.user.email,
      titulo,
      descricao,
      arquivos: req.files,
    }
    database.posts.push(newPost)
    res.send(newPost)
  }
)

app.get(
  "/post",
  expressJwt({ secret: jwtSecret, algorithms: ["HS256"] }),
  (req, res) => {
    const { titulo, email } = req.query
    if (!titulo && !email) res.send(database.posts)
    else if (!titulo)
      res.send(database.posts.filter((post) => post.email === email))
    else res.send(database.posts.filter((post) => post.titulo.includes(titulo)))
  }
)

app.get("/image/:name", (req, res) => {
  const img = fs.readFileSync(`./uploads/${req.params.name}`)
  res.writeHead(200, { "Content-Type": "image" })
  res.end(img, "binary")
})

app.get("/file/:name", (req, res) => {
  res.download(
    `C:/Users/TiagoHasuda/Documents/UTFPR/Programação para Web/Projeto 3/Server/uploads/${req.params.name}`
  )
})

app.listen(port, () => {
  console.log(`Server rodando na porta ${port}...`)
})
