import inquirer from "inquirer";
import { TaskService } from "../services/TaskService";
import { Priority, IPromptOption, IMenuItem } from "../types/types";
import { Task } from "../entities/Task";
import Table from "cli-table";
import { clearScreen } from "../utils/console";

/**
 * Interface for user interruption errors
 */
interface UserInterruptionError {
	message: string;
}

/**
 * Type guard to check if an error is a user interruption
 */
function isUserInterruptionError(error: unknown): error is UserInterruptionError {
	return (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as UserInterruptionError).message === "string" &&
		(error as UserInterruptionError).message.includes("User force closed the prompt")
	);
}

/**
 * Class representing the console user interface for the task manager.
 */
export class ConsoleUI {
	private taskService: TaskService;
	private readonly mainMenuItems: IMenuItem[];
	private readonly viewMenuItems: IMenuItem[];
	private lastDisplayedTasks: Task[] | null = null;

	/**
	 * Creates an instance of ConsoleUI.
	 * @param taskService - The service for managing tasks.
	 */
	constructor(taskService: TaskService) {
		this.taskService = taskService;

		// Setup Ctrl+C handler
		process.on("SIGINT", () => {
			console.log("\n👋 Goodbye!");
			process.exit(0);
		});

		// Update main menu items with emojis
		this.mainMenuItems = [
			{ name: "📝 Add Task", value: "add", handler: this.addTask.bind(this) },
			{ name: "👀 View All Tasks", value: "viewAll", handler: this.displayTasks.bind(this) },
			{ name: "🔍 Filter/Sort Tasks", value: "filter", handler: this.showViewOptions.bind(this) },
			{ name: "✍🏼 Edit Task", value: "edit", handler: this.editTask.bind(this) },
			{ name: "✅ Mark Task as Complete", value: "complete", handler: this.markTaskComplete.bind(this) },
			{ name: "🗑️ Remove Task", value: "remove", handler: this.removeTask.bind(this) },
			{ name: "👋 Exit", value: "exit", handler: this.exit.bind(this) },
		];

		// Update view menu items with emojis
		this.viewMenuItems = [
			{ name: "📋 View All Tasks", value: "all", handler: this.displayTasks.bind(this) },
			{ name: "⭐ Filter by Priority", value: "priority", handler: this.filterByPriority.bind(this) },
			{ name: "🏷️  Filter by Category", value: "category", handler: this.filterByCategory.bind(this) },
			{ name: "📅 Sort by Due Date", value: "date", handler: this.sortByDueDate.bind(this) },
			{ name: "⏪  Back to Main Menu", value: "back", handler: this.showMainMenu.bind(this) },
		];
	}

	/**
	 * Creates a table for displaying tasks.
	 */
	private createTaskTable(): Table {
		return new Table({
			head: ["#", "Name", "Priority", "Category", "Due Date", "Status", "Created", "Last Updated"],
			colWidths: [4, 30, 10, 20, 12, 15, 25, 25],
			truncate: "false",
			style: {
				head: ["cyan"],
				border: ["grey"],
			},
		});
	}

	/**
	 * Formats tasks into a table.
	 */
	private formatTasksToTable(tasks: Task[]): void {
		const table = this.createTaskTable();
		tasks.forEach((task, index) => {
			table.push([
				(index + 1).toString(),
				task.name,
				task.priority,
				task.category,
				task.dueDate.toLocaleDateString(),
				task.isCompleted ? "Completed" : "Pending",
				new Date(task.createdAt).toLocaleString(),
				new Date(task.updatedAt).toLocaleString(),
			]);
		});
		console.log(table.toString());
	}

