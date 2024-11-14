import inquirer from "inquirer";
import { BaseUI } from "../base/BaseUI";
import { TaskService } from "../../services/TaskService";
import { Priority } from "../../types/types";
import { TableComponent } from "../components/TableComponent";
import { clearScreen } from "../../utils/console";

/**
 * Handles all filtering and sorting operations for tasks.
 */
export class FilterHandler extends BaseUI {
	private tableComponent: TableComponent;

	/**
	 * Creates an instance of FilterHandler.
	 * @param taskService - The service for managing tasks
	 */
	constructor(taskService: TaskService) {
		super(taskService);
		this.tableComponent = new TableComponent();
	}

	/**
	 * Handles filtering tasks by priority.
	 * Shows a list of priorities and displays matching tasks.
	 */
	public async handleFilterByPriority(): Promise<void> {
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
			if (tasks.length === 0) {
				console.log(`\nNo tasks found with priority: ${priority}`);
				return;
			}

			clearScreen();
			console.log(`\nShowing tasks with priority: ${priority}\n`);
			this.tableComponent.formatTasksToTable(tasks);
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error filtering tasks:", error);
		}
	}

	/**
	 * Handles filtering tasks by category.
	 * Shows a list of existing categories and displays matching tasks.
	 */
	public async handleFilterByCategory(): Promise<void> {
		try {
			const categories = await this.taskService.getUniqueCategories();
			if (categories.length === 0) {
				console.log("\nNo categories found!");
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
			if (tasks.length === 0) {
				console.log(`\nNo tasks found in category: ${category}`);
				return;
			}

			clearScreen();
			console.log(`\nShowing tasks in category: ${category}\n`);
			this.tableComponent.formatTasksToTable(tasks);
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error filtering tasks:", error);
		}
	}

	/**
	 * Handles sorting tasks by due date.
	 * Allows user to choose sort direction and displays sorted tasks.
	 */
	public async handleSortByDueDate(): Promise<void> {
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
			if (tasks.length === 0) {
				console.log("\nNo tasks found!");
				return;
			}

			clearScreen();
			console.log(`\nShowing tasks sorted by due date (${order ? "Earlier → Later" : "Later → Earlier"})\n`);
			this.tableComponent.formatTasksToTable(tasks);
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error sorting tasks:", error);
		}
	}
}
