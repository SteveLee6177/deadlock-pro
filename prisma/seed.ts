async function main() {
  console.log("No seed data is configured. Production team data is user-created only.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