	/**
	 * Displays the current task table and menu.
	 * @param tasks - Optional tasks to display
	 * @param menuTitle - Optional menu title
	 * @param menuItems - Optional menu items to display
	 * @param filterMessage - Optional message to display above the table
	 * @param showTable - Whether to show the table
	 */
	private async displayTableAndMenu(
		tasks: Task[] | null | undefined = undefined,
		menuTitle: string = "Task Manager",
		menuItems: IMenuItem[] = this.mainMenuItems,
		filterMessage?: string,
		showTable: boolean = false
	): Promise<void> {
		try {
			clearScreen();

			// Display table if there are tasks to show and showTable is true
			if (tasks) {
				this.lastDisplayedTasks = tasks;
			}

			// Display filter message if provided
			if (filterMessage) {
				console.log(`\n${filterMessage}`);
			}

			// Only show table if showTable is true
			if (showTable) {
				console.log("\nTasks:");
				if ((tasks && tasks.length > 0) || (this.lastDisplayedTasks && this.lastDisplayedTasks.length > 0)) {
					const tasksToDisplay = tasks || this.lastDisplayedTasks;
					if (tasksToDisplay) {
						this.formatTasksToTable(tasksToDisplay);
					}
				} else {
					const emptyTable = this.createTaskTable();
					console.log(emptyTable.toString());
				}
				console.log(); // Add spacing between table and menu
			}

			// Display menu
			const { action } = await inquirer.prompt([
				{
					type: "list",
					name: "action",
					message: menuTitle,
					choices: menuItems.map((item) => ({
						name: item.name,
						value: item.value,
					})),
				},
			]);

			const menuItem = menuItems.find((item) => item.value === action);
			if (menuItem) {
				await menuItem.handler();
			}
		} catch (error: unknown) {
			if (isUserInterruptionError(error)) {
				console.log("\n👋 Goodbye!");
				process.exit(0);
			}
			throw error;
		}
	}

	/**
	 * Adds a new task through interactive prompts.
	 */
	private async addTask(): Promise<void> {
		try {
			const answers = await inquirer.prompt([
				{
					type: "input",
					name: "name",
					message: "Enter task name:",
					validate: (input) => input.trim().length > 0 || "Task name cannot be empty",
				},
				{
					type: "list",
					name: "priority",
					message: "Select priority:",
					choices: Object.values(Priority).map((p) => ({ name: p, value: p })),
				},
				{
					type: "input",
					name: "category",
					message: "Enter category:",
					validate: (input) => input.trim().length > 0 || "Category cannot be empty",
				},
				{
					type: "input",
					name: "dueDate",
					message: "Enter due date (YYYY-MM-DD):",
					validate: this.validateDueDate,
				},
			]);

			await this.taskService.addTask(answers.name, answers.priority, answers.category, new Date(answers.dueDate));
			console.log("Task added successfully!");
			await this.displayTableAndMenu(await this.taskService.getAllTasks());
		} catch (error) {
			console.error("Error adding task:", error);
			await this.showMainMenu();
		}
	}

	/**
	 * Validates the due date input.
	 */
	private validateDueDate(input: string): boolean | string {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
			return "Please enter the date in YYYY-MM-DD format";
		}

		const inputDate = new Date(input);
		if (isNaN(inputDate.getTime())) {
			return "Please enter a valid date";
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (inputDate < today) {
			return "Due date cannot be in the past";
		}

		const [year, month, day] = input.split("-").map(Number);
		const monthDays = new Date(year, month, 0).getDate();

		if (month < 1 || month > 12) {
			return "Month must be between 1 and 12";
		}

		if (day < 1 || day > monthDays) {
			return `Day must be between 1 and ${monthDays} for the selected month`;
		}

		return true;
	}

	/**
	 * Displays the main menu and handles user input.
	 */
	async showMainMenu(): Promise<void> {
		await this.displayTableAndMenu(undefined, "Task Manager", this.mainMenuItems, undefined, false);
	}

	/**
	 * Displays the view options menu.
	 */
	async showViewOptions(): Promise<void> {
		await this.displayTableAndMenu(
			this.lastDisplayedTasks,
			"Filter/Sort Options",
			this.viewMenuItems,
			undefined,
			true
		);
	}

