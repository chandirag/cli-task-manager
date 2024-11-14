import inquirer from "inquirer";
import { TaskService } from "../services/TaskService";
import { IMenuItem } from "../types/types";
import { BaseUI } from "./base/BaseUI";
import { SearchHandler } from "./handlers/SearchHandler";
import { TaskHandler } from "./handlers/TaskHandler";
import { FilterHandler } from "./handlers/FilterHandler";
import { MenuHandler } from "./handlers/MenuHandler";

export class ConsoleUI extends BaseUI {
	private readonly searchHandler: SearchHandler;
	private readonly taskHandler: TaskHandler;
	private readonly filterHandler: FilterHandler;
	private readonly menuHandler: MenuHandler;

	constructor(taskService: TaskService) {
		super(taskService);

		this.searchHandler = new SearchHandler(taskService);
		this.taskHandler = new TaskHandler(taskService);
		this.filterHandler = new FilterHandler(taskService);
		this.menuHandler = new MenuHandler(taskService);

		// Setup Ctrl+C handler
		process.on("SIGINT", () => {
			console.log("\n👋 Goodbye!");
			process.exit(0);
		});
	}

	public async start(): Promise<void> {
		await this.menuHandler.showMainMenu();
	}
}
