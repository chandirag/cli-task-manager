import { TaskService } from "../../services/TaskService";
import { Task } from "../../entities/Task";

/**
 * Abstract base class for UI components.
 * Provides common functionality and utilities used across different UI handlers.
 */
export abstract class BaseUI {
	protected taskService: TaskService;
	protected lastDisplayedTasks: Task[] | null = null;

	/**
	 * Creates an instance of BaseUI.
	 * @param taskService - The service for managing tasks
	 */
	constructor(taskService: TaskService) {
		this.taskService = taskService;
	}

	/**
	 * Validates a date string to ensure it's in the correct format and is a valid future date.
	 * @param input - The date string to validate in YYYY-MM-DD format
	 * @returns True if the date is valid, or an error message string if invalid
	 */
	protected validateDueDate(input: string): boolean | string {
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
	 * Type guard to check if an error is from user interruption (e.g., Ctrl+C).
	 * @param error - The error to check
	 * @returns True if the error is from user interruption
	 */
	protected isUserInterruptionError(error: unknown): boolean {
		return (
			error instanceof Error &&
			(error.message.includes("User force closed the prompt") || error.message.includes("Prompt was canceled"))
		);
	}
}
