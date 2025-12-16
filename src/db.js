import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection(process.env.MYSQL_URL);
console.log("Conectado a MySQL en correctamente");

export default db;
