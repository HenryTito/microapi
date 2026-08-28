# microapi

CRUD de usuários com **Node.js + Express + MongoDB**, empacotado com **Docker Compose**, e um frontend simples em HTML/CSS/JS puro que consome a API.

```
microapi/
├── backend-app/        API REST (Express + Mongoose)
├── frontend-app/       Interface estática servida por nginx
└── docker-compose.yml  mongo + backend + frontend
```

## Subindo com Docker (recomendado)

```bash
docker compose up -d --build
```

| Serviço  | URL                     |
| -------- | ----------------------- |
| Frontend | http://localhost:8080   |
| API      | http://localhost:8888   |
| MongoDB  | localhost:27017         |

Para parar: `docker compose down` (use `docker compose down -v` para apagar também os dados do Mongo).

## Usando um MongoDB externo (Atlas)

Por padrão o compose usa o container `mongo`. Para apontar a API a um cluster no
MongoDB Atlas, crie um arquivo `.env` na raiz (ele **não** é versionado):

```bash
cp .env.example .env
```

```
MONGO_URI=mongodb+srv://USUARIO:SENHA@SEU-CLUSTER.xxxxx.mongodb.net/microapi?retryWrites=true&w=majority
```

E suba de novo: `docker compose up -d backend`. O log deve mostrar
`Conectado ao MongoDB`.

Nunca coloque a URI com senha direto no `docker-compose.yml` — ela iria para o
Git. Se a senha tiver caracteres especiais (`@`, `#`, `/`, `:`), use
percent-encoding. No Atlas, lembre-se de liberar seu IP em **Network Access**;
sem isso a conexão falha por timeout. Já um erro `bad auth : authentication
failed` significa que o cluster respondeu e o usuário/senha é que foi recusado.

## Rodando sem Docker

É preciso ter um MongoDB acessível.

```bash
cd backend-app
cp .env.example .env      # ajuste MONGO_URI se necessário
npm install
npm run dev               # http://localhost:8888
```

O frontend é estático — basta servi-lo em qualquer servidor HTTP:

```bash
cd frontend-app
npx serve -l 5173 .       # http://localhost:5173
```

Na porta 5173 o `app.js` aponta direto para `http://localhost:8888` (o CORS já está liberado na API). Dentro do Docker ele usa `/api`, que o nginx encaminha para o backend.

## API

Base: `http://localhost:8888`

| Método | Rota             | Descrição                  |
| ------ | ---------------- | -------------------------- |
| GET    | `/health`        | Verificação de saúde       |
| GET    | `/usuarios`      | Lista todos os usuários    |
| GET    | `/usuarios/:id`  | Busca um usuário           |
| POST   | `/usuarios`      | Cria um usuário            |
| PUT    | `/usuarios/:id`  | Atualiza (parcial) usuário |
| DELETE | `/usuarios/:id`  | Remove um usuário          |

### Modelo `Usuario`

| Campo   | Tipo   | Obrigatório | Observação            |
| ------- | ------ | ----------- | --------------------- |
| `nome`  | String | sim         |                       |
| `email` | String | sim         | único, formato válido |
| `foto`  | String | não         | URL da imagem         |

Documentos também trazem `_id`, `createdAt` e `updatedAt`.

### Exemplos

```bash
# criar
curl -X POST http://localhost:8888/usuarios \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Maria Silva","email":"maria@exemplo.com","foto":"https://i.pravatar.cc/80"}'

# listar
curl http://localhost:8888/usuarios

# atualizar (só os campos enviados são alterados)
curl -X PUT http://localhost:8888/usuarios/<id> \
  -H 'Content-Type: application/json' -d '{"nome":"Maria S. Souza"}'

# remover
curl -X DELETE http://localhost:8888/usuarios/<id>
```

### Erros

Sempre em JSON no formato `{ "erro": "mensagem" }`.

| Código | Quando                                    |
| ------ | ----------------------------------------- |
| 400    | ID inválido, JSON malformado, validação   |
| 404    | Usuário ou rota não encontrada            |
| 409    | E-mail já cadastrado                      |
| 500    | Erro interno                              |

## Variáveis de ambiente (backend)

| Variável    | Padrão                              |
| ----------- | ----------------------------------- |
| `PORT`      | `8888`                              |
| `MONGO_URI` | `mongodb://localhost:27017/microapi` |

No compose, `MONGO_URI` vem do `.env` da raiz e, se ele não existir, cai em
`mongodb://mongo:27017/microapi` (o container local).
