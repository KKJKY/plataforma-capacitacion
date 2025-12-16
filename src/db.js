import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection({
  uri: process.env.MYSQL_URL
});

console.log("Conectado a MySQL correctamente");
export default db;

