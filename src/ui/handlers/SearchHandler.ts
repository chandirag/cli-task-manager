import { Task } from "../../entities/Task";
import { BaseUI } from "../base/BaseUI";
import { TaskService } from "../../services/TaskService";
import { TableComponent } from "../components/TableComponent";
import { clearScreen } from "../../utils/console";
import Fuse from "fuse.js";

/**
 * Handles real-time search functionality across tasks.
 */
export class SearchHandler extends BaseUI {
	private tableComponent: TableComponent;
	private fuse!: Fuse<Task>;

	/**
	 * Creates an instance of SearchHandler.
	 * @param taskService - The service for managing tasks
	 */
	constructor(taskService: TaskService) {
		super(taskService);
		this.tableComponent = new TableComponent();
	}

	/**
	 * Initializes the Fuse instance with the current tasks.
	 * @param tasks - Array of tasks to initialize fuzzy search with
	 */
	private initializeFuseSearch(tasks: Task[]): void {
		const options = {
			keys: [
				{ name: "name", weight: 2 },
				{ name: "category", weight: 1 },
				{ name: "priority", weight: 1 },
			],
			includeScore: true,
			threshold: 0.4,
			ignoreLocation: true,
			minMatchCharLength: 2,
		};
		this.fuse = new Fuse(tasks, options);
	}

	/**
	 * Filters tasks based on the search term using fuzzy search.
	 * @param searchTerm - The term to search for
	 * @param tasks - The tasks to search through (used as fallback)
	 * @returns Filtered array of tasks matching the search term
	 */
	private filterTasks(searchTerm: string, tasks: Task[]): Task[] {
		if (!searchTerm) return tasks;

		const results = this.fuse.search(searchTerm);
		return results.map((result) => result.item);
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

			this.initializeFuseSearch(allTasks);

			clearScreen();
			console.log("\nSearch Tasks (press Ctrl+C to return to main menu)");
			console.log("Type to search across task name, category, priority, or status...\n");
			console.log("Fuzzy search enabled - try approximate matches!\n");

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
			if (searchTerm) {
				console.log("(Using fuzzy search - results include approximate matches)");
			}
		} else {
			console.log("No matching tasks found.");
		}
	}

	/**
	 * Cleans up event listeners and terminal settings.
	 */
	private cleanup(): void {
		process.stdin.setRawMode(false);
		process.stdin.removeAllListeners("keypress");
	}
}
