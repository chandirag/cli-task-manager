import { DataSource } from "typeorm";
import { Task } from "./../entities/Task";
import path from "path";

export const AppDataSource = new DataSource({
	type: "sqlite",
	database: path.join(__dirname, "..", "..", "data", "tasks.sqlite"),
	entities: [Task],
	synchronize: true,
	logging: false,
});
