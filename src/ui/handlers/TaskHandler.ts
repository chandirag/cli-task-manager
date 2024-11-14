import { BaseUI } from "../base/BaseUI";
import { TaskService } from "../../services/TaskService";
import { Priority } from "../../types/types";
import { TableComponent } from "../components/TableComponent";
import { Task } from "../../entities/Task";
import { input, select, confirm } from "@inquirer/prompts";
import search from "@inquirer/search";
import { clearScreen } from "../../utils/console";

/**
 * Handles all task-related operations including adding, editing, and removing tasks.
 */
export class TaskHandler extends BaseUI {
	private tableComponent: TableComponent;

	/**
	 * Creates an instance of TaskHandler.
	 * @param taskService - The service for managing tasks
	 */
	constructor(taskService: TaskService) {
		super(taskService);
		this.tableComponent = new TableComponent();
	}

	/**
	 * Handles the process of adding a new task.
	 * Prompts user for task details and creates a new task.
	 */
	public async handleAddTask(): Promise<void> {
		try {
			const name = await input({
				message: "Enter task name:",
				validate: (input: string) => input.trim().length > 0 || "Task name cannot be empty",
			});

			const priority = await select({
				message: "Select priority:",
				choices: Object.values(Priority).map((p) => ({ name: p, value: p })),
			});

			const existingCategories = await this.taskService.getUniqueCategories();

			const category = await search<string>({
				message: "Enter category (type to search or enter new):",
				validate: (value: unknown) => {
					if (typeof value !== "string") return "Category must be a string";
					return value.trim().length > 0 || "Category cannot be empty";
				},
				source: (term: string | undefined, { signal }) => {
					if (!term) return existingCategories;

					const termLower = term.toLowerCase();
					const matches = existingCategories.filter((cat) => cat.toLowerCase().includes(termLower));

					// If the exact term doesn't exist, add it as a new option
					if (!matches.some((cat) => cat.toLowerCase() === termLower) && term.trim()) {
						return [...matches, `📝 Create new category: ${term}`];
					}

					return matches;
				},
			});

			// Remove the prefix if this was a new category
			const finalCategory = category.startsWith("📝 Create new category: ")
				? category.replace("📝 Create new category: ", "")
				: category;

			const dueDate = await input({
				message: "Enter due date (YYYY-MM-DD):",
				validate: this.validateDueDate,
			});

			await this.taskService.addTask(name, priority, finalCategory, new Date(dueDate));

			clearScreen();
			console.log("✅ Task added successfully!\n");

			const tasks = await this.taskService.getAllTasks();
			this.tableComponent.formatTasksToTable(tasks);
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error adding task:", error);
		}
	}

	/**
	 * Handles the process of editing an existing task.
	 * Shows a list of tasks and allows user to select one to edit.
	 */
	public async handleEditTask(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();
			if (tasks.length === 0) {
				console.log("\nNo tasks available!");
				return;
			}

			const taskId = await select({
				message: "Select task to edit:",
				choices: [
					...tasks.map((task) => ({
						name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
						value: task.id,
					})),
					{ name: "⏪ Back to Main Menu", value: "back" },
				],
			});

			if (taskId === "back") return;

			const task = await this.taskService.getTaskById(taskId);
			if (!task) {
				console.log("Task not found!");
				return;
			}

			const field = await select({
				message: "What would you like to edit?",
				choices: [
					{ name: "📝 Task Name", value: "name" },
					{ name: "⭐ Priority", value: "priority" },
					{ name: "🏷️  Category", value: "category" },
					{ name: "📅 Due Date", value: "dueDate" },
					{ name: "✅ Completion Status", value: "isCompleted" },
					{ name: "⏪ Back to Main Menu", value: "back" },
				],
			});

			if (field === "back") return;

			const updates = await this.getFieldUpdates(field, task);
			await this.taskService.updateTask(taskId, updates);
			clearScreen();
			console.log("✅ Task updated successfully!\n");

			const updatedTasks = await this.taskService.getAllTasks();
			this.tableComponent.formatTasksToTable(updatedTasks);
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error editing task:", error);
		}
	}

	/**
	 * Handles the process of removing a task.
	 * Shows a list of tasks and allows user to select one to remove.
	 * Requires confirmation before deletion.
	 */
	public async handleRemoveTask(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();
			if (tasks.length === 0) {
				console.log("\nNo tasks available!");
				return;
			}

			const taskId = await select({
				message: "Select task to remove:",
				choices: [
					...tasks.map((task) => ({
						name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
						value: task.id,
					})),
					{ name: "⏪ Back to Main Menu", value: "back" },
				],
			});

			if (taskId === "back") return;

			const shouldDelete = await confirm({
				message: "Are you sure you want to delete this task?",
				default: false,
			});

			if (!shouldDelete) {
				console.log("Task deletion cancelled.");
				return;
			}

			const success = await this.taskService.removeTask(taskId);
			clearScreen();
			if (success) {
				console.log("✅ Task removed successfully!\n");

				const remainingTasks = await this.taskService.getAllTasks();
				if (remainingTasks.length > 0) {
					this.tableComponent.formatTasksToTable(remainingTasks);
				} else {
					console.log("No tasks remaining.");
				}
			} else {
				console.log("❌ Failed to remove task.");
			}
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error removing task:", error);
		}
	}

	/**
	 * Gets updates for a specific field of a task.
	 * @param field - The field to update (name, priority, category, or dueDate)
	 * @param task - The current task being edited
	 * @returns A partial task object containing the updated field
	 */
	private async getFieldUpdates(field: string, task: Task): Promise<Partial<Task>> {
		switch (field) {
			case "name":
				const name = await input({
					message: "Enter new task name:",
					default: task.name,
					validate: (input) => input.trim().length > 0 || "Task name cannot be empty",
				});
				return { name };

			case "priority":
				const priority = await select({
					message: "Select new priority:",
					choices: Object.values(Priority).map((p) => ({ name: p, value: p })),
					default: task.priority,
				});
				return { priority };

			case "category":
				const existingCategories = await this.taskService.getUniqueCategories();
				const category = await search<string>({
					message: "Enter new category (type to search or enter new):",
					validate: (value: unknown) => {
						if (typeof value !== "string") return "Category must be a string";
						return value.trim().length > 0 || "Category cannot be empty";
					},
					source: (term: string | undefined, { signal }) => {
						if (!term) return existingCategories;

						const termLower = term.toLowerCase();
						const matches = existingCategories.filter((cat) => cat.toLowerCase().includes(termLower));

						// If the exact term doesn't exist, add it as a new option
						if (!matches.some((cat) => cat.toLowerCase() === termLower) && term.trim()) {
							return [...matches, `📝 Create new category: ${term}`];
						}

						return matches;
					},
				});

				// Remove the prefix if this was a new category
				const finalCategory = category.startsWith("📝 Create new category: ")
					? category.replace("📝 Create new category: ", "")
					: category;

				return { category: finalCategory };

			case "dueDate":
				const dueDate = await input({
					message: "Enter new due date (YYYY-MM-DD):",
					default: task.dueDate.toISOString().split("T")[0],
					validate: this.validateDueDate,
				});
				return { dueDate: new Date(dueDate) };

			case "isCompleted":
				const isCompleted = await select({
					message: "Select completion status:",
					choices: [
						{ name: "Completed", value: true },
						{ name: "Pending", value: false },
					],
					default: task.isCompleted,
				});
				return { isCompleted };

			default:
				return {};
		}
	}
}
