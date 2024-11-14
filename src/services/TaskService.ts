import { Task } from "../entities/Task";
import { Priority } from "../types/types";
import { TaskRepository } from "../repositories/TaskRepository";

export class TaskService {
	private taskRepository: TaskRepository;

	constructor(taskRepository: TaskRepository) {
		this.taskRepository = taskRepository;
	}

	async addTask(name: string, priority: Priority, category: string, dueDate: Date): Promise<Task> {
		const task = new Task(name, priority, category, dueDate);
		return await this.taskRepository.create(task);
	}

	async getAllTasks(): Promise<Task[]> {
		return await this.taskRepository.findAll();
	}

	async markTaskAsComplete(taskId: string): Promise<boolean> {
		const task = await this.taskRepository.findById(taskId);
		if (task) {
			task.isCompleted = true;
			await this.taskRepository.update(task);
			return true;
		}
		return false;
	}

	async removeTask(taskId: string): Promise<boolean> {
		return await this.taskRepository.delete(taskId);
	}

	async getTasksByPriority(priority: Priority): Promise<Task[]> {
		return await this.taskRepository.findByPriority(priority);
	}

	async getTasksByCategory(category: string): Promise<Task[]> {
		return await this.taskRepository.findByCategory(category);
	}

	async getTasksSortedByDueDate(ascending: boolean = true): Promise<Task[]> {
		return await this.taskRepository.findAllSortedByDueDate(ascending);
	}

	async getUniqueCategories(): Promise<string[]> {
		return await this.taskRepository.getUniqueCategories();
	}
}
