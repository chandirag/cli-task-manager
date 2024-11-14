import inquirer from "inquirer";
import { BaseUI } from "../base/BaseUI";
import { TaskService } from "../../services/TaskService";
import { Priority } from "../../types/types";
import { TableComponent } from "../components/TableComponent";
import { Task } from "../../entities/Task";

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

			const { taskId } = await inquirer.prompt([
				{
					type: "list",
					name: "taskId",
					message: "Select task to edit:",
					choices: [
						...tasks.map((task) => ({
							name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
							value: task.id,
						})),
						{ name: "⏪ Back to Main Menu", value: "back" },
					],
				},
			]);

			if (taskId === "back") return;

			const task = await this.taskService.getTaskById(taskId);
			if (!task) {
				console.log("Task not found!");
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
						{ name: "✅ Completion Status", value: "isCompleted" },
						{ name: "⏪ Back to Main Menu", value: "back" },
					],
				},
			]);

			if (field === "back") return;

			const updates = await this.getFieldUpdates(field, task);
			await this.taskService.updateTask(taskId, updates);
			console.log("Task updated successfully!");
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

			const { taskId } = await inquirer.prompt([
				{
					type: "list",
					name: "taskId",
					message: "Select task to remove:",
					choices: [
						...tasks.map((task) => ({
							name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
							value: task.id,
						})),
						{ name: "⏪ Back to Main Menu", value: "back" },
					],
				},
			]);

			if (taskId === "back") return;

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
				return;
			}

			const success = await this.taskService.removeTask(taskId);
			if (success) {
				console.log("Task removed successfully!");
			} else {
				console.log("Failed to remove task.");
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
				const { name } = await inquirer.prompt([
					{
						type: "input",
						name: "name",
						message: "Enter new task name:",
						default: task.name,
						validate: (input) => input.trim().length > 0 || "Task name cannot be empty",
					},
				]);
				return { name };

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
				return { priority };

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
				return { category };

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
				return { dueDate: new Date(dueDate) };

			case "isCompleted":
				const { isCompleted } = await inquirer.prompt([
					{
						type: "list",
						name: "isCompleted",
						message: "Select completion status:",
						choices: [
							{ name: "Completed", value: true },
							{ name: "Pending", value: false },
						],
						default: task.isCompleted,
					},
				]);
				return { isCompleted };

			default:
				return {};
		}
	}
}
