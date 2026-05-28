import pool from "../database/db.js";

export async function getPersona(name) {
  const result = await pool.query(
    "SELECT * FROM personas WHERE name = $1",
    [name]
  );

  if (result.rows.length === 0) {
    throw new Error(`Persona '${name}' não encontrada`);
  }

  return result.rows[0];
}

export async function listPersonas() {
  const result = await pool.query(
    "SELECT id, name FROM personas ORDER BY name"
  );
  return result.rows;
}