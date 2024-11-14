import "reflect-metadata";
import { AppDataSource } from "./config/database";
import { TaskService } from "./services/TaskService";
import { TaskRepository } from "./repositories/TaskRepository";
import { ConsoleUI } from "./ui/ConsoleUI";

async function main() {
	try {
		await AppDataSource.initialize();
		console.log("Database connection established");

		const taskRepository = new TaskRepository();
		const taskService = new TaskService(taskRepository);
		const ui = new ConsoleUI(taskService);

		await ui.showMainMenu();
	} catch (error) {
		console.error("Error starting application:", error);
		process.exit(1);
	}
}

main();
