# microapi

API REST de cadastro de usuários em Node.js, com MongoDB, empacotada em Docker,
mais um frontend simples que consome a API.

O projeto é um CRUD completo: criar, listar, buscar, atualizar e remover
usuários, com validação, tratamento de erros padronizado e uma interface web
para operar tudo pelo navegador.

## Tecnologias

- Node.js 22 e Express 5
- MongoDB 7 com Mongoose 8
- Docker e Docker Compose
- Frontend em HTML, CSS e JavaScript puro, servido por nginx

## Estrutura

```
microapi/
├── backend-app/
│   ├── src/
│   │   ├── config/banco.js          conexão com o MongoDB
│   │   ├── modelos/usuario.js       schema do Mongoose
│   │   ├── controladores/usuarios.js regras de cada rota
│   │   ├── rotas/usuarios.js        definição das rotas REST
│   │   ├── app.js                   configuração do Express
│   │   └── servidor.js              ponto de entrada
│   ├── Dockerfile
│   └── package.json
├── frontend-app/
│   ├── index.html
│   ├── estilos.css
│   ├── app.js                       consumo da API
│   ├── nginx.conf                   proxy de /api para o backend
│   └── Dockerfile
├── docker-compose.yml               mongo + backend + frontend
└── .env.example
```

## Como rodar com Docker

Requisito: Docker com Compose.

```bash
git clone https://github.com/HenryTito/microapi.git
cd microapi
docker compose up -d --build
```

Isso sobe três containers: banco, API e interface.

| Serviço  | Endereço              |
| -------- | --------------------- |
| Frontend | http://localhost:8080 |
| API      | http://localhost:8888 |
| MongoDB  | localhost:27017       |

Comandos do dia a dia:

```bash
docker compose logs -f backend   # acompanhar os logs da API
docker compose ps                # ver o estado dos containers
docker compose down              # parar tudo, mantendo os dados
docker compose down -v           # parar e apagar o banco
```

Os dados ficam no volume `mongo-dados`, então sobrevivem a um `down` comum.

## Como rodar sem Docker

É preciso ter Node.js 20 ou superior e um MongoDB acessível.

```bash
cd backend-app
cp .env.example .env    # ajuste MONGO_URI se necessário
npm install
npm run dev             # http://localhost:8888
```

O frontend é estático, basta servi-lo em qualquer servidor HTTP:

```bash
cd frontend-app
npx serve -l 5173 .     # http://localhost:5173
```

Na porta 5173 o `app.js` chama `http://localhost:8888` diretamente, e o CORS já
está liberado na API. Dentro do Docker ele usa o caminho `/api`, que o nginx
encaminha para o backend, evitando CORS no navegador.

## Usando um MongoDB externo (Atlas)

Por padrão o compose usa o container `mongo`. Para apontar a API a um cluster no
MongoDB Atlas, crie um arquivo `.env` na raiz do projeto. Ele não é versionado:

```bash
cp .env.example .env
```

```
MONGO_URI=mongodb+srv://USUARIO:SENHA@SEU-CLUSTER.xxxxx.mongodb.net/microapi?retryWrites=true&w=majority
```

Depois, `docker compose up -d backend`. O log deve mostrar `Conectado ao MongoDB`.

Pontos de atenção:

- Nunca escreva a URI com senha direto no `docker-compose.yml`, ela iria para o Git.
- Senhas com caracteres especiais (`@`, `#`, `/`, `:`) precisam de percent-encoding.
- No Atlas, libere seu IP em Network Access. Sem isso a conexão falha por timeout.
- O erro `bad auth : authentication failed` significa que o cluster respondeu e o
  problema é o usuário ou a senha, não a rede.

## API

Base: `http://localhost:8888`

| Método | Rota            | Descrição                             |
| ------ | --------------- | ------------------------------------- |
| GET    | `/`             | Dados da API                          |
| GET    | `/health`       | Verificação de saúde                  |
| GET    | `/usuarios`     | Lista os usuários, mais recentes antes |
| GET    | `/usuarios/:id` | Busca um usuário pelo id              |
| POST   | `/usuarios`     | Cria um usuário                       |
| PUT    | `/usuarios/:id` | Atualiza um usuário, parcialmente     |
| DELETE | `/usuarios/:id` | Remove um usuário                     |

### Modelo Usuário

| Campo   | Tipo   | Obrigatório | Observação                    |
| ------- | ------ | ----------- | ----------------------------- |
| `nome`  | String | sim         |                               |
| `email` | String | sim         | único, precisa ter formato válido |
| `foto`  | String | não         | URL de uma imagem             |

O Mongoose acrescenta `_id`, `createdAt` e `updatedAt` a cada documento.

### Exemplos

```bash
# criar
curl -X POST http://localhost:8888/usuarios \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Maria Silva","email":"maria@exemplo.com","foto":"https://i.pravatar.cc/80"}'

# listar
curl http://localhost:8888/usuarios

# buscar um
curl http://localhost:8888/usuarios/<id>

# atualizar, apenas os campos enviados mudam
curl -X PUT http://localhost:8888/usuarios/<id> \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Maria S. Souza"}'

# remover
curl -X DELETE http://localhost:8888/usuarios/<id>
```

### Erros

As respostas de erro sempre vêm em JSON, no formato `{ "erro": "mensagem" }`.

| Código | Quando acontece                                  |
| ------ | ------------------------------------------------ |
| 400    | ID inválido, JSON malformado ou falha de validação |
| 404    | Usuário inexistente ou rota desconhecida         |
| 409    | Já existe um usuário com aquele e-mail           |
| 500    | Erro interno do servidor                         |

## Variáveis de ambiente

Backend:

| Variável    | Padrão                               | Descrição              |
| ----------- | ------------------------------------ | ---------------------- |
| `PORT`      | `8888`                               | Porta da API           |
| `MONGO_URI` | `mongodb://localhost:27017/microapi` | Conexão com o MongoDB  |

No compose, `MONGO_URI` vem do `.env` da raiz e, se ele não existir, usa
`mongodb://mongo:27017/microapi`, o container local. Assim o projeto roda logo
após o clone, sem configuração nenhuma.

## Detalhes de implementação

- A conexão com o banco tenta reconectar dez vezes, com três segundos de
  intervalo. Em Docker o MongoDB costuma aceitar conexões alguns segundos depois
  da API subir, e o compose ainda aguarda o healthcheck do banco.
- O e-mail tem índice único no MongoDB. É esse índice que produz o 409.
- O `PUT` é parcial: apenas os campos presentes no corpo da requisição sao
  alterados, os demais ficam como estavam.
- IDs são validados antes de chegar ao banco, o que evita um erro de cast e
  devolve um 400 mais claro.
- O frontend monta os elementos da lista via DOM, sem `innerHTML`, para não
  interpretar como HTML o conteúdo vindo do banco.
