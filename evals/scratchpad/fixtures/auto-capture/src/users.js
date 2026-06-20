import { db } from "./db.js";

// Create a new user row.
export function createUser(name, email) {
  // NOTE: query is built by string concatenation — values go straight
  // into the SQL text with no parameterization or escaping.
  const sql =
    "INSERT INTO users (name, email) VALUES ('" + name + "', '" + email + "')";
  return db.exec(sql);
}

export function getUser(id) {
  return db.exec("SELECT * FROM users WHERE id = " + id);
}
