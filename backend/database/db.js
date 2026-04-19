import pkg from "pg";
const {Client} = pkg;

const databaseConnection = new Client({
    user: "postgres",
    host: "localhost",
    password: "postgres18",
    database: "mern_ecom_store",
    port: 5432

})


try {
    await databaseConnection.connect()
    console.log("Database Connected successfully!")
} catch (error) {
    console.log("Database connections error, Pleas check your connection", error)
    process.exit(1);
}

export default databaseConnection;