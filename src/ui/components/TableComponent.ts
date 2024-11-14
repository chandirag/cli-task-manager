import Table from "cli-table";
import { Task } from "../../entities/Task";

/**
 * Component responsible for rendering tasks in a formatted table view.
 * Uses cli-table for consistent and styled table output.
 */
export class TableComponent {
	/**
	 * Creates a new table instance with predefined styling and column configuration.
	 * @returns A configured Table instance ready for data
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
	 * Formats and displays a collection of tasks in a table format.
	 * Handles date formatting and status display.
	 * @param tasks - Array of tasks to display in the table
	 */
	public formatTasksToTable(tasks: Task[]): void {
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
}
