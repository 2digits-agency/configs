export async function clear(db, users) {
  await db.delete(users);
}
