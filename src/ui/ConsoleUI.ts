import { TaskService } from "../services/TaskService";
import { BaseUI } from "./base/BaseUI";
import { SearchHandler } from "./handlers/SearchHandler";
import { TaskHandler } from "./handlers/TaskHandler";
import { FilterHandler } from "./handlers/FilterHandler";
import { MenuHandler } from "./handlers/MenuHandler";

/**
 * Main UI class that orchestrates the console interface.
 * Initializes and manages different handlers for various functionalities.
 */
export class ConsoleUI extends BaseUI {
	private readonly searchHandler: SearchHandler;
	private readonly taskHandler: TaskHandler;
	private readonly filterHandler: FilterHandler;
	private readonly menuHandler: MenuHandler;

	/**
	 * Creates an instance of ConsoleUI.
	 * Initializes all handlers and sets up the Ctrl+C handler.
	 * @param taskService - The service for managing tasks
	 */
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

	/**
	 * Starts the application by showing the main menu.
	 */
	public async start(): Promise<void> {
		await this.menuHandler.showMainMenu();
	}
}
