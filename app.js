const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.Category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.Category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.Category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND 
            status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND 
            priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%' 
            AND priority = '${priority}'
            AND status = '${status}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%' 
            AND category = '${category}'
            AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND 
            category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%' 
            AND category = '${category}'
            AND priority = '${priority}';`;
      break;
    default:
      getTodosQuery = `
      SELECT * FROM
      todo 
      WHERE 
      todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM 
    todo 
    WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});
