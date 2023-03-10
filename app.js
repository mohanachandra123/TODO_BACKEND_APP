const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isValid = require("date-fns/isValid");
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
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const validPriority = (priority) => {
  return priority === "HIGH" || priority === "MEDIUM" || priority === "LOW";
};
const validStatus = (status) => {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
};
const validCategory = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};
const checkDate = (dueDate) => {
  return !isValid(new Date(dueDate));
};

const correctDate = (dueDate) => {
  return isValid(new Date(dueDate));
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
  let validValues;
  const { search_q = "", priority, status, category, date } = request.query;
  const onlyStatus =
    status !== undefined && priority === undefined && category === undefined;
  const onlyPriority =
    status === undefined && priority !== undefined && category === undefined;
  const onlyCategory =
    status === undefined && priority === undefined && category !== undefined;

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        validValues = true;
        getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND 
            status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        validValues = true;
        getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND 
            priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndStatusProperties(request.query):
      if (
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") &&
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW")
      ) {
        validValues = true;
        getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%' 
            AND priority = '${priority}'
            AND status = '${status}';`;
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") &&
        (category === "WORK" || category === "HOME" || category === "LEARNING")
      ) {
        validValues = true;
        getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%' 
            AND category = '${category}'
            AND status = '${status}';`;
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        validValues = true;
        getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND 
            category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (
        (category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING") &&
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW")
      ) {
        validValues = true;
        getTodosQuery = `
            SELECT * 
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%' 
            AND category = '${category}'
            AND priority = '${priority}';`;
      }
      break;
    default:
      validValues = true;
      getTodosQuery = `
      SELECT * FROM
      todo 
      WHERE 
      todo LIKE '%${search_q}%';`;
  }
  if (validValues === true) {
    data = await db.all(getTodosQuery);
    const result = data.map((item) => snakeCaseToCamelCase(item));
    response.send(result);
  }
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
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const isValidDate = isValid(new Date(date));
    if (isValidDate) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const getQuery = `
          SELECT 
          id, todo, priority, status, category, due_date AS dueDate
          FROM todo
          WHERE due_date = '${formattedDate}';`;

      const todos = await db.all(getQuery);
      response.send(todos);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  switch (true) {
    case !validPriority(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case !validStatus(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case !validCategory(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case checkDate(dueDate):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const addTodoQuery = `
    INSERT INTO 
    todo (id,todo, priority, status, category, due_date)
    VALUES 
    (${id},'${todo}', '${priority}', '${status}', '${category}', '${formattedDate}');`;

      const result = await db.run(addTodoQuery);
      response.send("Todo Successfully Added");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let invalidColumn = "";
  let validValuesEntered;
  const requestBody = request.body;
  const { priority, status, category, dueDate } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (validStatus(status) === true) {
        updateColumn = "Status";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
        invalidColumn = "Todo Status";
      }
      break;
    case requestBody.priority !== undefined:
      if (validPriority(priority) === true) {
        updateColumn = "Priority";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
        invalidColumn = "Todo Priority";
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      validValuesEntered = true;
      break;
    case requestBody.category !== undefined:
      if (validCategory(category) === true) {
        updateColumn = "Category";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
        invalidColumn = "Todo Category";
      }
      break;
    case requestBody.dueDate !== undefined:
      if (correctDate(dueDate) === true) {
        updateColumn = "Due Date";
        validValuesEntered = true;
      } else {
        validValuesEntered = false;
        invalidColumn = "Due Date";
      }
      break;
  }

  if (validValuesEntered === true) {
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
      dueDate = previousTodo.due_date,
    } = request.body;

    const updateTodoQuery = `
     UPDATE todo
     SET
    todo = '${todo}',
     status = '${status}',
     priority = '${priority}',
     category = '${category}',
     due_date = '${dueDate}'
     WHERE
     id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } else {
    response.status(400);
    response.send(`Invalid ${invalidColumn}`);
  }
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
