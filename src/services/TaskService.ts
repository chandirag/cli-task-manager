import { Task } from "../entities/Task";
import { Priority } from "../types/types";
import { TaskRepository } from "../repositories/TaskRepository";

/**
 * Service for managing tasks.
 */
export class TaskService {
	private taskRepository: TaskRepository;

	/**
	 * Creates an instance of TaskService.
	 * @param taskRepository - The repository for task data access.
	 */
	constructor(taskRepository: TaskRepository) {
		this.taskRepository = taskRepository;
	}

	/**
	 * Adds a new task.
	 * @param name - The name of the task.
	 * @param priority - The priority of the task.
	 * @param category - The category of the task.
	 * @param dueDate - The due date of the task.
	 * @returns A promise that resolves to the created task.
	 */
	async addTask(name: string, priority: Priority, category: string, dueDate: Date): Promise<Task> {
		const task = new Task(name, priority, category, dueDate);
		return await this.taskRepository.create(task);
	}

	/**
	 * Retrieves all tasks.
	 * @returns A promise that resolves to an array of tasks.
	 */
	async getAllTasks(): Promise<Task[]> {
		return await this.taskRepository.findAll();
	}

	/**
	 * Marks a task as complete.
	 * @param taskId - The ID of the task to mark as complete.
	 * @returns A promise that resolves to true if the task was marked as complete, otherwise false.
	 */
	async markTaskAsComplete(taskId: string): Promise<boolean> {
		const task = await this.taskRepository.findById(taskId);
		if (task) {
			task.isCompleted = true;
			await this.taskRepository.update(task);
			return true;
		}
		return false;
	}

	/**
	 * Removes a task.
	 * @param taskId - The ID of the task to remove.
	 * @returns A promise that resolves to true if the task was removed, otherwise false.
	 */
	async removeTask(taskId: string): Promise<boolean> {
		return await this.taskRepository.delete(taskId);
	}

	/**
	 * Retrieves tasks by priority.
	 * @param priority - The priority to filter tasks by.
	 * @returns A promise that resolves to an array of tasks with the specified priority.
	 */
	async getTasksByPriority(priority: Priority): Promise<Task[]> {
		return await this.taskRepository.findByPriority(priority);
	}

	/**
	 * Retrieves tasks by category.
	 * @param category - The category to filter tasks by.
	 * @returns A promise that resolves to an array of tasks with the specified category.
	 */
	async getTasksByCategory(category: string): Promise<Task[]> {
		return await this.taskRepository.findByCategory(category);
	}

	/**
	 * Retrieves tasks sorted by due date.
	 * @param ascending - Whether to sort in ascending order.
	 * @returns A promise that resolves to an array of tasks sorted by due date.
	 */
	async getTasksSortedByDueDate(ascending: boolean = true): Promise<Task[]> {
		return await this.taskRepository.findAllSortedByDueDate(ascending);
	}

	/**
	 * Retrieves unique categories from tasks.
	 * @returns A promise that resolves to an array of unique categories.
	 */
	async getUniqueCategories(): Promise<string[]> {
		return await this.taskRepository.getUniqueCategories();
	}

	/**
	 * Updates a task.
	 * @param taskId - The ID of the task to update.
	 * @param updates - The updates to apply to the task.
	 * @returns A promise that resolves to the updated task.
	 */
	async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
		const task = await this.taskRepository.findById(taskId);
		if (task) {
			Object.assign(task, updates);
			return await this.taskRepository.update(task);
		}
		return null;
	}

	/**
	 * Gets a task by ID.
	 * @param taskId - The ID of the task to retrieve.
	 * @returns A promise that resolves to the task or null if not found.
	 */
	async getTaskById(taskId: string): Promise<Task | null> {
		return await this.taskRepository.findById(taskId);
	}
}