	/**
	 * Displays all tasks.
	 */
	private async displayTasks(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();
			if (tasks.length === 0) {
				this.lastDisplayedTasks = null;
				await this.displayTableAndMenu([], undefined, undefined, "No tasks found!", true);
			} else {
				await this.displayTableAndMenu(tasks, undefined, undefined, undefined, true);
				return;
			}
		} catch (error) {
			console.error("Error displaying tasks:", error);
			await this.showMainMenu();
		}
	}

	/**
	 * Filters tasks by priority.
	 */
	private async filterByPriority(): Promise<void> {
		try {
			const { priority } = await inquirer.prompt([
				{
					type: "list",
					name: "priority",
					message: "Select Priority:",
					choices: Object.values(Priority).map((p) => ({
						name: p,
						value: p,
					})),
				},
			]);

			const tasks = await this.taskService.getTasksByPriority(priority);
			const filterMessage = tasks.length === 0 ? `No tasks found with priority: ${priority}` : undefined;
			await this.displayTableAndMenu(tasks, "Filter/Sort Options", this.viewMenuItems, filterMessage, true);
		} catch (error) {
			console.error("Error filtering tasks:", error);
			await this.showViewOptions();
		}
	}

	/**
	 * Filters tasks by category.
	 */
	private async filterByCategory(): Promise<void> {
		try {
			const categories = await this.taskService.getUniqueCategories();

			if (categories.length === 0) {
				await this.displayTableAndMenu(
					[],
					"Filter/Sort Options",
					this.viewMenuItems,
					"No categories found!",
					true
				);
				return;
			}

			const { category } = await inquirer.prompt([
				{
					type: "list",
					name: "category",
					message: "Select Category:",
					choices: categories.map((c) => ({
						name: c,
						value: c,
					})),
				},
			]);

			const tasks = await this.taskService.getTasksByCategory(category);
			const filterMessage = tasks.length === 0 ? `No tasks found in category: ${category}` : undefined;
			await this.displayTableAndMenu(tasks, "Filter/Sort Options", this.viewMenuItems, filterMessage, true);
		} catch (error) {
			console.error("Error filtering tasks:", error);
			await this.showViewOptions();
		}
	}

	/**
	 * Sorts tasks by due date.
	 */
	private async sortByDueDate(): Promise<void> {
		try {
			const { order } = await inquirer.prompt([
				{
					type: "list",
					name: "order",
					message: "Select Sort Order:",
					choices: [
						{ name: "Earlier → Later", value: true },
						{ name: "Later → Earlier", value: false },
					],
				},
			]);

			const tasks = await this.taskService.getTasksSortedByDueDate(order);
			const filterMessage = tasks.length === 0 ? "No tasks found!" : undefined;
			await this.displayTableAndMenu(tasks, "Filter/Sort Options", this.viewMenuItems, filterMessage, true);
		} catch (error) {
			console.error("Error sorting tasks:", error);
			await this.showViewOptions();
		}
	}

	/**
	 * Marks a task as complete.
	 */
	private async markTaskComplete(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();

			if (tasks.length === 0) {
				console.log("\nNo tasks available!");
				await this.showMainMenu();
				return;
			}

			const { taskId } = await inquirer.prompt([
				{
					type: "list",
					name: "taskId",
					message: "Select task to mark as complete:",
					choices: tasks
						.filter((task) => !task.isCompleted)
						.map((task) => ({
							name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
							value: task.id,
						})),
				},
			]);

			const success = await this.taskService.markTaskAsComplete(taskId);
			if (success) {
				console.log("Task marked as complete!");
			} else {
				console.log("Failed to mark task as complete.");
			}
		} catch (error) {
			console.error("Error marking task as complete:", error);
		}
		await this.showMainMenu();
	}

	/**
	 * Removes a task.
	 */
	private async removeTask(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();

			if (tasks.length === 0) {
				console.log("\nNo tasks available!");
				await this.showMainMenu();
				return;
			}

			const { taskId } = await inquirer.prompt([
				{
					type: "list",
					name: "taskId",
					message: "Select task to remove:",
					choices: tasks.map((task) => ({
						name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
						value: task.id,
					})),
				},
			]);

			// Add confirmation step
			const { confirm } = await inquirer.prompt([
				{
					type: "confirm",
					name: "confirm",
					message: "Are you sure you want to delete this task?",
					default: false,
				},
			]);

			if (!confirm) {
				console.log("Task deletion cancelled.");
				await this.showMainMenu();
				return;
			}

			const success = await this.taskService.removeTask(taskId);
			if (success) {
				console.log("Task removed successfully!");
			} else {
				console.log("Failed to remove task.");
			}
		} catch (error: unknown) {
			if (isUserInterruptionError(error)) {
				console.log("\n👋 Goodbye!");
				process.exit(0);
			}
			console.error("Error removing task:", error);
		}
		await this.showMainMenu();
	}

	/**
	 * Exits the application.
	 */
	private async exit(): Promise<void> {
		const { confirm } = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: "Are you sure you want to exit?",
				default: false,
			},
		]);

		if (confirm) {
			console.log("👋 Goodbye! Your tasks will be here when you come back!");
			process.exit(0);
		} else {
			await this.showMainMenu();
		}
	}

	/**
	 * Edits an existing task.
	 */
	private async editTask(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();

			if (tasks.length === 0) {
				console.log("\nNo tasks available!");
				await this.showMainMenu();
				return;
			}

			const { taskId } = await inquirer.prompt([
				{
					type: "list",
					name: "taskId",
					message: "Select task to edit:",
					choices: tasks.map((task) => ({
						name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
						value: task.id,
					})),
				},
			]);

			const task = await this.taskService.getTaskById(taskId);
			if (!task) {
				console.log("Task not found!");
				await this.showMainMenu();
				return;
			}

			const { field } = await inquirer.prompt([
				{
					type: "list",
					name: "field",
					message: "What would you like to edit?",
					choices: [
						{ name: "📝 Task Name", value: "name" },
						{ name: "⭐ Priority", value: "priority" },
						{ name: "🏷️  Category", value: "category" },
						{ name: "📅 Due Date", value: "dueDate" },
					],
				},
			]);

			let updates: Partial<Task> = {};

			switch (field) {
				case "name":
					const { name } = await inquirer.prompt([
						{
							type: "input",
							name: "name",
							message: "Enter new task name:",
							default: task.name,
							validate: (input) => input.trim().length > 0 || "Task name cannot be empty",
						},
					]);
					updates.name = name;
					break;

				case "priority":
					const { priority } = await inquirer.prompt([
						{
							type: "list",
							name: "priority",
							message: "Select new priority:",
							choices: Object.values(Priority).map((p) => ({ name: p, value: p })),
							default: task.priority,
						},
					]);
					updates.priority = priority;
					break;

				case "category":
					const { category } = await inquirer.prompt([
						{
							type: "input",
							name: "category",
							message: "Enter new category:",
							default: task.category,
							validate: (input) => input.trim().length > 0 || "Category cannot be empty",
						},
					]);
					updates.category = category;
					break;

				case "dueDate":
					const { dueDate } = await inquirer.prompt([
						{
							type: "input",
							name: "dueDate",
							message: "Enter new due date (YYYY-MM-DD):",
							default: task.dueDate.toISOString().split("T")[0],
							validate: this.validateDueDate,
						},
					]);
					updates.dueDate = new Date(dueDate);
					break;
			}

			await this.taskService.updateTask(taskId, updates);
			console.log("Task updated successfully!");
			const updatedTasks = await this.taskService.getAllTasks();
			await this.displayTableAndMenu(updatedTasks, undefined, undefined, undefined, true);
		} catch (error) {
			console.error("Error editing task:", error);
			await this.showMainMenu();
		}
	}
}
