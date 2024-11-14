import { Task } from "../../entities/Task";
import { BaseUI } from "../base/BaseUI";
import { TaskService } from "../../services/TaskService";
import { TableComponent } from "../components/TableComponent";
import { clearScreen } from "../../utils/console";

/**
 * Handles real-time search functionality across tasks.
 */
export class SearchHandler extends BaseUI {
	private tableComponent: TableComponent;

	/**
	 * Creates an instance of SearchHandler.
	 * @param taskService - The service for managing tasks
	 */
	constructor(taskService: TaskService) {
		super(taskService);
		this.tableComponent = new TableComponent();
	}

	/**
	 * Handles the real-time search process.
	 * Displays tasks and updates results as user types.
	 */
	public async handleSearch(): Promise<void> {
		try {
			const allTasks = await this.taskService.getAllTasks();
			if (allTasks.length === 0) {
				console.log("\nNo tasks available to search!");
				return;
			}

			clearScreen();
			console.log("\nSearch Tasks (press Ctrl+C to return to main menu)");
			console.log("Type to search across task name, category, or status...\n");

			this.tableComponent.formatTasksToTable(allTasks);

			const rl = require("readline").createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			let searchTerm = "";
			process.stdin.on("keypress", async (str, key) => {
				if (key.ctrl && key.name === "c") {
					rl.close();
					return;
				}

				if (this.isSpecialKey(key)) return;

				searchTerm = this.updateSearchTerm(searchTerm, key);
				this.displaySearchResults(searchTerm, allTasks);
			});

			process.stdin.setRawMode(true);
			await new Promise((resolve) => rl.on("close", resolve));
			this.cleanup();
		} catch (error) {
			console.error("Error searching tasks:", error);
		}
	}

	/**
	 * Checks if a key press is a special key that should be ignored.
	 * @param key - The key object from the keypress event
	 * @returns True if the key is special and should be ignored
	 */
	private isSpecialKey(key: any): boolean {
		return ["up", "down", "left", "right", "home", "end", "pageup", "pagedown"].includes(key.name);
	}

	/**
	 * Updates the search term based on user input.
	 * @param currentTerm - The current search term
	 * @param key - The key object from the keypress event
	 * @returns The updated search term
	 */
	private updateSearchTerm(currentTerm: string, key: any): string {
		if (key.name === "backspace") {
			return currentTerm.slice(0, -1);
		}
		if (key.sequence && /^[a-zA-Z0-9 ]$/.test(key.sequence)) {
			return currentTerm + key.sequence;
		}
		return currentTerm;
	}

	/**
	 * Displays search results based on the current search term.
	 * @param searchTerm - The current search term
	 * @param allTasks - All available tasks to search through
	 */
	private displaySearchResults(searchTerm: string, allTasks: Task[]): void {
		clearScreen();
		console.log("\nSearch Tasks (press Ctrl+C to return to main menu)");
		console.log(`Current search: ${searchTerm}\n`);

		const filteredTasks = this.filterTasks(searchTerm, allTasks);

		if (filteredTasks.length > 0) {
			this.tableComponent.formatTasksToTable(filteredTasks);
			console.log(`\nFound ${filteredTasks.length} matching tasks out of ${allTasks.length} total tasks`);
		} else {
			console.log("No matching tasks found.");
		}
	}

	/**
	 * Filters tasks based on the search term.
	 * Searches across task name, category, and completion status.
	 * @param searchTerm - The term to search for
	 * @param tasks - The tasks to search through
	 * @returns Filtered array of tasks matching the search term
	 */
	private filterTasks(searchTerm: string, tasks: Task[]): Task[] {
		const searchTermLower = searchTerm.toLowerCase();
		return tasks.filter(
			(task) =>
				task.name.toLowerCase().includes(searchTermLower) ||
				task.category.toLowerCase().includes(searchTermLower) ||
				(task.isCompleted ? "completed" : "pending").includes(searchTermLower) ||
				task.priority.toLowerCase().includes(searchTermLower)
		);
	}

	/**
	 * Cleans up event listeners and terminal settings.
	 */
	private cleanup(): void {
		process.stdin.setRawMode(false);
		process.stdin.removeAllListeners("keypress");
	}
}
