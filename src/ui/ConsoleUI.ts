import * as readline from "readline";
import { TaskService } from "../services/TaskService";
import { Priority } from "../types/types";
import { Task } from "../models/Task";

export class ConsoleUI {
	private rl: readline.Interface;
	private taskService: TaskService;

	constructor(taskService: TaskService) {
		this.taskService = taskService;
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
	}

	private async question(query: string): Promise<string> {
		return new Promise((resolve) => {
			this.rl.question(query, resolve);
		});
	}

	async addTask(): Promise<void> {
		const name = await this.question("Enter task name: ");
		const priority = await this.question("Enter priority (Low/Medium/High): ");
		const category = await this.question("Enter category: ");
		const dueDateStr = await this.question("Enter due date (YYYY-MM-DD): ");

		const task = this.taskService.addTask(name, priority as Priority, category, new Date(dueDateStr));

		console.log("Task added successfully!");
		this.showMainMenu();
	}

	displayTasks(): void {
		const tasks = this.taskService.getAllTasks();
		console.log("\nAll Tasks:");
		tasks.forEach((task) => {
			console.log(`
ID: ${task.id}
Name: ${task.name}
Priority: ${task.priority}
Category: ${task.category}
Due Date: ${task.dueDate.toLocaleDateString()}
Status: ${task.isCompleted ? "Completed" : "Pending"}
-------------------`);
		});
		this.showMainMenu();
	}

	async markTaskComplete(): Promise<void> {
		const taskId = await this.question("Enter task ID to mark as complete: ");
		const success = this.taskService.markTaskAsComplete(taskId);

		if (success) {
			console.log("Task marked as complete!");
		} else {
			console.log("Task not found!");
		}
		this.showMainMenu();
	}

	async removeTask(): Promise<void> {
		const taskId = await this.question("Enter task ID to remove: ");
		const success = this.taskService.removeTask(taskId);

		if (success) {
			console.log("Task removed successfully!");
		} else {
			console.log("Task not found!");
		}
		this.showMainMenu();
	}

	private async displayFilteredTasks(tasks: Task[]): Promise<void> {
		if (tasks.length === 0) {
			console.log("\nNo tasks found!");
			return;
		}

		console.log("\nTasks:");
		tasks.forEach((task) => {
			console.log(`
ID: ${task.id}
Name: ${task.name}
Priority: ${task.priority}
Category: ${task.category}
Due Date: ${task.dueDate.toLocaleDateString()}
Status: ${task.isCompleted ? "Completed" : "Pending"}
-------------------`);
		});
	}

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

		const tasks = this.taskService.getTasksByPriority(priority);
		await this.displayFilteredTasks(tasks);
		this.showMainMenu();
	}

	async filterByCategory(): Promise<void> {
		const categories = this.taskService.getUniqueCategories();

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
			const tasks = this.taskService.getTasksByCategory(categories[selectedIndex]);
			await this.displayFilteredTasks(tasks);
		} else {
			console.log("Invalid choice!");
		}
		this.showMainMenu();
	}

	async sortByDueDate(): Promise<void> {
		console.log("\nSort Order:");
		console.log("1. Ascending (Earlier → Later)");
		console.log("2. Descending (Later → Earlier)");

		const choice = await this.question("Enter your choice (1-2): ");
		const ascending = choice === "1";

		const tasks = this.taskService.getTasksSortedByDueDate(ascending);
		await this.displayFilteredTasks(tasks);
		this.showMainMenu();
	}

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
