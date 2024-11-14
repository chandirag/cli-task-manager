import { Repository, Between } from "typeorm";
import { Task } from "../entities/Task";
import { AppDataSource } from "../config/database";
import { Priority } from "../types/types";

/**
 * Repository for accessing task data.
 */
export class TaskRepository {
	private repository: Repository<Task>;

	/**
	 * Creates an instance of TaskRepository.
	 */
	constructor() {
		this.repository = AppDataSource.getRepository(Task);
	}

	/**
	 * Creates a new task in the database.
	 * @param task - The task to create.
	 * @returns A promise that resolves to the created task.
	 */
	async create(task: Task): Promise<Task> {
		return await this.repository.save(task);
	}

	/**
	 * Retrieves all tasks from the database.
	 * @returns A promise that resolves to an array of tasks.
	 */
	async findAll(): Promise<Task[]> {
		return await this.repository.find();
	}

	/**
	 * Finds a task by its ID.
	 * @param id - The ID of the task to find.
	 * @returns A promise that resolves to the task or null if not found.
	 */
	async findById(id: string): Promise<Task | null> {
		return await this.repository.findOneBy({ id });
	}

	/**
	 * Updates a task in the database.
	 * @param task - The task to update.
	 * @returns A promise that resolves to the updated task.
	 */
	async update(task: Task): Promise<Task> {
		return await this.repository.save(task);
	}

	/**
	 * Deletes a task from the database.
	 * @param id - The ID of the task to delete.
	 * @returns A promise that resolves to true if the task was deleted, otherwise false.
	 */
	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected ? result.affected > 0 : false;
	}

	/**
	 * Retrieves tasks by priority.
	 * @param priority - The priority to filter tasks by.
	 * @returns A promise that resolves to an array of tasks with the specified priority.
	 */
	async findByPriority(priority: Priority): Promise<Task[]> {
		return await this.repository.findBy({ priority });
	}

	/**
	 * Retrieves tasks by category.
	 * @param category - The category to filter tasks by.
	 * @returns A promise that resolves to an array of tasks with the specified category.
	 */
	async findByCategory(category: string): Promise<Task[]> {
		return await this.repository.findBy({ category });
	}

	/**
	 * Retrieves all tasks sorted by due date.
	 * @param ascending - Whether to sort in ascending order.
	 * @returns A promise that resolves to an array of tasks sorted by due date.
	 */
	async findAllSortedByDueDate(ascending: boolean = true): Promise<Task[]> {
		return await this.repository.find({
			order: {
				dueDate: ascending ? "ASC" : "DESC",
			},
		});
	}

	/**
	 * Retrieves unique categories from tasks.
	 * @returns A promise that resolves to an array of unique categories.
	 */
	async getUniqueCategories(): Promise<string[]> {
		const result = await this.repository
			.createQueryBuilder("task")
			.select("DISTINCT task.category", "category")
			.getRawMany();
		return result.map((item) => item.category);
	}

	/**
	 * Retrieves tasks by completion status.
	 * @param isCompleted - Whether to find completed or pending tasks
	 * @returns A promise that resolves to an array of tasks with the specified completion status
	 */
	async findByCompletion(isCompleted: boolean): Promise<Task[]> {
		return await this.repository.findBy({ isCompleted });
	}

	/**
	 * Retrieves tasks within a due date range.
	 * @param startDate - The start date of the range (inclusive)
	 * @param endDate - The end date of the range (exclusive)
	 * @returns A promise that resolves to an array of tasks due within the specified range
	 */
	async findByDueDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
		return await this.repository.find({
			where: {
				dueDate: Between(startDate, endDate),
			},
			order: {
				dueDate: "ASC",
			},
		});
	}
}
