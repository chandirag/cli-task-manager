import * as readline from "readline";
import { TaskService } from "../services/TaskService";
import { Priority } from "../types/types";
import { Task } from "../entities/Task";
import Table from "cli-table";

/**
 * Class representing the console user interface for the task manager.
 */
export class ConsoleUI {
	private rl: readline.Interface;
	private taskService: TaskService;
	private static MAX_RETRIES = 3;

	/**
	 * Creates an instance of ConsoleUI.
	 * @param taskService - The service for managing tasks.
	 */
	constructor(taskService: TaskService) {
		this.taskService = taskService;
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
	}

	/**
	 * Prompts the user with a question and returns their input.
	 * @param query - The question to ask the user.
	 * @returns A promise that resolves to the user's input.
	 */
	private async question(query: string): Promise<string> {
		return new Promise((resolve) => {
			this.rl.question(query, resolve);
		});
	}

	/**
	 * Prompts the user with a question and validates the input with retries.
	 * @param query - The question to ask the user.
	 * @param validator - The function to validate the user's input.
	 * @param currentRetry - The current retry attempt.
	 * @returns A promise that resolves to the valid input or null if max retries are exceeded.
	 */
	private async questionWithRetries(
		query: string,
		validator: (input: string) => { isValid: boolean; message?: string },
		currentRetry: number = 1
	): Promise<string | null> {
		const answer = await this.question(query);
		const validation = validator(answer);

		if (validation.isValid) {
			return answer;
		}

		if (currentRetry >= ConsoleUI.MAX_RETRIES) {
			console.log("\nToo many invalid attempts. Returning to main menu.");
			return null;
		}

		console.log(validation.message || "Invalid input. Please try again.");
		return this.questionWithRetries(query, validator, currentRetry + 1);
	}

	/**
	 * Validates the priority input.
	 * @param input - The user's input.
	 * @returns An object indicating if the input is valid and an optional message.
	 */
	private validatePriority(input: string): { isValid: boolean; message?: string } {
		const normalizedInput = input.toLowerCase();
		const validInputs = {
			low: Priority.LOW,
			l: Priority.LOW,
			medium: Priority.MEDIUM,
			m: Priority.MEDIUM,
			high: Priority.HIGH,
			h: Priority.HIGH,
		};

		if (normalizedInput in validInputs) {
			return { isValid: true };
		}

		return {
			isValid: false,
			message: "Please enter a valid priority (Low/L, Medium/M, High/H)",
		};
	}

	/**
	 * Validates the due date input.
	 * @param input - The user's input.
	 * @returns An object indicating if the input is valid and an optional message.
	 */
	private validateDueDate(input: string): { isValid: boolean; message?: string } {
		// Check format
		if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
			return {
				isValid: false,
				message: "Please enter the date in YYYY-MM-DD format",
			};
		}

		const inputDate = new Date(input);

		// Check if date is valid
		if (isNaN(inputDate.getTime())) {
			return {
				isValid: false,
				message: "Please enter a valid date",
			};
		}

		// Remove time component for comparison
		const today = new Date();
		const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const inputWithoutTime = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

		// Check if date is in the past
		if (inputWithoutTime < todayWithoutTime) {
			return {
				isValid: false,
				message: "Due date cannot be in the past",
			};
		}

		// Validate month and day
		const [year, month, day] = input.split("-").map(Number);
		const monthDays = new Date(year, month, 0).getDate();

		if (month < 1 || month > 12) {
			return {
				isValid: false,
				message: "Month must be between 1 and 12",
			};
		}

		if (day < 1 || day > monthDays) {
			return {
				isValid: false,
				message: `Day must be between 1 and ${monthDays} for the selected month`,
			};
		}

