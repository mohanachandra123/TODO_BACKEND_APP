const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

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

const snakeCaseToCamelCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, date } = request.query;
  const onlyStatus =
    status !== undefined && priority === undefined && category === undefined;
  const onlyPriority =
    status === undefined && priority !== undefined && category === undefined;
  const onlyCategory =
    status === undefined && priority === undefined && category !== undefined;

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

  switch (true) {
    case onlyStatus:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getStatusQuery = `
              SELECT * FROM todo WHERE status = '${status}';`;
        const result = await db.all(getStatusQuery);
        response.send(snakeCaseToCamelCase(result));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case onlyPriority:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getPriorityQuery = `
              SELECT * FROM todo WHERE priority = '${priority}';`;
        const result = await db.all(getPriorityQuery);
        response.send(snakeCaseToCamelCase(result));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case onlyCategory:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getCategoryQuery = `
              SELECT * FROM todo WHERE category = '${category}';`;
        const result = await db.all(getCategoryQuery);
        response.send(snakeCaseToCamelCase(data));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(snakeCaseToCamelCase(data));
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM 
    todo 
    WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(snakeCaseToCamelCase(todo));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 12, 12), "yyyy-MM-dd");
  const getDateQuery = `SELECT * FROM todo WHERE due_date = ${date};`;
  const result = await db.all(getDateQuery);
  response.send(snakeCaseToCamelCase(result));
});

// API 4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const addTodoQuery = `
    INSERT INTO 
    todo (todo, priority, status, category, due_date)
    VALUES 
    ('${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;

  const result = await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
    SELECT * 
    FROM todo
    WHERE 
    id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo 
    SET 
    todo = '${todo}',
    status = '${status}',
    priority = '${priority}',
    category = '${category}',
    due_date = '${due_date}'
    WHERE 
    id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
    todo WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
