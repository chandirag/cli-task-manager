import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Priority } from "../types/types";

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

	constructor(name: string, priority: Priority, category: string, dueDate: Date) {
		this.name = name;
		this.priority = priority;
		this.category = category;
		this.dueDate = dueDate;
		this.isCompleted = false;
	}
}