		return { isValid: true };
	}

	/**
	 * Validates the task name input.
	 * @param input - The user's input.
	 * @returns An object indicating if the input is valid and an optional message.
	 */
	private validateTaskName(input: string): { isValid: boolean; message?: string } {
		if (input.trim().length === 0) {
			return {
				isValid: false,
				message: "Task name cannot be empty",
			};
		}
		return { isValid: true };
	}

	/**
	 * Validates the category input.
	 * @param input - The user's input.
	 * @returns An object indicating if the input is valid and an optional message.
	 */
	private validateCategory(input: string): { isValid: boolean; message?: string } {
		if (input.trim().length === 0) {
			return {
				isValid: false,
				message: "Category cannot be empty",
			};
		}
		return { isValid: true };
	}

	/**
	 * Converts user input to a Priority enum.
	 * @param input - The user's input.
	 * @returns The corresponding Priority enum.
	 */
	private getPriorityFromInput(input: string): Priority {
		const normalizedInput = input.toLowerCase();
		switch (normalizedInput) {
			case "l":
			case "low":
				return Priority.LOW;
			case "m":
			case "medium":
				return Priority.MEDIUM;
			case "h":
			case "high":
				return Priority.HIGH;
			default:
				throw new Error("Invalid priority");
		}
	}

	/**
	 * Prompts the user to add a new task with validation.
	 */
	async addTask(): Promise<void> {
		// Get task name
		const name = await this.questionWithRetries("Enter task name: ", this.validateTaskName);
		if (!name) {
			this.showMainMenu();
			return;
		}

		// Get priority
		const priorityInput = await this.questionWithRetries(
			"Enter priority (Low/L, Medium/M, High/H): ",
			this.validatePriority
		);
		if (!priorityInput) {
			this.showMainMenu();
			return;
		}

		// Get category
		const category = await this.questionWithRetries("Enter category: ", this.validateCategory);
		if (!category) {
			this.showMainMenu();
			return;
		}

		// Get due date
		const dueDateStr = await this.questionWithRetries("Enter due date (YYYY-MM-DD): ", this.validateDueDate);
		if (!dueDateStr) {
			this.showMainMenu();
			return;
		}

		try {
			const priority = this.getPriorityFromInput(priorityInput);
			await this.taskService.addTask(name, priority, category, new Date(dueDateStr));
			console.log("Task added successfully!");
		} catch (error) {
			console.error("Error adding task:", error);
		}
		this.showMainMenu();
	}

	/**
	 * Creates a table for displaying tasks.
	 * @returns A new Table instance.
	 */
	private createTaskTable(): Table {
		return new Table({
			head: ["#", "ID", "Name", "Priority", "Category", "Due Date", "Status"],
			colWidths: [4, 38, 20, 10, 15, 12, 10],
			style: {
				head: ["cyan"],
				border: ["grey"],
			},
		});
	}

	/**
	 * Formats tasks into a table and displays it.
	 * @param tasks - The list of tasks to display.
	 */
	private formatTasksToTable(tasks: Task[]): void {
		const table = this.createTaskTable();

		tasks.forEach((task, index) => {
			table.push([
				(index + 1).toString(),
				task.id,
				task.name,
				task.priority,
				task.category,
				task.dueDate.toLocaleDateString(),
				task.isCompleted ? "Completed" : "Pending",
			]);
		});

		console.log(table.toString());
	}

	/**
	 * Displays all tasks in a table format.
	 */
	async displayTasks(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();
			console.log("\nAll Tasks:");
			if (tasks.length === 0) {
				console.log("No tasks found!");
			} else {
				this.formatTasksToTable(tasks);
			}
		} catch (error) {
			console.error("Error displaying tasks:", error);
		}
		this.showMainMenu();
	}

	/**
	 * Marks a task as complete based on user input.
	 */
	async markTaskComplete(): Promise<void> {
		const taskId = await this.question("Enter task ID to mark as complete: ");
		const success = await this.taskService.markTaskAsComplete(taskId);

		if (success) {
			console.log("Task marked as complete!");
		} else {
			console.log("Task not found!");
		}
		this.showMainMenu();
	}

	/**
	 * Removes a task based on user input.
	 */
	async removeTask(): Promise<void> {
		const taskId = await this.question("Enter task ID to remove: ");
		const success = await this.taskService.removeTask(taskId);

		if (success) {
			console.log("Task removed successfully!");
		} else {
			console.log("Task not found!");
		}
		this.showMainMenu();
	}

	/**
	 * Displays filtered tasks in a table format.
	 * @param tasks - The list of tasks to display.
	 */
	private async displayFilteredTasks(tasks: Task[]): Promise<void> {
		if (tasks.length === 0) {
			console.log("\nNo tasks found!");
			return;
		}

		this.formatTasksToTable(tasks);
	}

	/**
	 * Filters tasks by priority based on user input.
	 */
	async filterByPriority(): Promise<void> {
		console.log("\nSelect Priority:");
		console.log(`1. ${Priority.LOW}`);
		console.log(`2. ${Priority.MEDIUM}`);
		console.log(`3. ${Priority.HIGH}`);

		const choice = await this.question("Enter your choice (1-3): ");
		let priority: Priority;

		switch (choice) {
			case "1":
				priority = Priority.LOW;
				break;
			case "2":
				priority = Priority.MEDIUM;
				break;
			case "3":
				priority = Priority.HIGH;
				break;
			default:
				console.log("Invalid choice!");
				this.showMainMenu();
				return;
		}

		const tasks = await this.taskService.getTasksByPriority(priority);
		await this.displayFilteredTasks(tasks);
		this.showMainMenu();
	}

	/**
	 * Filters tasks by category based on user input.
	 */
	async filterByCategory(): Promise<void> {
		const categories = await this.taskService.getUniqueCategories();

		if (categories.length === 0) {
			console.log("\nNo categories found!");
			this.showMainMenu();
			return;
		}

		console.log("\nAvailable Categories:");
		categories.forEach((category, index) => {
			console.log(`${index + 1}. ${category}`);
		});

		const choice = await this.question(`Enter your choice (1-${categories.length}): `);
		const selectedIndex = parseInt(choice) - 1;

		if (selectedIndex >= 0 && selectedIndex < categories.length) {
			const tasks = await this.taskService.getTasksByCategory(categories[selectedIndex]);
			await this.displayFilteredTasks(tasks);
		} else {
			console.log("Invalid choice!");
		}
		this.showMainMenu();
	}

	/**
	 * Sorts tasks by due date based on user input.
	 */
	async sortByDueDate(): Promise<void> {
		console.log("\nSort Order:");
		console.log("1. Ascending (Earlier → Later)");
		console.log("2. Descending (Later → Earlier)");

		const choice = await this.question("Enter your choice (1-2): ");
		const ascending = choice === "1";

		const tasks = await this.taskService.getTasksSortedByDueDate(ascending);
		await this.displayFilteredTasks(tasks);
		this.showMainMenu();
	}

	/**
	 * Displays the view options menu.
	 */
	async showViewOptions(): Promise<void> {
		console.log("\n=== View Options ===");
		console.log("1. View All Tasks");
		console.log("2. Filter by Priority");
		console.log("3. Filter by Category");
		console.log("4. Sort by Due Date");
		console.log("5. Back to Main Menu");

		const choice = await this.question("Enter your choice (1-5): ");

		switch (choice) {
			case "1":
				this.displayTasks();
				break;
			case "2":
				await this.filterByPriority();
				break;
			case "3":
				await this.filterByCategory();
				break;
			case "4":
				await this.sortByDueDate();
				break;
			case "5":
				this.showMainMenu();
				break;
			default:
				console.log("Invalid choice!");
				this.showViewOptions();
		}
	}

	/**
	 * Displays the main menu and handles user input.
	 */
	async showMainMenu(): Promise<void> {
		console.log("\n=== Task Manager ===");
		console.log("1. Add Task");
		console.log("2. View/Filter Tasks");
		console.log("3. Mark Task as Complete");
		console.log("4. Remove Task");
		console.log("5. Exit");

		const choice = await this.question("Enter your choice (1-5): ");

		switch (choice) {
			case "1":
				await this.addTask();
				break;
			case "2":
				await this.showViewOptions();
				break;
			case "3":
				await this.markTaskComplete();
				break;
			case "4":
				await this.removeTask();
				break;
			case "5":
				console.log("Goodbye!");
				this.rl.close();
				process.exit(0);
			default:
				console.log("Invalid choice!");
				this.showMainMenu();
		}
	}
}
