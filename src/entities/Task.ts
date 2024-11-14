import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Priority } from "../types/types";

/**
 * Entity representing a task.
 */
@Entity()
export class Task {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	name!: string;

	@Column({
		type: "simple-enum",
		enum: Priority,
	})
	priority!: Priority;

	@Column()
	category!: string;

	@Column()
	dueDate!: Date;

	@Column()
	isCompleted!: boolean;

	/**
	 * Creates an instance of Task.
	 * @param name - The name of the task.
	 * @param priority - The priority of the task.
	 * @param category - The category of the task.
	 * @param dueDate - The due date of the task.
	 */
	constructor(name: string, priority: Priority, category: string, dueDate: Date) {
		this.name = name;
		this.priority = priority;
		this.category = category;
		this.dueDate = dueDate;
		this.isCompleted = false;
	}
}
