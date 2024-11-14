import { ITask, Priority } from "../types/types";
import { v4 as uuidv4 } from "uuid";

export class Task implements ITask {
	id: string;
	name: string;
	priority: Priority;
	category: string;
	dueDate: Date;
	isCompleted: boolean;

	constructor(name: string, priority: Priority, category: string, dueDate: Date) {
		this.id = uuidv4();
		this.name = name;
		this.priority = priority;
		this.category = category;
		this.dueDate = dueDate;
		this.isCompleted = false;
	}
}
