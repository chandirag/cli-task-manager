import { Repository } from "typeorm";
import { Task } from "../entities/Task";
import { AppDataSource } from "../config/database";
import { Priority } from "../types/types";

export class TaskRepository {
	private repository: Repository<Task>;

	constructor() {
		this.repository = AppDataSource.getRepository(Task);
	}

	async create(task: Task): Promise<Task> {
		return await this.repository.save(task);
	}

	async findAll(): Promise<Task[]> {
		return await this.repository.find();
	}

	async findById(id: string): Promise<Task | null> {
		return await this.repository.findOneBy({ id });
	}

	async update(task: Task): Promise<Task> {
		return await this.repository.save(task);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected ? result.affected > 0 : false;
	}

	async findByPriority(priority: Priority): Promise<Task[]> {
		return await this.repository.findBy({ priority });
	}

	async findByCategory(category: string): Promise<Task[]> {
		return await this.repository.findBy({ category });
	}

	async findAllSortedByDueDate(ascending: boolean = true): Promise<Task[]> {
		return await this.repository.find({
			order: {
				dueDate: ascending ? "ASC" : "DESC",
			},
		});
	}

	async getUniqueCategories(): Promise<string[]> {
		const result = await this.repository
			.createQueryBuilder("task")
			.select("DISTINCT task.category", "category")
			.getRawMany();
		return result.map((item) => item.category);
	}
}
